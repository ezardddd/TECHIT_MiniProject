const { sign, verify, refreshVerify, refresh: generateRefresh } = require('../utils/jwt_utils');
const jwt = require('jsonwebtoken');
const setup = require('../db_setup');

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
        const newRefreshToken = generateRefresh();
        const currentTime = new Date();

        const { mongodb } = await setup();
        await mongodb.collection("refreshTokens").updateOne(
          { userid: decoded.userid },
          { $set: { token: newRefreshToken, createdAt: currentTime } },
          { upsert: true }
        );

        return res.status(200).json({
          ok: true,
          data: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
        });
      }
    } else {
      return res.status(400).json({
        ok: false,
        message: 'Access token is not expired',
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