# auto-ecole.tn: Backend
## Main configuration: 
- set the environment variable `auto_ecole_jwtPrivateKey` ,to the secrete key that will be used to hash the jsonwebtoken, the server will not start without it
- start mongodb demon with`mongod --port 3200` 
- set the environment variable `auto_ecole_db` with the database connection string, the server will crash if not provided
## Other configuration
- set the environment variable `PORT` to chose what port the server should listen to

### Run the server with the default configuration
#### For Windows user:
set db="mongodb://localhost:3200/auto-ecole-dev";  set auto_ecole_jwtPrivateKey="secretKe_y"; nodemon app.js ;
#### For Linux user
export db="mongodb://localhost:3200/auto-ecole-dev" && export auto_ecole_jwtPrivateKey="secretKe_y" && nodemon
