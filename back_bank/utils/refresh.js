const { sign, verify, refreshVerify } = require('../utils/jwt_utils');
const jwt = require('jsonwebtoken');

const refresh = async (req, res) => {
  if (req.headers.authorization && req.headers.refresh) {
    const authToken = req.headers.authorization.split('Bearer ')[1];
    const refreshTokenFromClient = req.headers.refresh;

    const authResult = verify(authToken);
    const decoded = jwt.decode(authToken);

    if (decoded === null) {
      return res.status(401).json({
        ok: false,
        message: 'Not authorized',
      });
    }

    const refreshResult = await refreshVerify(refreshTokenFromClient, decoded.userid);

    if (authResult.ok === false && authResult.message === 'jwt expired') {
      if (refreshResult === false) {
        return res.status(401).json({
          ok: false,
          message: 'Refresh token is invalid',
        });
      } else {
        const user = { userid: decoded.userid, role: decoded.role };
        const newAccessToken = sign(user);

        return res.status(200).json({
          ok: true,
          data: {
            accessToken: newAccessToken,
            refreshToken: refreshTokenFromClient, // 기존 리프레시 토큰 재사용
          },
        });
      }
    } else if (authResult.ok === true) {
      return res.status(400).json({
        ok: false,
        message: 'Access token is not expired',
      });
    } else {
      return res.status(401).json({
        ok: false,
        message: 'Invalid access token',
      });
    }
  } else {
    return res.status(400).json({
      ok: false,
      message: 'Access token and refresh token are required',
    });
  }
};

module.exports = refresh;