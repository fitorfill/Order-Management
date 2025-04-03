const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user ID from token payload to the request object
    // Ensure your Django JWT includes the user ID, typically as 'user_id' or 'id'
    if (!decoded.user_id) {
        console.error('JWT payload does not contain user_id:', decoded);
        return res.status(403).json({ message: 'Invalid token payload' });
    }
    req.userId = decoded.user_id;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid or malformed token' });
  }
};

module.exports = {
  verifyToken,
};
