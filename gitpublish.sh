#!/bin/bash

# Exit on errors.
set -o pipefail  # trace ERR through pipes
set -o nounset   # same as set -u : treat unset variables as an error
set -o errtrace  # same as set -E: inherit ERR trap in functions
trap 'echo Error in line "${BASH_SOURCE}":"${LINENO}"; exit 1' ERR
trap 'echo "Exiting on interrupt"; exit 1' INT


if [[ "$#" -lt 1 ]]; then
  echo "Usage: ./gitpublish.sh <master|branch|commit>"
  echo "Builds dist/ in the given commit, and merges into gitpublish branch."
  exit 2
fi

COMMIT="$1"
export PAGER=cat

# Remember the branch we were on.
branch=`git rev-parse --abbrev-ref HEAD`

git checkout "$COMMIT"
echo "Switched to $COMMIT (`git rev-parse --short HEAD`)"
./build.sh

sed -i "" -e '/^\/dist/d' .gitignore
git add .gitignore dist/

next_build_num=`git tag -l 'build/*' | awk -F/ '{if($2>max){max=$2}}END{print max+1}'`
tag="build/${next_build_num}"

git --no-pager diff --cached .gitignore
git --no-pager status

read -p "Commit as tag $tag and push (y/n)? " ANSWER
if [ "$ANSWER" != "y" ]; then
  echo "Aborted"
  exit 1
fi

git commit -m "Build dist/"
git tag $tag
git push origin $tag

echo "Returning to $branch"
