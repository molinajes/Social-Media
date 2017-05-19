/*
    These environment variables are not hardcoded so as not to put
    production information in a repo. They should be set in your
    heroku (or whatever VPS used) configuration to be set in the
    applications environment, along with NODE_ENV=production
*/

module.exports = {
    "DATABASE_URI": process.env.MONGOLAB_URI,
    "SESSION_SECRET": process.env.SESSION_SECRET,
    "HOST_URI": process.env.HOST_URI,
    "SOUNDCLOUD": {
        "clientID": process.env.SOUNDCLOUD_CLIENT_ID,
        "clientSecret": process.env.SOUNDCLOUD_CLIENT_SECRET,
        "callbackURL": process.env.SOUNDCLOUD_CALLBACK_URL
    },
    "PAYPAL": {
        "clientID": process.env.PAYPAL_CLIENT_ID,
        "clientSecret": process.env.PAYPAL_CLIENT_SECRET,
        "mode": process.env.PAYPAL_ACCOUNT_MODE
    },
    "AWS": {
        "bucketName": process.env.S3_BUCKET_NAME,
        "prBucketName": process.env.S3_PRPLAN_BUCKET_NAME,
        "mixingBucketName": process.env.S3_MIXINGMASTERING_BUCKET_NAME,
        "profileimageBucketName" : process.env.S3_PROFILEIMAGE_BUCKET_NAME,
        "accessKeyId": process.env.AWS_ACCESS_KEY_ID,
        "secretAccessKey": process.env.AWS_SECRET_ACCESS_KEY
    },
    "INSTAGRAM": {
        "clientID": process.env.INSTAGRAM_CLIENT_ID,
        "clientSecret": process.env.INSTAGRAM_CLIENT_SECRET,
        "callbackUrl": process.env.INSTAGRAM_CALLBACK_URL
    },
    "TWITTER": {
        "consumerKey": process.env.TWITTER_CONSUMER_KEY,
        "consumerSecret": process.env.TWITTER_CONSUMER_SECRET,
        "callbackUrl": process.env.TWITTER_CALLBACK_URL
    },
    "FACEBOOK": {
        "clientID": process.env.FACEBOOK_APP_ID,
        "clientSecret": process.env.FACEBOOK_CLIENT_SECRET,
        "callbackURL": process.env.FACEBOOK_CALLBACK_URL
    },
    "GOOGLE": {
        "clientID": process.env.GOOGLE_CLIENT_ID,
        "clientSecret": process.env.GOOGLE_CLIENT_SECRET,
        "callbackURL": process.env.GOOGLE_CALLBACK_URL
    },
    "YOUTUBE": {
        'baseUrl': process.env.YOUTUBE_BASE_URL,
        'CLIENT_ID': process.env.YOUTUBE_CLIENT_ID,
        'CLIENT_SEC': process.env.YOUTUBE_CLIENT_SECRET,
        'REDIRECT_URL_VIDEO': process.env.YOUTUBE_REDIRECT_URL_VIDEO,
        'REDIRECT_URL_SUBSCRIBE': process.env.YOUTUBE_REDIRECT_URL_SUBSCRIBE
    },
    "ROOTURL": "https://artistsunlimited.com"
};