var mongoose = require('mongoose');
var RepostEvent = mongoose.model('RepostEvent');

module.exports = function(repostEvent) {
  repostEvent.day = new Date(repostEvent.day);
  repostEvent.unrepostDate = new Date(repostEvent.unrepostDate);
  return RepostEvent.find({
    userID: repostEvent.userID,
    trackID: repostEvent.trackID,
    _id: {
      $ne: repostEvent._id
    },
    day: {
      $gt: ((new Date()).getTime() - 48 * 3600000)
    }
  }).then(function(events) {
    var blockEvents = events.filter(function(event) {
      event.day = new Date(event.day);
      event.unrepostDate = new Date(event.unrepostDate);
      var eventLowerBound = repostEvent.day.getTime();
      var eventUpperBound = repostEvent.unrepostDate > repostEvent.day ? repostEvent.unrepostDate.getTime() + 24 * 3600000 : repostEvent.day.getTime() + 48 * 3600000;
      var makeEventLowerBound = event.day.getTime();
      var makeEventUpperBound = event.unrepostDate > event.day ? event.unrepostDate.getTime() + 24 * 3600000 : event.day.getTime() + 48 * 3600000;
      return ((event.day.getTime() > eventLowerBound && event.day.getTime() < eventUpperBound) || (repostEvent.day.getTime() > makeEventLowerBound && repostEvent.day.getTime() < makeEventUpperBound));
    })
    if (blockEvents.length > 0) throw new Error('overlap');
    else return 'ok';
  })
}