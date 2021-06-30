FROM node:latest
MAINTAINER AnSieger@mailbox.org

RUN mkdir /usr/ldap
RUN mkdir /usr/ldap/cert
WORKDIR /usr/ldap

RUN npm install ldapjs
COPY main.js .
COPY entrypoint.sh .
ENTRYPOINT ["bash","entrypoint.sh"]
