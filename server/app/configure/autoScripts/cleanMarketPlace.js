var mongoose = require('mongoose');
var Submission = mongoose.model('Submission');

module.exports = clearMP;
//every 5 hours
function clearMP() {
  setTimeout(function() {
    clearMP();
  }, 5 * 3600000);

  var noDupArray = [];
  Submission.find({
      status: 'pooled',
      pooledSendDate: {
        $gt: new Date()
      }
    }).sort({
      pooledSendDate: -1
    })
    .then(function(subs) {
      subs.forEach(function(sub) {
        if (noDupArray.indexOf(sub.trackID) != -1) {
          Submission.findByIdAndRemove(sub._id).then(function(data) {}).then(null, console.log);
        } else {
          noDupArray.push(sub.trackID);
        }
      })
    }).then(null, console.log);
}
