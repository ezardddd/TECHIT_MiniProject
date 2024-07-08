const jwt = require('jsonwebtoken');
const setup = require('../db_setup');

const secret = process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!secret || !refreshSecret) {
  throw new Error('JWT secrets are not defined in environment variables');
}

module.exports = {
  sign: (user) => {
    const payload = {
      userid: user.userid,
      role: user.role,
    };

    return jwt.sign(payload, secret, {
      algorithm: 'HS256',
      expiresIn: '1m', // 테스트 위해 Access Token 유효 시간을 1분으로 설정
    });
  },

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

  refresh: () => {
    return jwt.sign({}, refreshSecret, {
      algorithm: 'HS256',
      expiresIn: '14d',
    });
  },

  refreshVerify: async (token, userid) => {
    try {
      jwt.verify(token, refreshSecret);
      const { mongodb } = await setup();
      const refreshToken = await mongodb.collection("refreshTokens").findOne({ userid: userid, token: token });
      if (refreshToken) {
        // 토큰의 생성 시간으로부터 경과된 시간 계산
        const currentTime = new Date();
        const tokenAge = (currentTime - refreshToken.createdAt) / 1000; // 초 단위로 변환
        
        // 리프레시 토큰의 만료 시간 (예: 14일)
        const maxAge = 14 * 24 * 60 * 60; // 14일을 초 단위로 변환
        
        if (tokenAge > maxAge) {
          console.log('Refresh token has expired');
          return false;
        }
        
        return true;
      } else {
        console.log('Refresh token not found or does not match');
        return false;
      }
    } catch (err) {
      console.error('Error verifying refresh token:', err);
      return false;
    }
  },
};