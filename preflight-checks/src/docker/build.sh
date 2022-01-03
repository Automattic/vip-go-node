#!/bin/bash

set -ex;

# Tag images with the current commit SHA.
COMMIT="$(git rev-parse HEAD)"
IMAGE_TAG="vip-preflight-checks:$COMMIT"

# Create .dockerignore to prevent .git and scripts from being baked into image.
# Note that this will overwrite any .dockerignore already in the repo. However,
# that .dockerignore will have been written for a Dockerfile that we are also
# overwriting.
#
# Additionally ignore .npm and node_modules that may have been committed to the
# repo, accidentally or otherwise. We install dependencies inside the build
# container.
cat << EOF > .dockerignore
.dockerignore
.git
.npm
.npmrc
Dockerfile
build.sh
node_modules
EOF

# Some clients hardcode an NPM token and commit the file to their repo, while
# others may define it in an environment variable. Support either workflow
# without caching the .npmrc in image layers (see how NPMRC_FILE build arg is
# handled).
if [ -n "$NPM_TOKEN" ]; then
  NPMRC_FILE="//registry.npmjs.org/:_authToken=${NPM_TOKEN}"
elif [ -f .npmrc ]; then
  NPMRC_FILE=`cat .npmrc`
fi

# Inject provided environment variables into the build container as a list of
# exported shell variables that can be sourced when running the build. We must do
# it this way for two reasons:
#
# 1. Docker build RUN commands are not run in a login shell, so we have no
#    ability to use profiles or any other auto-sourced start-up files.
# 2. Each RUN command runs in a container resulting from the previous command, so
#    while we have access to the same filesystem and resources, anything that was
#    previously sourced or exported is no longer available.
#
# Exports must be provided via the NODE_BUILD_DOCKER_ENV environment variable and
# the format must match a Linux variable definition, e.g.:
#
# export var1="value1"
# export var2=value2
#
# This environment variable is provided by vip-go-api and properly escaped.

docker build \
  --build-arg NODE_IMAGE_TAG="$NODE_VERSION" \
  --build-arg NODE_BUILD_DOCKER_ENV \
  --build-arg NPMRC_FILE="$NPMRC_FILE" \
  -f $(dirname "$0")/Dockerfile \
  -t "$IMAGE_TAG" .

# Clean up
# docker rmi -f "$IMAGE_TAG" || :
rm -f .dockerignore

