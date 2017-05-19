'use strict';
var mongoose = require('mongoose');
var Submission = mongoose.model('Submission');
var paypal = require('paypal-rest-sdk');
var ppConfig = require('./../../env').PAYPAL;
var Promise = require('promise');
paypal.configure({
  'mode': ppConfig.mode,
  'client_id': ppConfig.clientID,
  'client_secret': ppConfig.clientSecret,
});
module.exports = {
  makePayment: function(price, itemName, returnURL, cancelURL) {
    if (itemName.length > 120) itemName = "Multiple Reposts";
    var create_payment_json = {
      "intent": "sale",
      "payer": {
        "payment_method": "paypal"
      },
      "redirect_urls": {
        "return_url": returnURL,
        "cancel_url": cancelURL
      },
      "transactions": [{
        "item_list": {
          "items": [{
            "name": itemName,
            "sku": "reposts",
            "price": parseFloat(price).toFixed(2),
            "currency": "USD",
            "quantity": 1
          }]
        },
        "amount": {
          "currency": "USD",
          "total": parseFloat(price).toFixed(2).toString()
        },
        "description": itemName
      }]
    };

    return new Promise(function(fulfill, reject) {
      paypal.payment.create(create_payment_json, function(error, payment) {
        if (error) {
          console.log(JSON.stringify(error))
          reject(error);
        } else {
          fulfill(payment);
        }
      });
    });
  },
  executePayment: function(paymentID, paymentJSON) {
    return new Promise(function(fulfill, reject) {
      paypal.payment.execute(paymentID, paymentJSON, function(error, payment) {
        if (error) {
          console.log(JSON.stringify(error))
          reject(error);
        } else {
          fulfill(payment);
        }
      });
    })
  },
  sendPayout: function(email, price, itemDescription, itemID) {
    var sender_batch_id = Math.random().toString(36).substring(9);
    if (itemDescription.length > 120) itemDescription = "Payout for Reposts";
    var create_payout_json = {
      "sender_batch_header": {
        "sender_batch_id": sender_batch_id,
        "email_subject": itemDescription
      },
      "items": [{
        "recipient_type": "EMAIL",
        "amount": {
          "value": price,
          "currency": "USD"
        },
        "receiver": email,
        "note": itemDescription,
        "sender_item_id": itemID
      }]
    };
    var sync_mode = 'true';

    return new Promise(function(fulfill, reject) {
      paypal.payout.create(create_payout_json, sync_mode, function(error, payout) {
        if (error) {
          return reject(error);
        } else {
          return fulfill(payout);
        }
      });
    });
  },
  sendRefund: function(amount, saleID) {
      var data = {
        "amount": {
          "currency": "USD",
          "total": amount.toFixed(2).toString()
        }
      }
      return new Promise(function(fulfill, reject) {
        paypal.sale.refund(saleID, data, function(error, refund) {
          if (error) {
            reject(error);
          } else {
            fulfill(refund);
          }
        });
      })
    }
    // sendInvoice: function(submission, channelID) {
    //   var index = submission.channelIDS.indexOf(channelID);
    //   Channel.findOne({
    //       channelID: channelID
    //     })
    //     .then(function(chan) {
    //       var invoice_json = {
    //         "merchant_info": {
    //           "email": "kevinwzimmermann@gmail.com",
    //           "first_name": "Kevin",
    //           "last_name": "Zimmermann",
    //           "business_name": "La Tropicál Distributions",
    //           "phone": {
    //             "country_code": "001",
    //             "national_number": "6179906330"
    //           },
    //           "address": {
    //             "line1": "4585 Ponce De Leon Blvd",
    //             "city": "Coral Gables",
    //             "state": "FL",
    //             "postal_code": "33143",
    //             "country_code": "US"
    //           }
    //         },
    //         "billing_info": [{
    //           "email": submission.email
    //         }],
    //         "items": [{
    //           "name": submission.title + " repost on " + chan.displayName + ".",
    //           "quantity": 1,
    //           "unit_price": {
    //             "currency": "USD",
    //             "value": chan.price
    //           }
    //         }],
    //         "note": submission.title + " repost on " + chan.displayName + ".",
    //         "payment_term": {
    //           "term_type": "NET_45"
    //         },
    //         "tax_inclusive": false,
    //         "total_amount": {
    //           "currency": "USD",
    //           "value": chan.price
    //         }
    //       };

  //       paypal.invoice.create(invoice_json, function(error, invoice) {
  //         if (error) {
  //           console.log(error);
  //         } else {
  //           paypal.invoice.send(invoice.id, function(error, rv) {
  //             if (error) {
  //               console.log(error);
  //             } else {
  //               submission.invoiceIDS[index] = invoice.id;
  //               Submission.findByIdAndUpdate(submission._id, submission)
  //                 .then(function(sub) {})
  //                 .then(null, console.log);
  //             }
  //           });
  //         }
  //       });
  //     })
  //     .then(null, console.log);
  // }
}