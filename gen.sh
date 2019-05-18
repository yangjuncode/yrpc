#!/bin/sh

protoc --gogofaster_out=. yrpc.proto

pbjs --no-create --no-verify --no-convert --no-delimited --force-long   -t static-module -w commonjs -o javascript/yrpc/rpc.js yrpc.proto
pbts -o javascript/yrpc/rpc.d.ts javascript/yrpc/rpc.js

