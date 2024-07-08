const speakeasy = require('speakeasy');
const setup = require('../db_setup');

const auth2FA = async (req, res, next) => {
  const { twoFactorToken } = req.body;
  const { mongodb } = await setup();

  try {
    const user = await mongodb.collection("user").findOne({ userid: req.userid });

    if (!user.twoFactorSecret) {
      return res.status(400).json({ msg: "2FA가 설정되지 않았습니다." });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorToken
    });

    if (verified) {
      next();
    } else {
      res.status(401).json({ msg: "2FA 인증 실패" });
    }
  } catch (error) {
    console.error('2FA 인증 오류:', error);
    res.status(500).json({ msg: "서버 오류" });
  }
};

module.exports = auth2FA;