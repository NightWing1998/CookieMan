FROM node:13.6.0-alpine3.11 AS builder
WORKDIR /usr/src/temp
COPY package*.json ./
COPY tsconfig*.json ./
COPY ./src ./src
RUN npm install
RUN npm run build


FROM node:13.6.0-alpine3.11
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV="PRODUCTION"
ENV MONGODB_URI="mongodb://localhost:27107/cookieman"
ENV GRAPHQL="/graphql"

COPY --from=builder /usr/src/temp/dist ./dist

CMD npm start