'use strict';
var router = require('express').Router();
module.exports = router;


router.use('/dbSync', require('./dbSync/dbSync.js'));
router.use('/', function(req, res, next) {
  if (!req.session._csrfSecret) {
    next(new Error('unauthorized'));
  } else {
    next();
  }
})
router.use('/login', require('./auth/login.js'));
router.use('/signup', require('./auth/signup.js'));
router.use('/submissions', require('./submissions/submissions.js'));
router.use('/accountsteps', require('./accountsteps/accountsteps.js'));
router.use('/events', require('./events/events.js'));
router.use('/soundcloud', require('./soundC/soundC.js'));
router.use('/database', require('./database/database.js'));
router.use('/download', require('./downloadTrack/downloadTrack.js'));
router.use('/premier', require('./premier/premier.js'));
router.use('/home', require('./home/home.js'));
router.use('/users', require('./user/user.js'));
router.use('/prplan', require('./prPlans/prPlans.js'));
router.use('/mixingmastering', require('./mixingMastering/mixingMastering.js'));
router.use('/trades/', require('./trades/trades.js'));
router.use('/editDB/', require('./editDB.js'));
router.use('/analytics', require('./downloadTrack/analytics.js'));
router.use('/posts/', require('./posts/posts.js'));
router.use('/aws/', require('./aws.js'));
router.use('/broadcast/', require('./broadcast.js'));
router.use('/customsubmissions/', require('./customSubmissions/customSubmissions.js'));
router.use('/search/', require('./search/search.js'));
router.use('/thirdpartyuser', require('./thirdparty/thirdpartyuser.js'));


router.use('/logout', function(req, res) {
  req.logout();
  return res.status(200).json({
    "success": "true",
    "message": "Logout Successful"
  });
});
// Make sure this is after all of
// the registered routes!
router.use(function(req, res) {
  res.status(404).end();
});