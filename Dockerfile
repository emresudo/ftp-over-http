## Nodejs V18
FROM node:alpine

LABEL org.opencontainers.image.source https://github.com/emresudo/ftp-over-http

WORKDIR /home/node/ftp-over-ssh
COPY . /home/node/ftp-over-ssh

RUN npm install

EXPOSE 4000

CMD [ "npm", "start"]