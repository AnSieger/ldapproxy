FROM node:latest
MAINTAINER AnSieger@mailbox.org

RUN mkdir /usr/ldap
WORKDIR /usr/ldap

RUN npm install ldapjs
COPY config.json .
COPY main.js .
COPY entrypoint.sh .
ENTRYPOINT ["bash","entrypoint.sh"]