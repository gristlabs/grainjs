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
$BINDIR/tslint -p . || true
$BINDIR/jshint lib/ test/ || true

( echo "Building dist/grain-full*.js" \
  && $BINDIR/browserify dist/cjs/index.js -o dist/grain-full.debug.js -s grainjs \
  && $BINDIR/browserify dist/cjs/index.js -s grainjs -d | \
     $BINDIR/uglifyjs --mangle --compress -o dist/grain-full.min.js --source-map "content=inline,url=grain-full.min.js.map" \
) &

wait
