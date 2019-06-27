# The instructions for the first stage
FROM node:10.16.0-alpine as first-stage

RUN mkdir /app

WORKDIR /app

COPY . /app

COPY yarn.lock /app/yarn.lock
COPY package.json /app/package.json

ENV PATH /app/node_modules/.bin:$PATH

RUN yarn
RUN yarn build

# The instructions for the second stage
FROM node:10.16.0-jessie-slim

WORKDIR /usr/src/app

COPY --from=first-stage /app/node_modules node_modules
COPY . .

EXPOSE 6001

ENTRYPOINT ["node /usr/src/app/dist/server.js"]
