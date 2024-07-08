const { verify } = require('../utils/jwt_utils');

const authJWT = (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split('Bearer ')[1];
    const result = verify(token);
    if (result.ok) {
      req.userid = result.userid;
      req.role = result.role;
      next();
    } else {
      res.status(401).json({
        ok: false,
        message: result.message,
      });
    }
  } else {
    res.status(401).json({
      ok: false,
      message: 'No token provided',
    });
  }
};

module.exports = authJWT;