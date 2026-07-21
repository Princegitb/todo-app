const { getAuth } = require('@clerk/express');

const protect = (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ message: 'Not authorized, missing or invalid Clerk token' });
    }

    req.auth = auth;
    req.userId = auth.userId;
    req.user = { id: auth.userId, _id: auth.userId };
    next();
  } catch (error) {
    console.error('Clerk Auth Middleware Error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token verification failed' });
  }
};

module.exports = { protect };

