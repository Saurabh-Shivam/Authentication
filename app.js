// Used to keep secrets safe. NOTE:-> It is placed at the top of our file
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//Salting and Hashing passwords with bcrypt
const bcrypt = require("bcrypt");

const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));

// Connecting to the database
mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true
});

// // Creating new schema
// const userSchema = {
//     email: String,
//     password: String
// };

// Creating new schema for mongoose encryption
// Now userSchema is no longer simple js object, it is now an object created from mongoose Schema class
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// Creating new model
const User = mongoose.model("User", userSchema);

app.get('/', (req, res) => {

    res.render("home");

});

app.get('/login', (req, res) => {

    res.render("login");

});

app.get('/register', (req, res) => {

    res.render("register");

});

// Registering new users with email and password
app.post('/register', (req, res) => {

    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        // Creating new document
        const newUser = new User({
            email: req.body.username,
            // Hashing our password
            password: hash
        });

        // Savinng document to the database
        newUser.save(function (err) {
            if (err) {
                console.log(err);
            } else {
                res.render("secrets");
            }
        });
    });



});

// Enabling login feature for the users
app.post('/login', (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    // Checking in the database
    User.findOne({
        email: username
    }, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, function (err, result) {
                    if (result == true) {
                        res.render("secrets")
                    }
                });
            }
        }
    });

});

app.listen(3000, function () {
    console.log("Server is running on port 3000");
});