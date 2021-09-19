// Used to keep secrets safe. NOTE:-> It is placed at the top of our file
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// At first require this for using passport.js to add cookies and sessions
const session = require("express-session");
//Second
const passport = require("passport");
//Third
const passportLocalMongoose = require("passport-local-mongoose");
// oAuth 2.0 and to implement sign-in with google
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// find or create function for mongoose
const findoOrCreate = require("mongoose-findorcreate");


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));

//Initialising and using session
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

//Initialising and using passport
app.use(passport.initialize());
app.use(passport.session());


// Connecting to the database
mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true
});

// Creating new schema for mongoose encryption
// Now userSchema is no longer simple js object, it is now an object created from mongoose Schema class
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

// This will be used to hash and salt our passwords and to save our users into the mongodbb database
userSchema.plugin(passportLocalMongoose);

userSchema.plugin(findoOrCreate);

// Creating new model
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets"
        // If depicaction warning comes
        // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        // npm i mongoose-findorcreate
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get('/', (req, res) => {

    res.render("home");

});

// Authenticate Requests
app.get('/auth/google',
    passport.authenticate('google', {
        scope: ["profile"]
    }));

app.get('/auth/google/secrets',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect secrets.
        res.redirect('/secrets');
    });

app.get('/secrets', function (req, res) {

    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }

});

app.get('/login', (req, res) => {

    res.render("login");

});

app.get('/logout', (req, res) => {

    req.logout();
    res.redirect("/");

});

app.get('/register', (req, res) => {

    res.render("register");

});

// Registering new users with email and password
app.post('/register', (req, res) => {

    User.register({
        username: req.body.username
    }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.render("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });

});

// Enabling login feature for the users
app.post('/login', (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    })

});

app.listen(3000, function () {
    console.log("Server is running on port 3000");
});