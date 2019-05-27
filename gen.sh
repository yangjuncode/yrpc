#!/bin/sh

protoc --gogofaster_out=. yrpc.proto

pbjs --no-create --no-verify --no-convert --no-delimited --force-long   -t static-module -w es6 -o javascript/yrpc/yrpc.js yrpc.proto
pbts -o javascript/yrpc/yrpc.d.ts javascript/yrpc/yrpc.js

protoc -I . -I demo/ --yrpc_out=demo/ demo/demo-rpc.proto
