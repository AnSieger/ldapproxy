# ldapproxy

## Run ldapproxy

Environment variable:
- SERVER -> Server to connect to
- SEARCH_BASE -> Position for searching in LDAP tree (serverside)

By default the ldapproxy will be reachable at `port 389`.

### Example to run the ldapproxy 

`docker run --env SERVER='ldap://127.0.0.1:389' --env SEARCH_BASE='ou=Users,dc=openstack,dc=org' --name 'ldapproxy' --restart always -d ldapproxy`

## Run example LDAP Server for testing
docker run -d -p 389:389 --name ldap -t larrycai/openldap