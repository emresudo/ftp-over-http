## Nodejs V18
FROM node:alpine

LABEL org.opencontainers.image.source https://github.com/nemrucloud/nodejs-expressjs

WORKDIR /app
COPY . /app

RUN npm install -g nodemon

COPY entrypoint /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

ENTRYPOINT [ "/usr/bin/entrypoint" ]