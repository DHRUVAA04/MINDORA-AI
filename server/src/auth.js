import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'mindora_aurora_secret_key_2026';

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Also allow demo tokens for offline student usage
    if (token.startsWith('demo_')) {
      req.user = { id: 'usr_alex', name: 'Alex Chen', email: 'student@mindora.ai', role: 'student' };
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token is expired or invalid' });
  }
}

