#!/bin/sh

protoc --gogofaster_out=. yrpc.proto

pbjs --no-create --no-verify --no-convert --no-delimited --force-long   -t static-module -w commonjs -o javascript/yrpc/yrpc.js yrpc.proto
pbts -o javascript/yrpc/yrpc.d.ts javascript/yrpc/yrpc.js

