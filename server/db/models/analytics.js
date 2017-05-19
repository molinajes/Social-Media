var mongoose = require('mongoose');
var AuthSchema=new mongoose.Schema({
    userid:mongoose.Schema.ObjectId,
    facebook: {
        type: mongoose.Schema.Types.Mixed
    },
    twitter: {
        type: mongoose.Schema.Types.Mixed
    },
    instagram: {
        type: mongoose.Schema.Types.Mixed
    },
    youtube: {
        type: mongoose.Schema.Types.Mixed
    }
});
mongoose.model("AuthTokens",AuthSchema);
var AnalyticsSchema=new mongoose.Schema({
    userid:mongoose.Schema.ObjectId,
    socialid:String, //facebook, youtube, instagram, twitter
    data:{
      count:Number,
      date:Date
    }
});
mongoose.model("AnalyticsSchema",AnalyticsSchema);
// var schema = new mongoose.Schema({
//     pid: {
//         type: String
//     },
//     pageid: {
//         type: String
//     },
//     user: {
//         type: String,
//         index: { unique: true }
//     },
//     value: []
// });
//
// var twitter_schema = new mongoose.Schema({
//     userid: {
//         type: String,
//         index: { unique: true }
//     },
//     screen_name: {
//         type: String
//     },
//     follows:[]
// });
//
// var youtube_schema=new mongoose.Schema({}, { strict: false });
// var instagram_schema=new mongoose.Schema({}, { strict: false });

// mongoose.model("Analytics", schema);
// mongoose.model("Twitter",twitter_schema);
// mongoose.model("Youtube",youtube_schema);
// mongoose.model("Instagram",youtube_schema);
