#!/bin/bash

set -o errexit

BINDIR=./node_modules/.bin

echo "Rebuilding typescript (commonjs)"
rm -rf dist
mkdir -p dist
$BINDIR/tsc -p tsconfig/tsconfig.es2015.cjs.json

echo "Rebuilding typescript (es2015 modules)"
$BINDIR/tsc -p tsconfig/tsconfig.es2015.esm.json

echo "Linting"
$BINDIR/eslint index.ts lib test/{browser,lib,tools} || true

( echo "Building dist/grain-full*.js" \
  && $BINDIR/esbuild dist/cjs/index.js --bundle --platform=browser \
     --format=iife --global-name=grainjs \
     --outfile=dist/grain-full.debug.js \
     --sourcemap \
  && $BINDIR/esbuild dist/cjs/index.js --bundle --platform=browser \
     --format=iife --global-name=grainjs \
     --outfile=dist/grain-full.min.js \
     --sourcemap --minify \
) &

wait
