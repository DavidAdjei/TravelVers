const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require("passport");
const localStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const User = require("./models/user");
const expressSession = require("express-session");
const generateRoutes = require('./routes/routes');
const data = require('./data.json')
const fs = require('fs')
const app = express();
const port = process.env.PORT || 3100;
const GoogleStrategy = require('passport-google-oauth2').Strategy;
require('dotenv').config();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSession({
    secret: 'keyboard key',
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());


passport.use(new localStrategy(User.authenticate()));
passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://travel-vers.cyclic.app/auth/google/callback",
    passReqToCallback   : true
  },
    function (request, accessToken, refreshToken, profile, done) {
        User.createStrategy();
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return done(err, user);
        });
  }
));
// passport.serializeUser((user, done) => {
//   done(null, user._id);
// });

passport.serializeUser(User.serializeUser());

// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await User.findById(id);
//     done(null, user);
//   } catch (err) {
//     done(err, null);
//   }
// });
passport.deserializeUser(User.deserializeUser());



async function main() {
    try {
        await mongoose.connect(process.env.DATABASE);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
    }
}

main()
    .then(() => {
        generateRoutes(app, passport, User, data, fs);
        app.listen(port, () => {
            console.log(`Example app listening at http://localhost:${port}`)
        })
    })
    .catch((err) => {
        console.log('Start Up error: ', err)
    })

module.exports = { app, passport, data, fs };
