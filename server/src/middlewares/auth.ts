import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Define an interface extending Express's Request to hold decoded user info
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "CUSTOMER" | "SUBAGENT" | "ADMIN";
  };
}

/**
 * Authentication Middleware:
 * Checks if the request contains a valid JWT in the Authorization header.
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  // Tokens are sent as "Bearer <token>" in the header
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No authentication token provided." });
  }

  try {
    const secret = process.env.JWT_SECRET || "ai_realty_secret_session_token_key_12345";
    const decoded = jwt.verify(token, secret) as AuthRequest["user"];
    req.user = decoded; // Store decoded user details in the request object
    next(); // Move to the next middleware or route controller
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired authentication token." });
  }
}

/**
 * Role-Based Authorization Middleware:
 * Restricts access to specific roles (e.g., ADMIN, SUBAGENT).
 * Must be used AFTER authenticateToken.
 */
export function authorizeRoles(...allowedRoles: ("CUSTOMER" | "SUBAGENT" | "ADMIN")[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Please login first." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden. Your role (${req.user.role}) is not authorized to access this resource.`
      });
    }

    next();
  };
}
