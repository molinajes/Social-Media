var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var EmailTemplate = mongoose.model("EmailTemplate");

router.get('/', function(req, res, next) {
  if (req.query.templateId) {
    EmailTemplate
      .findOne({
        _id: req.query.templateId
      })

    .then(function(template) {
        res.send(template);
      })
      .then(null, next);
  } else {
    EmailTemplate
      .find({})

    .then(function(templates) {
        res.send(templates);
      })
      .then(null, next);
  }
});


router.post('/', function(req, res, next) {
  var update = req.body;
  var now = new Date();
  var start = new Date(now.getFullYear(), 0, 0);
  var diff = now - start;
  var oneDay = 1000 * 60 * 60 * 24;
  var day = Math.floor(diff / oneDay);
  update.reminderDay = (day % 14) + 1;

  if (update._id) {
    EmailTemplate
      .findOneAndUpdate({
        _id: update._id
      }, {
        $set: update
      })

    .then(function(template) {
        return res.send(template);
      })
      .then(null, next);
  } else {
    var emailTemplate = new EmailTemplate({
      "reminderDay": update.reminderDay,
      "htmlMessage": update.htmlMessage,
      "subject": update.subject,
      "fromEmail": update.fromEmail,
      "fromName": update.fromName,
      "purpose": update.purpose,
      "isArtist": update.isArtist,
    });
    emailTemplate
      .save()
      .then(function() {
        return res.send();
      })
      .then(null, next);
  }
});

router.get('/:templateId', function(req, res, next) {
  // var isArtist = true;
  // if(req.query.isArtist === "false") {
  //   isArtist = false;
  // }
  var templateId = req.params.templateId;
  EmailTemplate
    .findOne({
      _id: templateId
    })
    .then(function(template) {
      res.send(template);
    })
    .then(null, next);
})