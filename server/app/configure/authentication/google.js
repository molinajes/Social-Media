'use strict';
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var mongoose = require('mongoose');
var UserModel = mongoose.model('User');
var loggedInUser = null;
module.exports = function(app) {
    var googleConfig = app.getValue('env').GOOGLE;
    var googleCredentials = {
        clientID: googleConfig.clientID,
        clientSecret: googleConfig.clientSecret,
        callbackURL: googleConfig.callbackURL
    };

    var createNewUser = function(token, refreshToken, profile) {
        return UserModel.create({
            email: profile.emails[0].value,
            google: {
                id: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                token: token,
                refreshToken: refreshToken
            }
        });
    };

    var updateUserCredentials = function(user, token, refreshToken, profile) {
        user.google.id = profile.id;
        user.google.name = profile.displayName;
        user.google.email = profile.emails[0].value;
        user.google.token = token;
        user.google.refreshToken = refreshToken;
        return user.save();
    };

    var verifyCallback = function(accessToken, refreshToken, profile, done) {
        UserModel.findOne({
                _id: loggedInUser._id
            })
            .then(function(user) {
                if (user) {
                    return updateUserCredentials(user, accessToken, refreshToken, profile);
                }
            })
            .then(function(userToLogin) {
                done(null, userToLogin);
            }, function(err) {
                console.error('Error creating user from Google authentication', err);
                done(err);
            });
    };

    /*
     * Get information of Logged In user
     */
    app.use(function(req, res, next) {
        loggedInUser = req.user;
        next();
    });

    passport.use(new GoogleStrategy(googleCredentials, verifyCallback));
    app.get('/auth/google', passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/youtube.upload'
        ]
    }));

    app.get('/auth/google/callback',
        passport.authenticate('google', {
            failureRedirect: '/login'
        }),
        function(req, res) {
            res.redirect('/artistTools/releaser');
        });
};