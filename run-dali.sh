#!/bin/bash

# Check for IP address
if [ -z "$1" ]
  then
    echo "Please specify the IP address of the DREEM2 server at the first argument!"
    exit
fi

source ~/dali-nodejs/setenv

node dreemnodejs.js -server http://$1:8080 -composition demo/tvdemo -dali -reload
