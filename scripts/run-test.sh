#!/bin/bash
# Start server in background, wait, run tests, kill server
cd /home/z/my-project

# Kill any existing
pkill -f "next-server" 2>/dev/null
sleep 1

# Start server
npx next dev -p 3000 -H 0.0.0.0 > /tmp/next-test.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready (max 30 seconds)
for i in $(seq 1 30); do
    if ss -tlnp | grep -q ":3000 "; then
        echo "Server ready after ${i}s"
        break
    fi
    sleep 1
done

if ! ss -tlnp | grep -q ":3000 "; then
    echo "Server failed to start"
    cat /tmp/next-test.log
    exit 1
fi

# Run tests
python3 /home/z/my-project/scripts/test-phase1.py

# Cleanup
kill $SERVER_PID 2>/dev/null
pkill -f "next-server" 2>/dev/null