#!/bin/bash

#update interval in seconds
updateInterval=15

#start explorer
forever start bin/cluster

#update
while true;
do 
    touch tmp/index.pid
    rm -f ./tmp/index.pid 
    node scripts/sync.js index update
    node scripts/sync.js market
    node scripts/peers.js
    echo "***** sleep $updateInterval seconds *****"
    sleep $updateInterval
done
