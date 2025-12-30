// Middleware để kiểm tra user có phải super-admin không
const superAdminGuard = (req, res, next) => {
  // Kiểm tra user đã được authenticate chưa (từ authGuard)
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Kiểm tra role phải là super-admin
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ message: 'Forbidden: Super-admin access required' });
  }

  next();
};

module.exports = superAdminGuard;

