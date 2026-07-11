#!/bin/bash
cd /home/z/my-project
pkill -f "next-server" 2>/dev/null; sleep 1
npx next dev -p 3000 -H 0.0.0.0 > /tmp/next-test.log 2>&1 &
for i in $(seq 1 30); do
    if ss -tlnp | grep -q ":3000 "; then break; fi
    sleep 1
done
if ! ss -tlnp | grep -q ":3000 "; then
    echo "Server failed"; cat /tmp/next-test.log; exit 1
fi
python3 /home/z/my-project/scripts/test-phase2.py
pkill -f "next-server" 2>/dev/null