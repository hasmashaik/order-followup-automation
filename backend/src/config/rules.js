// Central place to tweak business rules — used by ruleEngine.js
module.exports = {
  UNCONFIRMED_HOURS: 2,          // rule 1
  DISPATCH_HOURS: 24,            // rule 2 (change to 12 in demo)
  HIGH_VALUE_THRESHOLD: 5000,    // rule 5
  // Internal status vocabulary that the rules recognise
  STATUS: {
    UNCONFIRMED: 'Unconfirmed',
    CONFIRMED: 'Confirmed',
    DISPATCHED: 'Dispatched',
    DELIVERED: 'Delivered',
    FAILED_DELIVERY: 'Failed Delivery',
    PENDING: 'Pending',
  },
};