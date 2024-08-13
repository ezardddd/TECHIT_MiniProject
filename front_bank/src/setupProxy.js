const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_BACKEND_URL || 'https://back-bank:443',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '', // '/api' 경로를 ''로 리다이렉트
      },
    })
  );
};