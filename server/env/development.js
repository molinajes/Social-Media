module.exports = {
  "DATABASE_URI": "mongodb://localhost:27017/songScheduler",
  "SESSION_SECRET": "Optimus Prime is my real dad",
  "HOST_URI": "https://localhost",
  "SOUNDCLOUD": {
    "clientID": "8002f0f8326d869668523d8e45a53b90",
    "clientSecret": "7c896a35685064e133b6a01998f62714",
    "callbackURL": "https://localhost:1443/callback.html"
  },
  "PAYPAL": {
    "clientID": "AY-Ctvy_b96xnMiP5XTHl42lJEfKowCCBrC9Od8aAF83GWg2Mia-eyziJftfe9OFbT6ci7ksCuP_hzDe",
    "clientSecret": "EFGHOjkVjqwJwj08hdmb4umNTtSbCHJBZlsMyM-LqB-6u9yO79rluo4zeGgs3qJifa7IRyEbbqbokggu",
    "mode": "sandbox"
  },
  "AWS": {
    "bucketName": "premiersubmissions",
    "prplanBucketName": "prplans",
    "mixingmasteringBucketName": "mixingmastering",
    "profileimageBucketName": "auprofileimages",
    "accessKeyId": "AKIAIYT7INNPUXKJSNEA",
    "secretAccessKey": "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"
  },
  "INSTAGRAM": {
    "clientID": "0b2ab47baa464c31bf6d8e9f301d4469",
    "clientSecret": "bc084d93e74c4210ab26340bca24c79a",
    "callbackUrl": "https://localhost:1443/download"
  },
  "TWITTER": {
    "consumerKey": "5zGuJpzTAqoHOuRdziAhf5OtG",
    "consumerSecret": "4edfdG7GZpxPv7nannqnhPEPseVqGLz1RPcCta8lXl4UPSOexG",
    "callbackUrlDL": "https://localhost:1443/download",
    "callbackUrlAuth": "https://localhost:1443/auth/twitter/callback",
  },
  "FACEBOOK": {
    "clientID": "1576897469267996",
    "clientSecret": "ef30ab338772e9df0a81178e57037b2f",
    "callbackURL": "https://localhost:1443/auth/facebook/callback"
  },
  "GOOGLE": {
    "clientID": "634697887081-8b5r68vcomte522nst8d5nh2otf3nrvk.apps.googleusercontent.com",
    "clientSecret": "V0Kno41hqbns3XbVmdiwh17r",
    "callbackURL": "https://localhost:1443/auth/google/callback"
  },
  "YOUTUBE": {
    'baseUrl': 'https://localhost:1443',
    'CLIENT_ID': '634697887081-8b5r68vcomte522nst8d5nh2otf3nrvk.apps.googleusercontent.com',
    'CLIENT_SEC': 'V0Kno41hqbns3XbVmdiwh17r',
    'REDIRECT_URL_VIDEO': 'https://localhost:1443/download',
    'REDIRECT_URL_SUBSCRIBE': 'https://localhost:1443/api/download/callbacksubscribe'
  },
  "ROOTURL": "https://localhost:1443"
};