// Require our models -- these should register the model into mongoose
// so the rest of the application can simply call mongoose.model('User')
// anywhere the User model needs to be used.
require('./user');
require('./channel');
require('./submission');
require('./email');
require('./follower');
require('./trackedUser');
require('./downloadTrack');
require('./emailTemplate.js');
require('./paidRepostAccount.js');
require('./artistEmail.js');
require('./application.js');
require('./premierSubmission.js');
require('./repostEvent.js');
require('./prPlans.js');
require('./mixingMastering.js');
require('./trade.js');
require('./scEmails.js');
require('./analytics.js');
require('./post.js');
require('./customSubmission.js');
require('./networkAccount.js');