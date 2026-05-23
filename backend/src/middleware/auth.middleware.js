import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authorization token is required.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: 'JWT_SECRET is not configured.' });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.auth = payload;
    req.companyId = payload.companyId;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

export function requireCompanyId(req, res, next) {
  const companyId = req.companyId || req.auth?.companyId;

  if (!companyId) {
    return res.status(401).json({ message: 'Company context is required.' });
  }

  req.companyId = companyId;
  return next();
}
