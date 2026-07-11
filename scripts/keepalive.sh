#!/bin/bash
# Keep-alive script for Next.js standalone server
cd /home/z/my-project
while true; do
  if ! pgrep -f "next-server" > /dev/null 2>&1; then
    echo "$(date): Starting server..." >> /tmp/keepalive.log
    node .next/standalone/server.js >> /tmp/keepalive.log 2>&1
    echo "$(date): Server died, restarting in 2s..." >> /tmp/keepalive.log
    sleep 2
  fi
  sleep 3
done