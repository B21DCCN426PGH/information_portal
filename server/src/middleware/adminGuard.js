// Middleware để kiểm tra user có phải admin không
const adminGuard = (req, res, next) => {
  // Kiểm tra user đã được authenticate chưa (từ authGuard)
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Kiểm tra role
  if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }

  next();
};

module.exports = adminGuard;

