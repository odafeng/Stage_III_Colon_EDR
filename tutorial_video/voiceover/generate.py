#!/usr/bin/env python3
"""Generate ElevenLabs voiceover + synced captions for the Style-A tutorial.

Two kinds of narration:
  - concept[]: one clip per region (open/flow/struct/git/priv/notebook/rules/start/close),
    placed at an absolute frame `from`.
  - demos[]:   a list of phrases per demo (eda/model/verify). Each phrase becomes BOTH an
    audio clip AND a caption cue, placed sequentially from the demo `anchor` (= clipStart)
    using the MEASURED audio length — so voice and subtitle are always in lock-step. The whole
    group is time-compressed (playbackRate) only if it would exceed the demo's clip_frames.

Outputs:
  remotion/public/audio/*.mp3      synthesised clips
  remotion/src/voiceover.ts        VO[] = {src, from, rate}   (audio for <Audio>)
  remotion/src/captions.ts         CAPTIONS = {eda|model|verify: [start_s,end_s,text][]}

API key from tutorial_video/.env (ELEVEN_LABS_API_KEY). Idempotent via text hash; --force
regenerates everything (use after changing voice_id/model_id, which the hash doesn't track).

  python3 voiceover/generate.py
  python3 voiceover/generate.py --force
  python3 voiceover/generate.py --manifest-only
"""
import json
import subprocess
import sys
import urllib.request
import urllib.error
import hashlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SCRIPT = HERE / "script.json"
AUDIO_DIR = ROOT / "remotion" / "public" / "audio"
VO_MANIFEST = ROOT / "remotion" / "src" / "voiceover.ts"
CAP_MANIFEST = ROOT / "remotion" / "src" / "captions.ts"
FFPROBE = "/opt/homebrew/bin/ffprobe"

FORCE = "--force" in sys.argv
MANIFEST_ONLY = "--manifest-only" in sys.argv


def load_key() -> str:
    env = ROOT / ".env"
    for line in env.read_text().splitlines():
        if line.strip().startswith("ELEVEN_LABS_API_KEY"):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("ELEVEN_LABS_API_KEY not found in .env")


def synth(key, cfg, text, out):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{cfg['voice_id']}?output_format={cfg['output_format']}"
    body = json.dumps({"text": text, "model_id": cfg["model_id"],
                       "voice_settings": cfg["voice_settings"]}).encode()
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            out.write_bytes(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs HTTP {e.code}: {e.read().decode()[:300]}")


def dur_frames(p, fps):
    r = subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", str(p)], capture_output=True, text=True)
    return float(r.stdout.strip()) * fps


def main():
    cfg = json.loads(SCRIPT.read_text())
    fps = cfg["fps"]
    gap = cfg.get("gap_frames", 7)
    max_rate = cfg.get("max_rate", 1.25)
    world_total = cfg["world_total"]
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    sig_path = AUDIO_DIR / ".sig.json"
    sigs = json.loads(sig_path.read_text()) if sig_path.exists() else {}
    key = None if MANIFEST_ONLY else load_key()

    def ensure(clip_key, text):
        mp3 = AUDIO_DIR / f"{clip_key}.mp3"
        sig = hashlib.sha1((cfg["voice_id"] + cfg["model_id"] + text).encode()).hexdigest()
        if not MANIFEST_ONLY and (FORCE or not mp3.exists() or sigs.get(clip_key) != sig):
            assert key is not None
            print(f"  synth {clip_key:12s} {text[:26]}…")
            synth(key, cfg, text, mp3)
            sigs[clip_key] = sig
        return mp3

    vo = []

    # ---- concept clips: anchored, rate to fit gap until next anchor -------
    anchors = sorted([c["from"] for c in cfg["concept"]] + [d["anchor"] for d in cfg["demos"]])
    for c in cfg["concept"]:
        mp3 = ensure(c["key"], c["text"])
        if not mp3.exists():
            continue
        d = dur_frames(mp3, fps)
        nxt = next((a for a in anchors if a > c["from"]), world_total)
        slot = nxt - c["from"]
        rate = round(min(max_rate, d / slot), 3) if d > slot else 1.0
        vo.append({"src": f"audio/{c['key']}.mp3", "from": c["from"], "rate": rate})

    # ---- demo phrase groups: voice-driven, captions follow the audio ------
    captions = {}
    for dm in cfg["demos"]:
        durs = []
        for i, ph in enumerate(dm["phrases"]):
            mp3 = ensure(f"{dm['key']}_{i}", ph)
            durs.append(dur_frames(mp3, fps) if mp3.exists() else 0.0)
        total = sum(durs) + gap * (len(durs) - 1)
        group_rate = round(total / dm["clip_frames"], 3) if total > dm["clip_frames"] else 1.0
        capped = min(group_rate, max_rate)
        cues = []
        t = 0.0
        for i, (ph, d) in enumerate(zip(dm["phrases"], durs)):
            eff = d / capped
            start_f = dm["anchor"] + t
            vo.append({"src": f"audio/{dm['key']}_{i}.mp3", "from": round(start_f), "rate": capped})
            cues.append([round(t / fps, 2), round((t + eff) / fps, 2), ph])
            t += eff + gap / capped
        captions[dm["key"]] = cues
        flag = "  ⚠ OVER clip even at max_rate" if group_rate > max_rate else ""
        print(f"  demo {dm['key']:8s} {total/fps:5.1f}s into {dm['clip_frames']/fps:5.1f}s  rate {capped}{flag}")

    if not MANIFEST_ONLY:
        sig_path.write_text(json.dumps(sigs, ensure_ascii=False, indent=2))

    vo.sort(key=lambda v: v["from"])
    rows = ",\n".join(f'  {{ src: "{v["src"]}", from: {v["from"]}, rate: {v["rate"]} }}' for v in vo)
    VO_MANIFEST.write_text(
        "// AUTO-GENERATED by voiceover/generate.py — do not edit by hand.\n"
        "export type VOClip = { src: string; from: number; rate: number };\n"
        f"export const VO: VOClip[] = [\n{rows}\n];\n")

    def cap_rows(cues):
        return ",\n".join(f'    [{c[0]}, {c[1]}, {json.dumps(c[2], ensure_ascii=False)}]' for c in cues)
    blocks = ",\n".join(f'  {k}: [\n{cap_rows(v)}\n  ]' for k, v in captions.items())
    CAP_MANIFEST.write_text(
        "// AUTO-GENERATED by voiceover/generate.py — do not edit by hand.\n"
        "export type Cue = [number, number, string];\n"
        f"export const CAPTIONS: Record<string, Cue[]> = {{\n{blocks}\n}};\n")

    print(f"\nwrote {VO_MANIFEST.name} ({len(vo)} clips) + {CAP_MANIFEST.name} ({len(captions)} demos)")


if __name__ == "__main__":
    main()
