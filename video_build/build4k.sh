#!/usr/bin/env bash
# Full 4K build: lossless frame capture -> high-bitrate H.264 -> crossfade assembly.
set -e
cd "$(dirname "$0")"
FF=$(node -e "console.log(require('ffmpeg-static'))")
mkdir -p norm4k output

enc4k(){ # framesdir out
  "$FF" -y -framerate 30 -i "$1/f%05d.jpg" -c:v libx264 -preset medium -crf 17 \
        -pix_fmt yuv420p -vf "fps=30,format=yuv420p" "$2" -loglevel error
}

echo "### [1/4] deck_a : capture @4K"
node capture4k.mjs deck_a 0 12
echo "### encode deck_a"; enc4k /tmp/f_deck_a norm4k/a.mp4; rm -rf /tmp/f_deck_a

echo "### [2/4] deck_c : capture @4K"
node capture4k.mjs deck_c 13 17
echo "### encode deck_c"; enc4k /tmp/f_deck_c norm4k/c.mp4; rm -rf /tmp/f_deck_c

echo "### [3/4] jupyter : launch server + capture @4K"
( cd ../tutorial_demo && jupyter lab --no-browser --port=8899 --ip=127.0.0.1 \
   --ServerApp.token='' --ServerApp.password='' --ServerApp.disable_check_xsrf=True \
   --allow-root --ServerApp.root_dir="$(pwd)" >/tmp/jlab4k.log 2>&1 & echo $! > /tmp/jlab4k.pid )
sleep 10
node capture4k_jupyter.mjs
kill "$(cat /tmp/jlab4k.pid)" 2>/dev/null || true
echo "### encode jupyter"; enc4k /tmp/f_jup norm4k/j.mp4; rm -rf /tmp/f_jup

echo "### [4/4] assemble (crossfades + final fade) @4K"
dur(){ "$FF" -i "$1" 2>&1 | grep -o "Duration: [0-9:.]*" | head -1 | cut -d' ' -f2 | awk -F: '{print ($1*3600)+($2*60)+$3}'; }
DA=$(dur norm4k/a.mp4); DJ=$(dur norm4k/j.mp4); DC=$(dur norm4k/c.mp4)
X=0.9
O1=$(awk "BEGIN{print $DA-$X}"); O2=$(awk "BEGIN{print $DA+$DJ-2*$X}")
TOTAL=$(awk "BEGIN{print $DA+$DJ+$DC-2*$X}"); FS=$(awk "BEGIN{print $TOTAL-0.6}")
echo "durations a=$DA j=$DJ c=$DC total=$TOTAL"
"$FF" -y -i norm4k/a.mp4 -i norm4k/j.mp4 -i norm4k/c.mp4 -filter_complex \
"[0][1]xfade=transition=fade:duration=$X:offset=$O1[ab];[ab][2]xfade=transition=fade:duration=$X:offset=$O2[v0];[v0]fade=t=out:st=$FS:d=0.6[v]" \
 -map "[v]" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart \
 output/tutorial_4k.mp4 -loglevel error

echo "### DONE"
"$FF" -i output/tutorial_4k.mp4 2>&1 | grep -E "Duration|Stream #0"
ls -lh output/tutorial_4k.mp4
