## Nodejs V18
FROM node:alpine

LABEL org.opencontainers.image.source https://github.com/emresudo/ftp-over-http

WORKDIR /ftp
COPY . /ftp

RUN npm install --production