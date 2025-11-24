import express, { Response } from 'express';
import { pool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { getAIAdapter } from '../services/ai/adapter';
import { calculateStreak } from '../utils/streaks';

const router = express.Router();

router.use(authenticate);

// Get AI insights for a specific habit
router.get('/habit/:habitId', async (req: AuthRequest, res: Response) => {
  try {
    const { habitId } = req.params;

    // Get habit
    const habitResult = await pool.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [habitId, req.userId]
    );

    if (habitResult.rows.length === 0) {
      throw new AppError('Habit not found', 404);
    }

    const habit = habitResult.rows[0];

    // Get track logs
    const logsResult = await pool.query(
      `SELECT date, completed FROM track_logs
       WHERE habit_id = $1 AND user_id = $2
       ORDER BY date DESC`,
      [habitId, req.userId]
    );

    // Calculate streak
    const streakData = await calculateStreak(parseInt(habitId), req.userId!);

    // Get user context
    const userContextResult = await pool.query(
      `SELECT 
       COUNT(DISTINCT h.id) as total_habits,
       AVG(
         (SELECT COUNT(*) FILTER (WHERE completed = true)::float / NULLIF(COUNT(*), 0) * 100
          FROM track_logs WHERE habit_id = h.id)
       ) as avg_consistency
       FROM habits h
       WHERE h.user_id = $1`,
      [req.userId]
    );

    const userContext = {
      userId: req.userId!,
      totalHabits: parseInt(userContextResult.rows[0]?.total_habits || '0'),
      averageConsistency: parseFloat(userContextResult.rows[0]?.avg_consistency || '0'),
    };

    // Generate AI insight
    const aiAdapter = getAIAdapter();
    const insight = await aiAdapter.generateInsight(
      {
        habitId: parseInt(habitId),
        habitName: habit.name,
        frequency: habit.frequency,
        logs: logsResult.rows.map((r) => ({
          date: r.date,
          completed: r.completed,
        })),
        ...streakData,
      },
      userContext
    );

    // Save insight to database
    await pool.query(
      `INSERT INTO ai_insights (user_id, habit_id, insight_type, title, content, confidence_score)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.userId,
        habitId,
        insight.type,
        insight.title,
        insight.content,
        insight.confidenceScore,
      ]
    );

    res.json({ insight });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Error generating insight:', error);
      res.status(500).json({ error: 'Failed to generate insight' });
    }
  }
});

// Get pattern analysis across all habits
router.get('/patterns', async (req: AuthRequest, res: Response) => {
  try {
    // Get all habits with their logs
    const habitsResult = await pool.query(
      'SELECT * FROM habits WHERE user_id = $1',
      [req.userId]
    );

    const habitHistories = await Promise.all(
      habitsResult.rows.map(async (habit) => {
        const logsResult = await pool.query(
          `SELECT date, completed FROM track_logs
           WHERE habit_id = $1 AND user_id = $2
           ORDER BY date DESC`,
          [habit.id, req.userId]
        );

        const streakData = await calculateStreak(habit.id, req.userId!);

        return {
          habitId: habit.id,
          habitName: habit.name,
          frequency: habit.frequency,
          logs: logsResult.rows.map((r) => ({
            date: r.date,
            completed: r.completed,
          })),
          ...streakData,
        };
      })
    );

    if (habitHistories.length === 0) {
      return res.json({ patterns: [], suggestions: [] });
    }

    // Generate pattern analysis
    const aiAdapter = getAIAdapter();
    const analysis = await aiAdapter.analyzePatterns(habitHistories);

    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing patterns:', error);
    res.status(500).json({ error: 'Failed to analyze patterns' });
  }
});

// Get recent insights
router.get('/recent', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT i.*, h.name as habit_name
       FROM ai_insights i
       LEFT JOIN habits h ON h.id = i.habit_id
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC
       LIMIT 10`,
      [req.userId]
    );

    res.json({ insights: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

export default router;

