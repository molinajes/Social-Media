'use strict';
var paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': 'live',
  'client_id': 'AS_XdXBWw77UyF_QkMtq53Dve9CueqCscfdqPH2Rk-ypPe1l3MhBMgZIUfCs9QoL3rR9FhtqVg5XDXVP',
  'client_secret': 'ELBPMRDOYTKJ060PVEyTMQwBvH2HwQEFWwSziOKp9hYG48z8UXendg3Us_9rlm3ioUMT3Go79KKd2VWa',
});


var paymentId = "PAY-2NK20372P96057906K6KBDGI";

paypal.payment.get(paymentId, function(error, payment1) {
  if (error) {
    console.log(error);
    throw error;
  } else {
    console.log("Paid");
    console.log(JSON.stringify(payment1));
    if (payment1.payer.payer_info) {
      paypal.payment.execute(paymentId, {
        payer_id: payment1.payer.payer_info.payer_id
      }, function(error, payment) {
        if (error) {
          console.log(error);
        } else {
          console.log('success');
          console.log(JSON.stringify(payment));
        }
      });
    }
  }
});