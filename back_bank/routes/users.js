const router = require('express').Router();
const setup = require('../db_setup');
const sha = require('sha256');
const jwt = require('../utils/jwt_utils');
const authJWT = require('../middleware/authJWT');
const refresh = require('../utils/refresh');

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
        //password 암호화
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
        const accessToken = jwt.sign({ userid: user.userid, role: user.role });
        const refreshToken = jwt.refresh();

        await mongodb.collection("refreshTokens").insertOne({
          userId: user.userid,
          token: refreshToken,
          createdAt: new Date()
        });

        res.json({
          msg: "로그인 성공",
          accessToken: accessToken,
          refreshToken: refreshToken,
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

router.get('/users/refresh', refresh);

router.post('/users/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(400);

  try {
    const { mongodb } = await setup();
    await mongodb.collection("refreshTokens").deleteOne({ token: refreshToken });
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "로그아웃 처리 중 오류가 발생했습니다." });
  }
});

module.exports = router;