const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://54.252.180.21:443',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '', // '/api' 경로를 ''로 리다이렉트
      },
    })
  );
};