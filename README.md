# Next-Auth Salesforce DB Adapter

Uses [OAuth 2.0 JWT Bearer Flow for Server-to-Server Integration](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_jwt_flow.htm&type=5)

You would not want to use this because of API limits (~100k/24hrs) and because of the auth hop that's required prior to each db request?
