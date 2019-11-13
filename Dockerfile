FROM node:10.17.0

WORKDIR /app

COPY yarn.lock ./
COPY package.json ./

ENV PATH ./node_modules/.bin:$PATH
ENV NODE_ENV "production"

RUN yarn

COPY . .

RUN yarn build

EXPOSE 6001

CMD ["yarn", "prod"]
