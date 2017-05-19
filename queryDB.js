/*
 * @manDrillEmail : sending email module object
 * @mongoose : mongoose module object
 * @Follower : Follower module object
 * @csv : csv write stream module object
 */


var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/newEmails');
var fs = require('fs');
var csv = require('csv-write-stream');


var Schema = mongoose.Schema;
var SCEmailsSchema = new Schema({
    email: String,
    numTracks: Number,
    artist: Boolean,
    soundcloudID: Number,
    soundcloudURL: String,
    username: String,
    followers: Number,
    randomDay: Number
});

var SCEmails = mongoose.model('scemails_with_members', SCEmailsSchema);

var db = mongoose.connection;

db.on('error', function(err) {
    console.log('connection error', err);
});

db.once('open', function() {
    console.log('connected.');

    queryDBCSV({
        randomDay: {
            $in: [50]
        }
    });
});
// - 5/7: all from 


function queryDBCSV(query) {
    var headers = [
        'email',
        'numTracks',
        'artist',
        'soundcloudID',
        'soundcloudURL',
        'username',
        'followers',
        'randomDay'
    ];

    var writer = csv({
        headers: headers
    });
    writer.pipe(fs.createWriteStream('query28.csv'));

    var num = 0;
    var stream = SCEmails.find(query).stream();
    stream.on('data', function(flwr) {
        var row = [];
        headers.forEach(function(elm) {
            row.push(flwr[elm]);
        });
        num++;
        writer.write(row);
    });
    stream.on('close', function() {
        console.log(num);
        console.log('Writing CSV...');
        setTimeout(function() {
            process.exit();
            writer.end();
        }, 10000);

    });
    stream.on('error', function(err) {
        console.log(err);
    });
}



//to get email: node sendemailtodb.js {followers:{$gt:50000}} email
//run the query and send an email to every user that was queried
//mandrill email sending file - //server/app/mandrill/sendEmail.js

//to get csv: node sendemailtodb.js {followers:{$gt:50000}, randomDay:1} csv

//Follower.find({}, function (error, data) {
//    console.log(data);
//    res.json(data);
//});

// var mongoQuery = process.argv[2];
// var ProcessFlag = process.argv[3];

// if (ProcessFlag == "csv") {
//     createAndSendFile(mongoQuery);
//     console.log("CSV process");
// } else if (ProcessFlag == "email") {
//     processSendEmail(mongoQuery);
//     console.log("EMAIL process");
// } else {
//     console.error("Nothing to process. Bad request");
// }

// function processSendEmail(query) {
//     console.log(query);
// }

// console.log(mongoQuery);
// console.log(ProcessFlag);