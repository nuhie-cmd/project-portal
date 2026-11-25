const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "project_portal_dev_secret_key";

/**
 * Verifies the Bearer JWT token from the Authorization header
 * and attaches the decoded user payload to req.user.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required. Please log in." });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ message: "Authentication token is missing." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: "Session expired or invalid token. Please log in again." });
  }
}

/**
 * Restricts route access to users whose role is in allowedRoles.
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. You do not have permission to perform this action.",
      });
    }
    return next();
  };
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  authorizeRoles,
};
