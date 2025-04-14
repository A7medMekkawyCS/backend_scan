// middleware/authorizeRole.js
const authorizeRole = (roles) => {
  return (req, res, next) => {
    // إذا كان المستخدم ليس لديه صلاحية للوصول لهذه الصفحة، ارجع برسالة رفض.
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access forbidden" });
    }
    // إذا كانت الصلاحية موجودة، تابع.
    next();
  };
};

module.exports = { authorizeRole };
