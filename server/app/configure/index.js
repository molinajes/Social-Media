'use strict';
var timeout = require('connect-timeout');

module.exports = function(app) {

    // setValue and getValue are merely alias
    // for app.set and app.get used in the less
    // common way of setting application variables.
    app.setValue = app.set.bind(app);

    app.getValue = function(path) {
        return app.get(path);
    };
    app.use(timeout('180s'));
    require('./app-variables')(app);
    require('./static-middleware')(app);
    require('./parsing-middleware')(app);

    // Logging middleware, set as application
    // variable inside of server/app/configure/app-variables.js
    app.use(app.getValue('log'));

    require('./authentication')(app);
    app.use('/api/facebookMessage', require('../routes/facebookMessage/facebookMessage.js'));

    require('./autoScripts');
    require('./security')(app);
    // require('./autoEmailer')();
};