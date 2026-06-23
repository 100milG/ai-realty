import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { Role } from "@prisma/client";
import { authenticateToken, AuthRequest } from "../middlewares/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "ai_realty_secret_session_token_key_12345";

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post("/register", async (req: Request, res: Response) => {
  const { email, password, name, phone, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required." });
  }

  try {
    // 1. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    // 2. Hash the user's password for security
    // The "10" is the cost factor (salt rounds). Higher = slower but more secure.
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Determine and map the user role (defaulting to CUSTOMER)
    let userRole: Role = Role.CUSTOMER;
    if (role === "SUBAGENT") userRole = Role.SUBAGENT;
    if (role === "ADMIN") userRole = Role.ADMIN;

    // 4. Create the new user in our database
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        passwordHash,
        role: userRole,
        emailVerified: false
      }
    });

    // 5. Generate a JSON Web Token (JWT) so they are logged in immediately
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "7d" } // Token expires in 7 days
    );

    // 6. Respond with token and user details (omit the password hash!)
    return res.status(201).json({
      message: "Registration successful!",
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error: any) {
    console.error("[register error]", error);
    return res.status(500).json({ error: "Internal server error during registration." });
  }
});

/**
 * POST /api/auth/login
 * Log in an existing user
 */
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    // 1. Retrieve user details by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // 2. Compare incoming plaintext password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // 3. Generate a JWT session token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 4. Return token & user info
    return res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error("[login error]", error);
    return res.status(500).json({ error: "Internal server error during login." });
  }
});

/**
 * GET /api/auth/profile
 * Retrieve profile details of the current logged-in user
 */
router.get("/profile", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.json(user);
  } catch (error) {
    console.error("[get profile error]", error);
    return res.status(500).json({ error: "Failed to retrieve profile details." });
  }
});

/**
 * PUT /api/auth/profile
 * Update profile details of the current logged-in user
 */
router.put("/profile", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { name, email, phone, password } = req.body;

  try {
    // 1. If email is being updated, check if it already exists for another user
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: "Email is already in use by another account." });
      }
    }

    // 2. Prepare data object for update
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // 3. Update the user in db
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // 4. Sign refreshed token
    const token = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. Return the updated user details (excluding password hash)
    return res.json({
      message: "Profile updated successfully!",
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone
      }
    });
  } catch (error) {
    console.error("[update profile error]", error);
    return res.status(500).json({ error: "Failed to update profile details." });
  }
});

export default router;
