import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { calculateStreak } from '../utils/streaks';

const router = express.Router();

router.use(authenticate);

// Get today's habits with completion status
router.get('/today', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT h.*, 
       COALESCE(t.completed, false) as completed,
       t.notes as track_notes,
       t.date as track_date
       FROM habits h
       LEFT JOIN track_logs t ON t.habit_id = h.id AND t.date = $1 AND t.user_id = $2
       WHERE h.user_id = $2
       ORDER BY h.created_at DESC`,
      [today, req.userId]
    );

    // Add streak data
    const habitsWithStreaks = await Promise.all(
      result.rows.map(async (habit) => {
        const streakData = await calculateStreak(habit.id, req.userId!);
        return {
          ...habit,
          ...streakData,
        };
      })
    );

    res.json({ habits: habitsWithStreaks, date: today });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today\'s habits' });
  }
});

// Mark habit as completed
router.post(
  '/:habitId/complete',
  [body('date').optional().isISO8601(), body('notes').optional()],
  async (req: AuthRequest, res: Response) => {
    try {
      const { habitId } = req.params;
      const { date, notes } = req.body;

      // Verify habit belongs to user
      const habitCheck = await pool.query(
        'SELECT id FROM habits WHERE id = $1 AND user_id = $2',
        [habitId, req.userId]
      );

      if (habitCheck.rows.length === 0) {
        throw new AppError('Habit not found', 404);
      }

      const trackDate = date || new Date().toISOString().split('T')[0];

      // Upsert track log
      const result = await pool.query(
        `INSERT INTO track_logs (habit_id, user_id, date, completed, notes)
         VALUES ($1, $2, $3, true, $4)
         ON CONFLICT (habit_id, date) 
         DO UPDATE SET completed = true, notes = $4
         RETURNING *`,
        [habitId, req.userId, trackDate, notes || null]
      );

      // Calculate updated streak
      const streakData = await calculateStreak(parseInt(habitId), req.userId!);

      res.json({
        track: result.rows[0],
        streak: streakData,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to mark habit as completed' });
      }
    }
  }
);

// Mark habit as incomplete
router.post(
  '/:habitId/incomplete',
  [body('date').optional().isISO8601()],
  async (req: AuthRequest, res: Response) => {
    try {
      const { habitId } = req.params;
      const { date } = req.body;

      const habitCheck = await pool.query(
        'SELECT id FROM habits WHERE id = $1 AND user_id = $2',
        [habitId, req.userId]
      );

      if (habitCheck.rows.length === 0) {
        throw new AppError('Habit not found', 404);
      }

      const trackDate = date || new Date().toISOString().split('T')[0];

      const result = await pool.query(
        `INSERT INTO track_logs (habit_id, user_id, date, completed, notes)
         VALUES ($1, $2, $3, false, NULL)
         ON CONFLICT (habit_id, date) 
         DO UPDATE SET completed = false, notes = NULL
         RETURNING *`,
        [habitId, req.userId, trackDate]
      );

      const streakData = await calculateStreak(parseInt(habitId), req.userId!);

      res.json({
        track: result.rows[0],
        streak: streakData,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to mark habit as incomplete' });
      }
    }
  }
);

// Get calendar data (heatmap)
router.get('/calendar', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT t.date, t.completed, h.id as habit_id, h.name as habit_name, h.color
      FROM track_logs t
      JOIN habits h ON h.id = t.habit_id
      WHERE t.user_id = $1
    `;

    const params: any[] = [req.userId];

    if (startDate && endDate) {
      query += ` AND t.date >= $2 AND t.date <= $3`;
      params.push(startDate, endDate);
    } else {
      // Default to last 365 days
      const end = new Date();
      const start = new Date();
      start.setFullYear(start.getFullYear() - 1);
      query += ` AND t.date >= $2 AND t.date <= $3`;
      params.push(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
    }

    query += ` ORDER BY t.date DESC`;

    const result = await pool.query(query, params);

    // Group by date for heatmap
    const heatmapData: Record<string, any> = {};
    result.rows.forEach((row) => {
      if (!heatmapData[row.date]) {
        heatmapData[row.date] = {
          date: row.date,
          habits: [],
          totalCompleted: 0,
          totalHabits: 0,
        };
      }
      heatmapData[row.date].habits.push({
        habitId: row.habit_id,
        habitName: row.habit_name,
        completed: row.completed,
        color: row.color,
      });
      if (row.completed) {
        heatmapData[row.date].totalCompleted++;
      }
      heatmapData[row.date].totalHabits++;
    });

    res.json({
      heatmap: Object.values(heatmapData),
      summary: {
        totalDays: Object.keys(heatmapData).length,
        averageCompletion: Object.values(heatmapData).reduce(
          (acc: number, day: any) => acc + (day.totalCompleted / day.totalHabits || 0),
          0
        ) / Object.keys(heatmapData).length || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
});

// Get track logs for a specific habit
router.get('/:habitId/logs', async (req: AuthRequest, res: Response) => {
  try {
    const { habitId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify habit belongs to user
    const habitCheck = await pool.query(
      'SELECT id FROM habits WHERE id = $1 AND user_id = $2',
      [habitId, req.userId]
    );

    if (habitCheck.rows.length === 0) {
      throw new AppError('Habit not found', 404);
    }

    let query = `
      SELECT * FROM track_logs
      WHERE habit_id = $1 AND user_id = $2
    `;

    const params: any[] = [habitId, req.userId];

    if (startDate && endDate) {
      query += ` AND date >= $3 AND date <= $4 ORDER BY date DESC`;
      params.push(startDate, endDate);
    } else {
      query += ` ORDER BY date DESC LIMIT 100`;
    }

    const result = await pool.query(query, params);

    res.json({ logs: result.rows });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch track logs' });
    }
  }
});

export default router;

