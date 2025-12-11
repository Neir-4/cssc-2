// Role-based authorization middleware

// Admin-only access
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      details: 'Please login first'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access forbidden',
      details: 'Admin access required'
    });
  }
  
  next();
};

// Komting-only access
export const requireKomting = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      details: 'Please login first'
    });
  }
  
  if (req.user.role !== 'komting') {
    return res.status(403).json({
      error: 'Access forbidden',
      details: 'Komting access required'
    });
  }
  
  next();
};

// Admin or Komting access
export const requireAdminOrKomting = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      details: 'Please login first'
    });
  }
  
  if (!['admin', 'komting'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Access forbidden',
      details: 'Admin or Komting access required'
    });
  }
  
  next();
};

// Check if user owns resource or has admin/komting role
export const requireOwnershipOrElevated = (userIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please login first'
      });
    }
    
    // Admin and komting can access anything
    if (['admin', 'komting'].includes(req.user.role)) {
      return next();
    }
    
    // Check ownership
    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    if (resourceUserId && parseInt(resourceUserId) === req.user.id) {
      return next();
    }
    
    return res.status(403).json({
      error: 'Access forbidden',
      details: 'You can only access your own resources'
    });
  };
};