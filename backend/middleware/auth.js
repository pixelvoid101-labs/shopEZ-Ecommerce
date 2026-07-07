const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'shopez-secret-key';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is missing',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Normalize both id and _id structures so controllers never fail to read user identity
    req.user = {
      ...decoded,
      id: decoded.id || decoded._id,
      _id: decoded.id || decoded._id
    };
    
    next();
  } catch (error) {
    console.error("JWT Verification Fail:", error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

const authenticateToken = verifyToken;
const isAdmin = verifyAdmin;

module.exports = {
  verifyToken,
  verifyAdmin,
  authenticateToken,
  isAdmin,
  JWT_SECRET,
};