FROM node:10.17.0

WORKDIR /app

COPY yarn.lock ./
COPY package.json ./

ENV PATH ./node_modules/.bin:$PATH

RUN yarn

COPY . .

RUN yarn build

EXPOSE 6001

ENV NODE_ENV "production"

CMD ["yarn", "prod"]
