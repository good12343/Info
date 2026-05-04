// src/middleware/roles.ts
export const requireRole = (role: string) => {
  return (req, res, next) => {
    const userRole = req.headers["x-role"]; // مؤقتًا
    if (userRole !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};