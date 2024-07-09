const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://52.14.71.69:443',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '', // '/api' 경로를 ''로 리다이렉트
      },
    })
  );
};