import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const { email, password, name, phone_number } = req.body;

      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError('User already exists', 409);
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, name, phone_number)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, name, created_at`,
        [email, passwordHash, name, phone_number || null]
      );

      const user = result.rows[0];
      const token = generateToken(user.id, user.email, user.name);

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Registration failed' });
      }
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const { email, password } = req.body;

      // Find user
      const result = await pool.query(
        'SELECT id, email, password_hash, name FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw new AppError('Invalid credentials', 401);
      }

      const user = result.rows[0];

      // Verify password
      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Generate token
      const token = generateToken(user.id, user.email, user.name);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Login failed' });
      }
    }
  }
);

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, phone_number, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }
});

// Update user profile
router.put(
  '/me',
  authenticate,
  [body('name').optional().trim().notEmpty(), body('phone_number').optional()],
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, phone_number } = req.body;
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (name) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }

      if (phone_number !== undefined) {
        updates.push(`phone_number = $${paramCount++}`);
        values.push(phone_number);
      }

      if (updates.length === 0) {
        throw new AppError('No fields to update', 400);
      }

      values.push(req.userId);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, name, phone_number`;

      const result = await pool.query(query, values);

      res.json({ user: result.rows[0] });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update user' });
      }
    }
  }
);

export default router;

