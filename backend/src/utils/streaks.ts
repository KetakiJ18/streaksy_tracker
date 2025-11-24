import { pool } from '../config/database';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  consistencyScore: number;
}

export const calculateStreak = async (
  habitId: number,
  userId: number
): Promise<StreakData> => {
  const result = await pool.query(
    `SELECT date, completed 
     FROM track_logs 
     WHERE habit_id = $1 AND user_id = $2 
     ORDER BY date DESC`,
    [habitId, userId]
  );

  const logs = result.rows;
  if (logs.length === 0) {
    return { currentStreak: 0, longestStreak: 0, consistencyScore: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let completedCount = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);

    if (log.completed) {
      completedCount++;
      tempStreak++;

      // Check if this is part of current streak
      if (i === 0 || (i > 0 && isConsecutiveDay(logs[i - 1].date, log.date))) {
        if (i === 0) {
          currentStreak = 1;
        } else if (i > 0 && isConsecutiveDay(logs[i - 1].date, log.date)) {
          currentStreak++;
        }
      } else {
        tempStreak = 1;
      }

      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      // Break in streak
      if (i === 0) {
        // If today is not completed, current streak is 0
        currentStreak = 0;
      }
      tempStreak = 0;
    }
  }

  // Calculate consistency score (percentage of completed days)
  const consistencyScore = logs.length > 0 ? (completedCount / logs.length) * 100 : 0;

  return {
    currentStreak,
    longestStreak,
    consistencyScore: Math.round(consistencyScore * 100) / 100,
  };
};

const isConsecutiveDay = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d1.getTime() - d2.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

