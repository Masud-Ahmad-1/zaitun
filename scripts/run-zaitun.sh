#!/bin/bash
cd /home/z/my-project
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"
export HOME="/home/z"
export NODE_ENV=production
while true; do
  node node_modules/next/dist/bin/next start -p 3000 2>>/tmp/zaitun-err.log
  echo "$(date): restarted" >> /tmp/zaitun-err.log
  sleep 1
done