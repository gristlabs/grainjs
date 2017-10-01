#!/bin/bash

set -o errexit

BINDIR=./node_modules/.bin
mkdir -p dist

( echo "Building dist/grain-only.*.js" \
  && $BINDIR/browserify index.js -o dist/grain-only.debug.js --no-bundle-external \
  && $BINDIR/minify -o dist/grain-only.min.js < dist/grain-only.debug.js
) &

( echo "Building dist/grain-full*.js" \
  && $BINDIR/browserify index.js -o dist/grain-full.debug.js -s grainjs \
  && $BINDIR/minify -o dist/grain-full.min.js < dist/grain-full.debug.js
) &

wait
