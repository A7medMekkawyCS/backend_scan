// middleware/authorizeRole.js
module.exports.authorizeRole = (roles) => {
  return (req, res, next) => {
    // تحقق إذا كان المستخدم موجود في req.user
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'User is not authenticated or role is missing',
      });
    }

    // تحقق من أن الدور المطلوب موجود في الأدوار المحددة
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  };
};
