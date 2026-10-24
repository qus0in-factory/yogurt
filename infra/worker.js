export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/' || path === '/health' || path === '/api/health') {
      return Response.json({
        service: 'yogurt', environment: env.ENVIRONMENT, status: 'ok',
      });
    }
    return new Response('Not found', { status: 404 });
  },
};
