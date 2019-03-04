# auto-ecole.tn: Backend
## Main configuration: 
- set the environment variable `auto_ecole_jwtPrivateKey` , the server will not start without it
- start mongodb demon with`mongod --port 3200` (the databaase connection string will be added to an environment variable in the future)

## Other configuration
- set the environment variable `PORT` to chose what port the server should listen to
