import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { calculateStreak } from '../utils/streaks';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all habits for user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT h.*, 
       (SELECT COUNT(*) FROM track_logs WHERE habit_id = h.id AND completed = true) as total_completions
       FROM habits h
       WHERE h.user_id = $1
       ORDER BY h.created_at DESC`,
      [req.userId]
    );

    // Calculate streaks for each habit
    const habitsWithStreaks = await Promise.all(
      result.rows.map(async (habit) => {
        const streakData = await calculateStreak(habit.id, req.userId!);
        return {
          ...habit,
          ...streakData,
        };
      })
    );

    res.json({ habits: habitsWithStreaks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// Get single habit
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Habit not found', 404);
    }

    const habit = result.rows[0];
    const streakData = await calculateStreak(habit.id, req.userId!);

    res.json({ habit: { ...habit, ...streakData } });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch habit' });
    }
  }
});

// Create habit
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('frequency').isIn(['daily', 'weekly', 'monthly']),
    body('description').optional(),
    body('color').optional(),
    body('icon').optional(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const { name, description, frequency, target_days, color, icon } = req.body;

      const result = await pool.query(
        `INSERT INTO habits (user_id, name, description, frequency, target_days, color, icon)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          req.userId,
          name,
          description || null,
          frequency,
          target_days || 1,
          color || '#3B82F6',
          icon || null,
        ]
      );

      res.status(201).json({ habit: result.rows[0] });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create habit' });
      }
    }
  }
);

// Update habit
router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('frequency').optional().isIn(['daily', 'weekly', 'monthly']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, description, frequency, target_days, color, icon } = req.body;
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (name) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
      }
      if (frequency) {
        updates.push(`frequency = $${paramCount++}`);
        values.push(frequency);
      }
      if (target_days !== undefined) {
        updates.push(`target_days = $${paramCount++}`);
        values.push(target_days);
      }
      if (color) {
        updates.push(`color = $${paramCount++}`);
        values.push(color);
      }
      if (icon !== undefined) {
        updates.push(`icon = $${paramCount++}`);
        values.push(icon);
      }

      if (updates.length === 0) {
        throw new AppError('No fields to update', 400);
      }

      values.push(req.params.id, req.userId);
      const query = `UPDATE habits SET ${updates.join(', ')} WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new AppError('Habit not found', 404);
      }

      res.json({ habit: result.rows[0] });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update habit' });
      }
    }
  }
);

// Delete habit
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM habits WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Habit not found', 404);
    }

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete habit' });
    }
  }
});

export default router;

