const { sign, verify, refreshVerify } = require('../utils/jwt_utils');
const jwt = require('jsonwebtoken');

const refresh = async (req, res) => {
  if (req.headers.authorization && req.headers.refresh) {
    const authToken = req.headers.authorization.split('Bearer ')[1];
    const refreshTokenFromClient = req.headers.refresh;

    console.log('Refresh Token:', refreshTokenFromClient);
    console.log('Access Token:', authToken);

    const authResult = verify(authToken);
    const decoded = jwt.decode(authToken);

    if (decoded === null) {
      console.log('decoded가 널값');
      return res.status(401).json({
        ok: false,
        message: 'Not authorized',
      });
    }

    const refreshResult = await refreshVerify(refreshTokenFromClient, decoded.userid);

    if (authResult.ok === false) {
      if (refreshResult === false) {
        console.log('리프레시토큰 만료');
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
    } else {
      // 액세스 토큰이 아직 유효한 경우
      return res.status(200).json({
        ok: true,
        message: 'Access token is still valid',
        data: {
          accessToken: authToken,
          refreshToken: refreshTokenFromClient,
        },
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