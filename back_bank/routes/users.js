const router = require('express').Router();
const setup = require('../db_setup');
const sha = require('sha256');

router.post('/users/insertMember', async function (req, res) {
    console.log(req.body)
    const { mongodb, mysqldb } = await setup();
    mongodb
    .collection("user")
    .findOne({ id: req.body.id })
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
            if(result) {
              console.log("회원가입 성공");
              const sql = `insert into usersalt(userid, salt) values(?,?)`
              mysqldb.query(sql, [req.body.id, salt],
                (err,rows,fields) => {
                  if(err){
                    console.log(err);
                    res.json({ msg: "회원 가입 실패 : 서버 오류" });
                  }else{
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

module.exports = router;