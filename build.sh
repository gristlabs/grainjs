#!/bin/bash

set -o errexit

BINDIR=./node_modules/.bin
mkdir -p dist

echo "Rebuilding typescript"
rm -rf build
$BINDIR/tsc

echo "Linting"
$BINDIR/tslint -p . || true
jshint lib/ test/ || true

( echo "Building dist/grain-full*.js" \
  && $BINDIR/browserify build/index.js -o dist/grain-full.debug.js -s grainjs \
  && $BINDIR/minify -o dist/grain-full.min.js < dist/grain-full.debug.js
) &

wait
