#!/bin/bash

# Exit on errors.
set -o pipefail  # trace ERR through pipes
set -o nounset   # same as set -u : treat unset variables as an error
set -o errtrace  # same as set -E: inherit ERR trap in functions
trap 'echo Error in line "${BASH_SOURCE}":"${LINENO}"; exit 1' ERR
trap 'echo "Exiting on interrupt"; exit 1' INT

if ! git diff --quiet HEAD ; then
  echo "Must be run in a clean checkout"
  exit 1
fi

BINDIR=./node_modules/.bin
NEXT_BUILD_NUM=`git tag -l 'build-*' | awk -F- '{if($2>max){max=$2}}END{print max+1}'`
TAG="build-${NEXT_BUILD_NUM}"
RELEASE_NAME="grainjs-$TAG"
TOKEN=`cat .publish-release-oauth-token`

echo "Building $TAG on `git rev-parse --abbrev-ref HEAD` for publishing"
./build.sh
npm test

read -p "Tag the build as $TAG and publish (y/n)? " ANSWER
if [ "$ANSWER" != "y" ]; then
  echo "Aborted"
  exit 1
fi

ASSET=`npm pack`
git tag $TAG
$BINDIR/publish-release --token $TOKEN --notes "Build from master" --assets $ASSET --tag $TAG --name="$RELEASE_NAME"
