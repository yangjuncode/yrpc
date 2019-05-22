#!/bin/sh

mkdir -p demo/
pbjs --no-create --no-verify --no-convert --no-delimited --force-long   -t static-module -w commonjs -o demo/demo.js demo.proto
pbts -o demo/demo.d.ts demo/demo.js

