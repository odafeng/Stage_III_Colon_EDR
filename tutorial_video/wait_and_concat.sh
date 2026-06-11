#!/usr/bin/env bash
cd /Users/huangshifeng/Desktop/Research/Oncology_Outcomes/stage_III_colon_edr/tutorial_video
# wait until both render jobs have exited
while pgrep -f "build_final.py deck" >/dev/null || pgrep -f "build_final.py clips" >/dev/null; do
  sleep 5
done
need="b0 b1 b2 b4 vid1 vid2 vid3 vid4 vid5 vid6 vid7"
for n in $need; do
  if [ ! -s "norm/$n.mp4" ]; then echo "MISSING norm/$n.mp4 — aborting concat"; exit 2; fi
done
echo "all 11 parts present; concatenating…"
python3 build_final.py concat
