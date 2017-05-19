var mongoose = require('mongoose');
var SubmissionGroup = mongoose.model('SubmissionGroup');

module.exports = function(app) {
  app.use(function(req, res, next) {
    var domain = req.headers.host;
    var subDomain = domain.split('.');
    if (subDomain.length > 2) {
      subDomain = subDomain[0];
      SubmissionGroup.find({
          title: subDomain
        })
        .then(function(sub) {

        });
    } else {
      next();
    }
  });
}