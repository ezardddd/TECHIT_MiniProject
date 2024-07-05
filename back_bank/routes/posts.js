const router = require('express').Router();
const setup = require('../db_setup');
const sha = require('sha256');
const authenticateToken = require("")
router.post('/user/posts',authenticateToken,async(req, res) => {
    const { mongodb, mysqldb } = await setup();
    const {title,content, currentAmount} = req.body;
    const author = req.user.userid;
    mysqldb.query('INSERT INTO posts (userid, title, content, goal, currentAmount, investorCount) VALUES (?, ?, ?, ?, 0, 0)'
        ,[title,content,currentAmount],(err , result) => {
        if(err){
            console.error('계시물 생성이 안됩니다.:', err);
            res.status(500).json({ msg: '서버 오류' });
        }else {
            res.status(201).json({ msg: '게시글이 생성되었습니다.', postId: result.insertId });
          }
    })


})

router.get('/user/list', async(req, res) => {

})

router.delete('/user/post', async(req, res) => {
    const { mongodb, mysqldb  } = await setup();
    const postId = req.body.id

    mysqldb.query('DELETE FROM post WHERE id = ?', [postId], (err, result) => {
        if (err) {
            console.err('게시물 삭제 실패:', err);
            res.status(500).json({ msg: '서버 오류'});
        } else if (result.affectedRows === 0){
            res.status(404).json({ msg: '해당 게시물을 찾을 수 없습니다.'});
        } else {
            res.status(200).json({ msg: '게시글이 삭제되었습니다.'});
        }            
    })

})


router.post('/user/post', async(req, res) => {

})








module.exports = router;