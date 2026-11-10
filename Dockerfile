# == Stage 1 ==
FROM node:24-alpine AS build

WORKDIR /site

RUN apk add --no-cache python3

COPY package*.json ./

RUN npm ci

COPY src/ ./src
COPY static ./static
COPY tsconfig.json ./
COPY vite.config.ts ./

RUN mkdir /data

RUN npm run build

# == Stage 2 ==
FROM node:24-alpine

RUN apk add --no-cache python3

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /site/build ./build
COPY src/lib/server/migrations/ src/lib/server/migrations

RUN mkdir /data && chown node:node /data && mkdir /images && chown node:node /images

USER node

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_DIR=/data
ENV AERIAL_DIR=/images

EXPOSE 3000

CMD ["node", "build"]
