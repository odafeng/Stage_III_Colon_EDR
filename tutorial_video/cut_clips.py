#!/usr/bin/env python3
"""Cut/speed/scale demo clips from screen recordings per EDL, and emit per-clip SRT.

Reads edls.json (list of EDL objects from the workflow) and a VIDS map.
Outputs clips/<id>.mp4 (1920x1080, 30fps, no audio) and subs/<id>.srt.
"""
import json, os, subprocess, sys

ROOT = "/Users/huangshifeng/Desktop/Research/Oncology_Outcomes/stage_III_colon_edr"
REC = ROOT + "/教學影片"
TV = ROOT + "/tutorial_video"
BG = "0x070b16"  # deck background colour for letterbox padding

VID_FILE = {
    "vid1": "螢幕錄影 2026-06-10 晚上11.46.53.mov",
    "vid2": "螢幕錄影 2026-06-10 晚上11.54.15.mov",
    "vid3": "螢幕錄影 2026-06-10 晚上11.57.44.mov",
    "vid4": "螢幕錄影 2026-06-10 晚上8.09.59.mov",
    "vid5": "螢幕錄影 2026-06-10 晚上8.12.30.mov",
    "vid6": "螢幕錄影 2026-06-10 晚上9.08.26.mov",
    "vid6a": "螢幕錄影 2026-06-10 晚上9.08.26.mov",
    "vid6b": "螢幕錄影 2026-06-10 晚上9.08.26.mov",
    "vid7": "螢幕錄影 2026-06-10 晚上9.12.27.mov",
}


def srt_ts(t):
    h = int(t // 3600); m = int((t % 3600) // 60); s = int(t % 60)
    ms = int(round((t - int(t)) * 1000))
    if ms == 1000:
        s += 1; ms = 0
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_srt(subs, path):
    subs = sorted(subs, key=lambda x: x["start"])
    with open(path, "w", encoding="utf-8") as f:
        for i, c in enumerate(subs, 1):
            f.write(f"{i}\n{srt_ts(c['start'])} --> {srt_ts(c['end'])}\n{c['text']}\n\n")


def cut(edl):
    vid = edl["id"]
    src = os.path.join(REC, VID_FILE[vid])
    segs = edl["segments"]
    # Normalise so the clip's playback length == its subtitle span (subtitle sync
    # is the priority). The analysis agents were inconsistent between segment
    # speeds and subtitle timing, so apply one uniform correction factor per clip.
    raw_out = sum((s["src_end"] - s["src_start"]) / (float(s.get("speed", 1.0)) or 1.0)
                  for s in segs)
    subs_span = max((c["end"] for c in edl["subtitles"]), default=raw_out)
    factor = raw_out / subs_span if subs_span > 0 else 1.0
    print(f"[{vid}] raw_out={raw_out:.1f}s subs_span={subs_span:.1f}s factor={factor:.2f}",
          flush=True)
    parts, labels = [], []
    for i, s in enumerate(segs):
        sp = min(5.0, (float(s.get("speed", 1.0)) or 1.0) * factor)
        parts.append(
            f"[0:v]trim=start={s['src_start']}:end={s['src_end']},"
            f"setpts=(PTS-STARTPTS)/{sp}[t{i}]"
        )
        labels.append(f"[t{i}]")
    n = len(segs)
    concat = "".join(labels) + f"concat=n={n}:v=1:a=0[cat];"
    # reserve a bottom caption band (content in top 958px) so burned subtitles
    # never occlude screen content; top-align content, band filled with theme bg
    post = (
        "[cat]scale=1920:880:force_original_aspect_ratio=decrease,"
        f"pad=1920:1080:(ow-iw)/2:0:color={BG},"
        "setsar=1,fps=30,format=yuv420p[v]"
    )
    fc = ";".join(parts) + ";" + concat + post
    out = os.path.join(TV, "clips", f"{vid}.mp4")
    cmd = ["ffmpeg", "-y", "-i", src, "-filter_complex", fc,
           "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
           "-pix_fmt", "yuv420p", out, "-loglevel", "error"]
    print(f"[{vid}] {n} segs -> {out}", flush=True)
    subprocess.run(cmd, check=True)
    # NOTE: SRTs are NOT written here — they are re-timed/reworded downstream and
    # must not be clobbered by a re-cut. Write the initial SRT only if missing.
    srt_path = os.path.join(TV, "subs", f"{vid}.srt")
    if not os.path.exists(srt_path):
        write_srt(edl["subtitles"], srt_path)
    d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nk=1:nw=1", out], capture_output=True, text=True)
    print(f"[{vid}] done dur={d.stdout.strip()}s", flush=True)


def main():
    edls = json.load(open(os.path.join(TV, "edls.json"), encoding="utf-8"))
    only = sys.argv[1:]
    os.makedirs(os.path.join(TV, "clips"), exist_ok=True)
    os.makedirs(os.path.join(TV, "subs"), exist_ok=True)
    for edl in edls:
        if only and edl["id"] not in only:
            continue
        cut(edl)


if __name__ == "__main__":
    main()
