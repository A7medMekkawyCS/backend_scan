const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
      success: false,
      status: statusCode,
      message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  };
  
  // Custom response methods
  const enhanceResponse = (req, res, next) => {
    res.success = (data) => res.status(200).json({ success: true, ...data });
    res.created = (data) => res.status(201).json({ success: true, ...data });
    res.unauthorized = (message) => res.status(401).json({ success: false, message });
    res.forbidden = (message) => res.status(403).json({ success: false, message });
    res.notFound = (message) => res.status(404).json({ success: false, message });
    res.conflict = (message) => res.status(409).json({ success: false, message });
    res.internalServerError = (message, error) => {
      console.error(error);
      res.status(500).json({ success: false, message });
    };
    next();
  };
  
  module.exports = { errorHandler, enhanceResponse };