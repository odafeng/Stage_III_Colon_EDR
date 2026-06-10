#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
FF=$(node -e "console.log(require('ffmpeg-static'))")
mkdir -p output norm

enc(){ # in out extra_in_opts
  "$FF" -y $3 -i "$1" -vf "scale=1920:1080:flags=lanczos,fps=30,setsar=1,format=yuv420p" \
        -c:v libx264 -preset medium -crf 19 -an "$2" -loglevel error
}

echo "normalizing clips…"
enc clips/deck_a.webm  norm/a.mp4 "-ss 0.5"
enc clips/jupyter.webm norm/j.mp4 ""
enc clips/deck_c.webm  norm/c.mp4 ""

dur(){ "$FF" -i "$1" 2>&1 | grep -o "Duration: [0-9:.]*" | head -1 | cut -d' ' -f2 \
      | awk -F: '{print ($1*3600)+($2*60)+$3}'; }
DA=$(dur norm/a.mp4); DJ=$(dur norm/j.mp4); DC=$(dur norm/c.mp4)
X=0.9
O1=$(awk "BEGIN{print $DA-$X}")
O2=$(awk "BEGIN{print $DA+$DJ-2*$X}")
TOTAL=$(awk "BEGIN{print $DA+$DJ+$DC-2*$X}")
FADESTART=$(awk "BEGIN{print $TOTAL-0.6}")
echo "durations a=$DA j=$DJ c=$DC  offsets O1=$O1 O2=$O2 total=$TOTAL"

echo "cross-fading + final fade…"
"$FF" -y -i norm/a.mp4 -i norm/j.mp4 -i norm/c.mp4 -filter_complex \
"[0][1]xfade=transition=fade:duration=$X:offset=$O1[ab]; \
 [ab][2]xfade=transition=fade:duration=$X:offset=$O2[v0]; \
 [v0]fade=t=out:st=$FADESTART:d=0.6[v]" \
 -map "[v]" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart \
 output/tutorial_final.mp4 -loglevel error

echo "done → output/tutorial_final.mp4"
"$FF" -i output/tutorial_final.mp4 2>&1 | grep -E "Duration|Stream #0"
ls -lh output/tutorial_final.mp4
