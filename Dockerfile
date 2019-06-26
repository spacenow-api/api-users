# The instructions for the first stage
FROM node:10.16.0-alpine as first-stage

RUN mkdir /app

WORKDIR /app

ADD . /app
ADD yarn.lock /app/yarn.lock
ADD package.json /app/package.json

ENV PATH /app/node_modules/.bin:$PATH

RUN yarn install
RUN yarn build

# The instructions for the second stage
FROM node:10.16.0-jessie-slim

WORKDIR /usr/src/app

COPY --from=first-stage node_modules node_modules
COPY . .

EXPOSE 3001

ENTRYPOINT ["node /app/dist/server.js"]
