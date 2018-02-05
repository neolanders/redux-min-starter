const fs = require('fs')
const bodyParser = require('body-parser')
const jsonServer = require('json-server')
const jwt = require('jsonwebtoken')
const server = jsonServer.create()
const userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))
server.use(jsonServer.defaults()) // Set CORS default settings
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json())

const SECRET_KEY = '123456789'
const expiresIn = '1h'

// Create a token from a payload 
function createToken(payload){
    return jwt.sign(payload, SECRET_KEY, {expiresIn})
}

// Verify the token 
function verifyToken(token){
    return  jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ?  decode : err)
}

// Check if the user exists in database
function isAuthenticated({email, password}){
    return userdb.users.findIndex(user => user.email === email && user.password === password) !== -1
}

function addUser(newUser, res){
    const alreadyExist = userdb.users.findIndex(user => user.email === newUser.email) !== -1
    if(alreadyExist) {
        res.status(422).json({"errors":{"email":["user already eist"]}})
        return 
    }
    const nextIndex = userdb.users.length + 1;
    newUser.id = nextIndex;    
    userdb.users.push(newUser);
    const json = JSON.stringify(userdb, null, 4); // indent white-space insertion for pretty-printing
    fs.writeFile('users.json', json, 'utf8');
    res.status(200).json({"user":newUser})
}

function getUser({email, password}){
    return userdb.users.find(user => user.email === email && user.password === password);
}

server.post('/api/login', (req, res) => {
    res.header('Content-Type', 'application/json; charset=utf-8')
    const {email, password} = req.body.user
    if (isAuthenticated({email, password}) === false) {
        res.status(401).json({"errors":{"email_or_password":["is invalid"]}})
        return
    }
    const access_token = createToken({email, password})
    const user = getUser({email, password});
    res.status(200).json({"user":Object.assign(user, {"token": access_token})})
})

server.use('/api/users',  (req, res, next) => {
    res.header('Content-Type', 'application/json; charset=utf-8')    
    if (req.method === 'POST') { // Create new user
        addUser(req.body.user, res)
        return 
    }
    if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
      const status = 401
      const message = 'Bad authorization header'
      res.status(status).json({status, message})
      return
    }
    try {
       verifyToken(req.headers.authorization.split(' ')[1])
       next()
    } catch (err) {
      const status = 401
      const message = 'Error: access_token is not valid'
      res.status(status).json({status, message})
    }
})

server.listen(3000, () => {
  console.log('Run Auth API Server')

  console.log(`
    ==============================================
    -> Server 🏃 (running) on localhost:3000:
    ==============================================
    `)
})
