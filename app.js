const express =require ('express')
const cookieParser =require ('cookie-parser')
const logger =require ('morgan')
const indexRouter = require ('./src/rutes/index')
const session = require('express-session');
const Mongostore = require('connect-mongo')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt');
const ejs = require('ejs');



require('dotenv').config()


const app = express()

app.use(express.static('public'))
app.use(logger('dev'))


app.set('views', __dirname + '/public')
app.set('view engine', 'ejs')


app.use(session({
    secret: process.env.SESSION_SECRET || '123456',
    resave: true,
    saveUninitialized: true,
    store: Mongostore.create({mongoUrl: 'mongodb://localhost/session'})
}))

app.use(cookieParser(process.env.COOKIES_SECRET || '123456'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(indexRouter)


app.use(passport.initialize())
app.use(passport.session())

const isValidePassword = (user, password) => {
    return bcrypt.compareSync(password, user.password)
}

const createHash = (password) =>{
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null)
}

const checkAuth = (req, res, next) =>{
    if (req.isAuthenticate ()) {
        next()
    } else {
        res.redirect('/login')
    }
}

passport.use('login', new LocalStrategy(
    (username, password, done)=>{
        let user = Users.find(user => user.username === username)

        if (!user) {
            console.log(`No existe el usuario${username}`)
            return done (null, false, {message: `User not found`})
        }
        // if(!isValidePassword(user.password)){
        //     console.log(`Password incorrecto`)
        //     return done (null, false, {message: `Password incorrdct`})
        // }
        if (user.password !== password){
            console.log('Password incorrecto')
            return done (null, false, { message: 'Password incorrecto'})
        }
        done(null, user)
    }

))

passport.use('signup', new LocalStrategy({
    passReqToCallback: true
},(req, username, password, done) =>{
    let user = Users.find(user => user.username === username)
    const {name, email} = req.body

    if (user) {
        console.log(`El usuario ${username} ya existe`)
        return done (null, false, {message: 'user already exists'})
    }
let newUser = {
    id : Users.length +1,
    username,
    // password : createHash(password),
    password,
    name,
    email
}
    Users.push(newUser)
    return done (null, newUser.id)

}) )

passport.serializeUser((user,done) => {
    done(null,user.id)
})

passport.deserializeUser((id, done) =>{
    let user = Users.find( user => user.id === id)

    done (null,user)
})


module.exports = app;