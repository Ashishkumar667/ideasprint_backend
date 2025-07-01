export default {
  routes: [
    {
      method: 'POST',
      path: '/transactions/checkout',
      handler: 'transaction.createCheckoutSession',
      config: {
         auth: {
              scope: ['api::transaction.transaction.create'],
          }, 
        policies: [],
      },
    },
  ],
};
