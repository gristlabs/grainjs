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
  && $BINDIR/browserify build/index.js -s grainjs -d | \
     $BINDIR/uglifyjs --mangle --compress -o dist/grain-full.min.js --source-map "content=inline,url=grain-full.min.js.map" \
) &

wait
