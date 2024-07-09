const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://3.14.64.117:443',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '', // '/api' 경로를 ''로 리다이렉트
      },
    })
  );
};