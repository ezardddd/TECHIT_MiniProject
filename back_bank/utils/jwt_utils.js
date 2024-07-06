const jwt = require('jsonwebtoken');
const setup = require('../db_setup');

const secret = process.env.SECRET; //JWT 비밀키

module.exports = {
    // JWT 토큰 생성
  sign: (user) => {
    const payload = {
      userid: user.userid,
      role: user.role,
    };

    return jwt.sign(payload, secret, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });
  },
  // JWT 토큰 검증
  verify: (token) => {
    try {
      const decoded = jwt.verify(token, secret);
      return {
        ok: true,
        userid: decoded.userid,
        role: decoded.role,
      };
    } catch (err) {
      return {
        ok: false,
        message: err.message,
      };
    }
  },
  // 리프레시 토큰 생성
  refresh: () => {
    return jwt.sign({}, secret, {
      algorithm: 'HS256',
      expiresIn: '14d',
    });
  },
  // 리프레시 토큰 검증
  refreshVerify: async (token, userId) => {
    const { mongodb } = await setup();
    try {
      const refreshToken = await mongodb.collection("refreshTokens").findOne({ userId: userId });
      if (token === refreshToken.token) {
        try {
          jwt.verify(token, secret);
          return { ok: true };
        } catch (err) {
          return { ok: false, message: err.message };
        }
      } else {
        return { ok: false, message: 'Invalid refresh token' };
      }
    } catch (err) {
      return { ok: false, message: err.message };
    }
  },
};