var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var request = require('request');
var messengerAPI = require('../../messengerAPI/messengerAPI.js');
var moment = require('moment');
var User = mongoose.model('User');

router.get('/', function(req, res, next) {
    if (req.query['hub.verify_token'] === 'let_me_manage') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Error, wrong validation token');
    }
})

router.post('/', function(req, res) {
    var data = req.body;
    if (data.object == 'page') {
        data.entry.forEach(function(pageEntry) {
            if (pageEntry.messaging) {
                pageEntry.messaging.forEach(function(messagingEvent) {
                    console.log(JSON.stringify(messagingEvent));
                    if (messagingEvent.optin) {
                        receivedAuthentication(messagingEvent);
                    } else if (messagingEvent.message) {
                        if (!messagingEvent.is_echo) receivedMessage(messagingEvent);
                    } else if (messagingEvent.delivery) {
                        // receivedDeliveryConfirmation(messagingEvent);
                    } else if (messagingEvent.postback) {
                        receivedPostback(messagingEvent);
                    } else if (messagingEvent.read) {
                        readMessage(messagingEvent)
                    } else {
                        console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                    }
                })
            }
        })
    }
    res.sendStatus(200);
});

function readMessage(messagingEvent) {

}

function receivedAuthentication(message) {
    User.findById(message.optin.ref)
        .then(function(user) {
            if (!user.notificationSettings.facebookMessenger.messengerID) {
                messengerAPI.buttons(message.sender.id, "Hey, thanks for opting in! You can always change your notification settings here:", [{
                    type: 'web_url',
                    url: 'https://artistsunlimited.com/artistTools/profile',
                    title: 'Change settings'
                }])
                user.notificationSettings.facebookMessenger.messengerID = message.sender.id;
                user.notificationSettings.facebookMessenger.lastMessageDate = new Date();
                user.save()
            } else {
                User.find({
                        "notificationSettings.facebookMessenger.messengerID": message.sender.id
                    })
                    .then(function(users) {
                        users.forEach(function() {
                            user.notificationSettings.facebookMessenger.lastMessageDate = new Date();
                            user.save()
                        })
                    }).then(null, console.log);
            }
        })
}

function sendSignup(user) {

}

function receivedMessage(message) {
    User.find({
        'notificationSettings.facebookMessenger.messengerID': message.sender.id
    }).then(function(users) {
        users.forEach(function(user) {
            user.notificationSettings.facebookMessenger.lastMessageDate = new Date();
            user.save();
        })
        if (message.message.quick_reply && message.message.quick_reply.payload.includes('OPTIN YES')) {
            messengerAPI.typing(message.sender.id);
            messengerAPI.text(message.sender.id, "Ok.")
        } else if (users.length == 0) {
            messengerAPI.buttons(message.sender.id, 'Hey, please go here:', [{
                type: "web_url",
                url: "https://artistsunlimited.com",
                title: "Artists Unlimited"
            }]).then(null, console.log);
        } else {
            messengerAPI.quickReplies(message.sender.id, 'Hey, would you like to receive notifications for the next 24 hours?', [{
                content_type: "text",
                title: "Yes",
                payload: "OPTIN YES"
            }]);
        }


    })
}

function signupUser(messengerID) {

}

function receivedPostback(message) {

}

function processQuiz(truthy, quizID, questionNum, messengerID) {

}