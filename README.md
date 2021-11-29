# ldapproxy
docker run --env SERVER='ldap://127.0.0.1:389' --env SEARCH_BASE='ou=Users,dc=openstack,dc=org' --name 'ldapproxy' --restart always -d ldapproxy


#testing
docker run -d -p 389:389 --name ldap -t larrycai/openldap

docker build -t ldapproxy .
