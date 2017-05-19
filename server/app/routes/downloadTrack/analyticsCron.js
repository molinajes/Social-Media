// var cron = require('node-cron');
// cron.schedule('0 */59 3 * * *', function() {
//     console.log('running node cron every 3 hours and 59 minutes!!!');
//     var AuthTokens = mongoose.model("AuthTokens"),
//         AnalyticsSchema = mongoose.model("AnalyticsSchema");
//     AuthTokens.findOne({
//         userid: req.user._id,
//         "youtube.isValid": true
//     }, function(err, res_db) {
//         if (err || res_db === null) {
//             res.statusCode = 401;
//             res.send("database failure or null result :" + JSON.stringify(err));
//             return;
//         }
//         request.get({
//             url: "https://content.googleapis.com/youtube/v3/channels?part=statistics%2CcontentOwnerDetails&key=AIzaSyAMTf33Kl3OKP1ECNxhGT-qgg8zr_rB3LY&id=" + res_db.youtube.channel
//         }, function(err, response_youtube) {
//             if (err) {
//                 res.statusCode = 500;
//                 res.send("Internal server error");
//                 return;
//             }
//             response_youtube.body = JSON.parse(response_youtube.body);
//             (new AnalyticsSchema({
//                 userid: req.user._id,
//                 socialid: 'youtube',
//                 data: {
//                     count: response_youtube.body.items[0].statistics.subscriberCount,
//                     date: new Date()
//                 }
//             })).save();
//         });
//     });
// });
