const { sign, verify, refreshVerify } = require('./jwt_utils');
const setup = require('../db_setup');

const refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      ok: false,
      message: '리프레시 토큰 제공 안됨',
    });
  }

  try {
    const { mongodb } = await setup();
    const tokenDoc = await mongodb.collection("refreshTokens").findOne({ token: refreshToken });

    if (!tokenDoc) {
      return res.status(401).json({
        ok: false,
        message: '리프레시 토큰을 찾을 수 없음',
      });
    }

    const refreshResult = await refreshVerify(refreshToken, tokenDoc.userid);

    if (!refreshResult) {
      return res.status(401).json({
        ok: false,
        message: '잘못된 리프레시 토큰',
      });
    }

    const user = await mongodb.collection("user").findOne({ userid: tokenDoc.userid });
    if (!user) {
      return res.status(401).json({
        ok: false,
        message: '유저 찾을 수 없음',
      });
    }

    const newAccessToken = sign({
      userid: user.userid,
      role: user.role
    });

    return res.status(200).json({
      ok: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('리프레시 토큰 에러:', error);
    return res.status(500).json({
      ok: false,
      message: 'Internal server error',
    });
  }
};

module.exports = refresh;