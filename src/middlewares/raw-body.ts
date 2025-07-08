export default () => {
  return async (ctx, next) => {
    if (ctx.request.url === '/api/stripe/webhook') {
      ctx.disableBodyParser = true;
    }
    await next();
  };
};
