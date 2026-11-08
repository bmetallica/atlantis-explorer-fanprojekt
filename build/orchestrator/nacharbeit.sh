#!/bin/sh
# Nacharbeit an den Anfang der Warteschlange stellen: nacharbeit.sh OBJ-xxx
Q=/root/sga/build/orchestrator/queue.txt
{ echo "$1 rework"; cat "$Q"; } > "$Q.tmp" && mv "$Q.tmp" "$Q"
# Status auf "queued", damit warte_raeume.sh den Raum nicht als abnahmebereit zählt
for d in /root/sga/build/auftraege_raeume/$1 /root/sga/build/auftraege/$1; do
  [ -f "$d/status.json" ] && python3 -c "import json,sys;p=sys.argv[1];s=json.load(open(p));s['state']='queued';json.dump(s,open(p,'w'),indent=1)" "$d/status.json"
done
