import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::demo-schema.demo-schema', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized("User not authenticated");
    }

    const { data } = ctx.request.body;

    const entry = await strapi.entityService.create('api::demo-schema.demo-schema', {
      data: {
        ...data,
        users_permissions_user: user.id,
      },
    });

    return ctx.send({ data: entry });
  }
}));
