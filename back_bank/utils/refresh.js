const { sign, verify, refreshVerify } = require('../utils/jwt_utils');
const jwt = require('jsonwebtoken');


//토큰 갱신함수
const refresh = async (req, res) => {
  if (req.headers.authorization && req.headers.refresh) {
    const authToken = req.headers.authorization.split('Bearer ')[1];
    const refreshToken = req.headers.refresh;

    const authResult = verify(authToken);
    const decoded = jwt.decode(authToken);

    if (decoded === null) {
      return res.status(401).send({
        ok: false,
        message: 'Not authorized',
      });
    }

    const refreshResult = await refreshVerify(refreshToken, decoded.id);

    if (authResult.ok === false && authResult.message === 'jwt expired') {
      if (refreshResult.ok === false) {
        return res.status(401).send({
          ok: false,
          message: 'Not authorized',
        });
      } else {
        const newAccessToken = sign({ userid: decoded.id, role: decoded.role });

        return res.status(200).send({
          ok: true,
          data: {
            accessToken: newAccessToken,
            refreshToken,
          },
        });
      }
    } else {
      return res.status(400).send({
        ok: false,
        message: 'Access token is not expired',
      });
    }
  } else {
    return res.status(400).send({
      ok: false,
      message: 'Access token and refresh token are required for refresh',
    });
  }
};

module.exports = refresh;