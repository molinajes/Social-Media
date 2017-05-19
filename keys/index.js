var fs = require('fs');
module.exports = {
	google: {
		clientID: '366183496221-laqlnvl94llgrn43fsuupgh2jlgsvs4d.apps.googleusercontent.com',
		clientSecret: 'gaQgopM8BZ5G9HPX_lKWHy6F',
		callbackURL: 'http://localhost:1337/auth/google/callback'
	},
	github: {
	    // token on github: 362522a7bd83012f4fd45a6a9b0605ef39f4dd03//
		clientID: '5d800ac60952e6c080aa',
		clientSecret: 'ab3889fef138eba662776f935c597900711f9820',
		callbackURL: 'http://localhost:1337/auth/github/callback'
	},
	https: {
		cert: fs.readFileSync(__dirname + '/cert.pem'),
		key: fs.readFileSync(__dirname + '/key.pem')
	}
};
