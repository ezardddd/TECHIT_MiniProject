const router = require('express').Router();
const setup = require('../db_setup');
const sha = require('sha256');
const jwt = require('../utils/jwt_utils');
const authJWT = require('../middleware/authJWT');
const refresh = require('../utils/refresh');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

router.post('/users/refresh', refresh);

router.post('/users/insertMember', async function (req, res) {
  const { mongodb, mysqldb } = await setup();
  mongodb
    .collection("user")
    .findOne({ userid: req.body.id })
    .then((result) => {
      if (result) {
        res.json({ msg: "가입 실패 : 중복된 아이디입니다" });
      } else {
        const generateSalt = (length = 16) => {
          const crypto = require('crypto');
          return crypto.randomBytes(length).toString('hex');
        };

        const salt = generateSalt();
        console.log(req.body);
        req.body.pw = sha(req.body.pw + salt);
        mongodb
          .collection("user")
          .insertOne({
            userid: req.body.id,
            userpw: req.body.pw,
            username: req.body.name,
            email: req.body.email,
            securityQuestion: req.body.securityQuestion,
            securityAnswer: req.body.securityAnswer,
            register_date: new Date(),
          })
          .then((result) => {
            if (result) {
              console.log("회원가입 성공");
              const sql = `INSERT INTO UserSalt(userid, salt) VALUES(?,?)`;
              mysqldb.query(sql, [req.body.id, salt],
                (err, rows, fields) => {
                  if (err) {
                    console.log(err);
                    res.json({ msg: "회원 가입 실패 : 서버 오류" });
                  } else {
                    console.log('salt 저장 성공');
                    res.json({ msg: "회원 가입 되셨습니다" });
                  }
                });
            } else {
              console.log("회원가입 fail");
              res.json({ msg: "회원 가입 실패" });
            }
          })
          .catch((err) => {
            console.log(err);
            res.json({ msg: "회원 가입 실패 : 서버 오류" });
          });
      }
    })
    .catch((err) => {
      res.json({ msg: "회원 가입 실패 : 서버 오류" });
    });
});

router.post('/users/login', async (req, res) => {
  const { mongodb, mysqldb } = await setup();
  const { userid, userpw } = req.body;

  mysqldb.query('SELECT salt FROM UserSalt WHERE userid = ?', [userid], async (err, saltRows) => {
    if (err) {
      return res.status(500).json({ msg: "서버 오류" });
    }

    if (saltRows.length === 0) {
      return res.status(400).json({ msg: "사용자를 찾을 수 없습니다." });
    }

    const salt = saltRows[0].salt;

    try {
      const user = await mongodb.collection("user").findOne({ userid: userid });

      if (!user) {
        return res.status(400).json({ msg: "사용자를 찾을 수 없습니다." });
      }

      const hashedPassword = sha(userpw + salt);

      if (hashedPassword === user.userpw) {
        const accessToken = jwt.sign({
          userid: user.userid,
          role: user.role
        });
        const refreshToken = jwt.refresh();
        const currentTime = new Date();

        await mongodb.collection("refreshTokens").updateOne(
          { userid: user.userid },
          { $set: { token: refreshToken, createdAt: currentTime } },
          { upsert: true }
        );

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 14 * 24 * 60 * 60 * 1000 // 14일
        });

        res.json({
          msg: "로그인 성공",
          accessToken: accessToken,
          user: { userid: user.userid, username: user.username }
        });
      } else {
        res.status(400).json({ msg: "로그인 실패." });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "서버 오류" });
    }
  });
});

router.get('/users/me', authJWT, async (req, res) => {
  const { mongodb } = await setup();

  try {
    const user = await mongodb.collection("user").findOne({ userid: req.userid });
    if (user) {
      res.json({
        userid: user.userid,
        username: user.username,
        email: user.email
      });
    } else {
      res.status(404).json({ msg: "사용자를 찾을 수 없습니다." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "서버 오류" });
  }
});

router.post('/users/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ msg: "로그아웃 성공" });
});

router.post('/users/setup2fa', authJWT, async (req, res) => {
  const { mongodb } = await setup();
  const secret = speakeasy.generateSecret({ 
    length: 32,
    name: `5조 뱅크:${req.userid}`,
    issuer: 'Group 5 Bank',
    algorithm: 'sha256'
  });

  try {
    await mongodb.collection("user").updateOne(
      { userid: req.userid },
      { $set: { 
        twoFactorSecret: secret.base32,
        twoFactorAlgorithm: 'sha256'
      } }
    );

    const otpauth_url = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: `5조 뱅크:${req.userid}`,
      issuer: 'Group 5 Bank',
      algorithm: 'sha256'
    });

    qrcode.toDataURL(otpauth_url, (err, data_url) => {
      if (err) {
        console.error('QR 코드 생성 오류:', err);
        return res.status(500).json({ msg: "QR 코드 생성 오류" });
      }
      res.json({ secret: secret.base32, qr_code: data_url });
    });
  } catch (error) {
    console.error('2FA 설정 오류:', error);
    res.status(500).json({ msg: "서버 오류" });
  }
});

router.post('/users/verify2fa', authJWT, async (req, res) => {
  const { token } = req.body;
  const { mongodb } = await setup();

  try {
    const user = await mongodb.collection("user").findOne({ userid: req.userid });

    if (!user.twoFactorSecret) {
      return res.status(400).json({ msg: "2FA가 설정되지 않았습니다.", verified: false });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      algorithm: 'sha256'
    });

    if (verified) {
      res.json({ msg: "2FA 인증 성공", verified: true });
    } else {
      res.status(400).json({ msg: "2FA 인증 실패", verified: false });
    }
  } catch (error) {
    console.error('2FA 확인 오류:', error);
    res.status(500).json({ msg: "서버 오류", verified: false });
  }
});

router.get('/users/check2fa', authJWT, async (req, res) => {
  const { mongodb } = await setup();

  try {
    const user = await mongodb.collection("user").findOne({ userid: req.userid });
    
    if (!user) {
      return res.status(404).json({ msg: "사용자를 찾을 수 없습니다." });
    }

    const is2FAEnabled = !!user.twoFactorSecret;
    res.json({ is2FAEnabled });
  } catch (error) {
    console.error('2FA 상태 확인 오류:', error);
    res.status(500).json({ msg: "서버 오류" });
  }
});

module.exports = router;