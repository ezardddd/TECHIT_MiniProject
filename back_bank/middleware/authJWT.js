const { verify } = require('../utils/jwt_utils');

const authJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      ok: false,
      message: 'No token provided',
    });
  }

  const token = authHeader.split(' ')[1];
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
};

module.exports = authJWT;