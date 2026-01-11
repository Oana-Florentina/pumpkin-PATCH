const { CognitoJwtVerifier } = require('aws-jwt-verify');

const verifier = CognitoJwtVerifier.create({
  userPoolId: 'us-east-1_Cin2ct9cD',
  tokenUse: 'access',
  clientId: '2m43iktlg1prp1hdf4poemjtfb',
});

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = await verifier.verify(token);
    req.userId = payload.sub;
    req.userEmail = payload.username;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};

module.exports = authMiddleware;
