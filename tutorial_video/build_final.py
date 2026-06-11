#!/usr/bin/env python3
"""Assemble the final teaching video from an ordered manifest.

manifest.json = ordered list of items:
  {"type":"deck","name":"b1","from":0,"to":5}     -> render deck scene range [from,to]
  {"type":"clip","id":"vid7"}                      -> clips/vid7.mp4 + burn subs/vid7.srt

Pipeline: render/normalise each item to norm/<key>.mp4 (1920x1080, 30fps),
then xfade-concat the whole ordered list with short crossfades + final fade.
"""
import json, os, subprocess, sys

TV = "/Users/huangshifeng/Desktop/Research/Oncology_Outcomes/stage_III_colon_edr/tutorial_video"
# homebrew ffmpeg lacks libass; the bundled ffmpeg-static build has it (needed for subtitles)
FF = subprocess.run(["node", "-e", "console.log(require('ffmpeg-static'))"],
                    capture_output=True, text=True,
                    cwd=TV).stdout.strip() or "ffmpeg"
BG = "0x070b16"
XF = 0.6  # crossfade seconds
SUB_STYLE = ("FontName=PingFang TC,FontSize=16,Bold=1,PrimaryColour=&H00FFFFFF,"
             "OutlineColour=&H80000000,BackColour=&HA0000000,"
             "BorderStyle=4,Outline=0,Shadow=0,MarginV=14")


def run(cmd):
    subprocess.run(cmd, check=True)


def dur(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nk=1:nw=1", path], capture_output=True, text=True)
    return float(r.stdout.strip())


def render_deck(item):
    name, frm, to = item["name"], item["from"], item["to"]
    out = f"{TV}/norm/{name}.mp4"
    # lossless frame capture via deterministic seek engine, then encode
    run(["node", f"{TV}/capture.mjs", name, str(frm), str(to)])
    frames = f"/tmp/f_{name}"
    run([FF, "-y", "-framerate", "30", "-i", f"{frames}/f%05d.jpg",
         "-c:v", "libx264", "-preset", "medium", "-crf", "18",
         "-vf", "scale=1920:1080:flags=lanczos,fps=30,format=yuv420p",
         "-pix_fmt", "yuv420p", out, "-loglevel", "error"])
    subprocess.run(["rm", "-rf", frames])
    return out


def burn_clip(item):
    cid = item["id"]
    src = f"{TV}/clips/{cid}.mp4"
    srt = f"{TV}/subs/{cid}.srt"
    out = f"{TV}/norm/{cid}.mp4"
    vf = f"fps=30,format=yuv420p"
    if os.path.exists(srt):
        esc = srt.replace(":", "\\:")
        vf = f"subtitles='{esc}':force_style='{SUB_STYLE}',{vf}"
    run([FF, "-y", "-i", src, "-vf", vf,
         "-c:v", "libx264", "-preset", "medium", "-crf", "19",
         "-pix_fmt", "yuv420p", "-an", out, "-loglevel", "error"])
    return out


def xfade_concat(parts, out):
    durs = [dur(p) for p in parts]
    inputs = []
    for p in parts:
        inputs += ["-i", p]
    # chain xfades
    fc = []
    prev = "[0:v]"
    offset = 0.0
    for i in range(1, len(parts)):
        offset += durs[i - 1] - XF
        lbl = f"[x{i}]" if i < len(parts) - 1 else "[xv]"
        fc.append(f"{prev}[{i}:v]xfade=transition=fade:duration={XF}:offset={offset:.3f}{lbl}")
        prev = lbl
    total = sum(durs) - XF * (len(parts) - 1)
    fc.append(f"[xv]fade=t=out:st={total-0.6:.3f}:d=0.6[v]")
    fc_str = ";".join(fc)
    run([FF, "-y"] + inputs + ["-filter_complex", fc_str,
         "-map", "[v]", "-c:v", "libx264", "-preset", "slow", "-crf", "19",
         "-pix_fmt", "yuv420p", "-movflags", "+faststart", out, "-loglevel", "error"])
    print(f"total ~{total:.1f}s -> {out}")


def main():
    os.makedirs(f"{TV}/norm", exist_ok=True)
    os.makedirs(f"{TV}/output", exist_ok=True)
    manifest = json.load(open(f"{TV}/manifest.json", encoding="utf-8"))
    stage = sys.argv[1] if len(sys.argv) > 1 else "all"
    parts = []
    skip_existing = "--skip-existing" in sys.argv
    for item in manifest:
        key = item["name"] if item["type"] == "deck" else item["id"]
        out = f"{TV}/norm/{key}.mp4"
        have = os.path.exists(out) and os.path.getsize(out) > 0
        if skip_existing and have:
            pass  # reuse existing normalised part
        elif item["type"] == "deck" and stage in ("all", "deck"):
            out = render_deck(item)
        elif item["type"] == "clip" and stage in ("all", "clips"):
            out = burn_clip(item)
        parts.append(out)
    if stage in ("all", "concat"):
        xfade_concat(parts, f"{TV}/output/tutorial_final.mp4")


if __name__ == "__main__":
    main()
