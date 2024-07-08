const jwt = require('jsonwebtoken');
const setup = require('../db_setup');

const secret = process.env.SECRET;

module.exports = {
  sign: (user) => {
    const payload = {
      userid: user.userid,
      role: user.role,
    };

    return jwt.sign(payload, secret, {
      algorithm: 'HS256',
      expiresIn: '1m', 
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
    return jwt.sign({}, secret, {
      algorithm: 'HS256',
      expiresIn: '14d',
    });
  },
  refreshVerify: async (token, userid) => {
    const { mongodb } = await setup();
    try {
      const refreshToken = await mongodb.collection("refreshTokens").findOne({ userid: userid });
      if (refreshToken && token === refreshToken.token) {
        // 리프레시 토큰의 생성 시간으로부터 경과된 시간 계산
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