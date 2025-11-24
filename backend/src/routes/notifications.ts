import express, { Response } from 'express';
import { pool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import {
  sendHabitReminder,
  sendStreakAlert,
  sendEncouragement,
} from '../services/notifications/twilio';

const router = express.Router();

router.use(authenticate);

// Get user notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.userId]
    );

    res.json({ notifications: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Send test reminder
router.post('/test-reminder', async (req: AuthRequest, res: Response) => {
  try {
    const { habitId } = req.body;

    // Get user phone number
    const userResult = await pool.query(
      'SELECT phone_number FROM users WHERE id = $1',
      [req.userId]
    );

    if (!userResult.rows[0]?.phone_number) {
      throw new AppError('Phone number not set', 400);
    }

    // Get habit
    const habitResult = await pool.query(
      'SELECT name FROM habits WHERE id = $1 AND user_id = $2',
      [habitId, req.userId]
    );

    if (habitResult.rows.length === 0) {
      throw new AppError('Habit not found', 404);
    }

    await sendHabitReminder(
      req.userId!,
      habitResult.rows[0].name,
      userResult.rows[0].phone_number
    );

    res.json({ message: 'Test reminder sent' });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to send test reminder' });
    }
  }
});

// Update notification preferences (future enhancement)
router.put('/preferences', async (req: AuthRequest, res: Response) => {
  // This would update user notification preferences
  // For now, just return success
  res.json({ message: 'Preferences updated' });
});

export default router;

