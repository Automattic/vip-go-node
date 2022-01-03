ARG NODE_IMAGE_TAG

FROM node:$NODE_IMAGE_TAG

WORKDIR /app

# Helper script /create-npmrc.sh
#
# Create .npmrc with the content of the NPMRC_FILE build arg. This can be used in
# a multipart RUN command to ensure that the token is not echoed or cached in
# image layers.
RUN echo 'printf "%b" "$NPMRC_FILE" > /app/.npmrc' > /create-npmrc.sh

# Helper script /export-env.sh
#
# Print the content of the NODE_BUILD_DOCKER_ENV build arg so that it can be
# sourced. This can be used in a multipart RUN command to ensure that this build
# arg is not echoed or cached in image layers.
RUN echo 'printf "%b" "$NODE_BUILD_DOCKER_ENV"' > /export-env.sh

# Standalone comments are not echoed in build output, but comments on the same
# line as commands are. "RUN true" with comment allows us to inject a "build
# marker" that can used to extract only a portion of the build output.

RUN true # ====== START: VIP NODE BUILD ======

COPY package*.json npm-shrinkwrap*.json ./

ARG NPMRC_FILE

RUN sh /create-npmrc.sh && \
    npm install --production --no-color && \
    rm .npmrc

COPY . .

ARG NODE_BUILD_DOCKER_ENV

RUN eval "$(sh /export-env.sh)" && \
    npm run build --no-color

RUN true # ====== END: VIP NODE BUILD ======

CMD [ "npm", "start" ]
