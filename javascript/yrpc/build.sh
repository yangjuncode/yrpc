#!/usr/bin/env bash

programPath=node_modules/.bin/
outDir=dist/

${programPath}tsc && \cp -r yrpc.d.ts yrpc.js ${outDir}/