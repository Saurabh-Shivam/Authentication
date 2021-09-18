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
    password: String
});

// This will be used to hash and salt our passwords and to save our users into the mongodbb database
userSchema.plugin(passportLocalMongoose);

// Creating new model
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// Saving the user data, eg-> saving messages into fortune cookkies 
passport.serializeUser(User.serializeUser());
// Using the user data, eg-> reading the messages from the fortune cokkies and deleting them
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) => {

    res.render("home");

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