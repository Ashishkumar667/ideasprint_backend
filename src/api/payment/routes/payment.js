module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/payment',
      handler: 'payment.handlePayment',
      config: {
        auth: true, 
      },
    },
  ],
};
