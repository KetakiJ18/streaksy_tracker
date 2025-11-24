import cron from 'node-cron';
import { pool } from '../config/database';
import { sendHabitReminder, sendStreakAlert } from './notifications/twilio';
import { calculateStreak } from '../utils/streaks';

export const setupCronJobs = (): void => {
  // Daily reminders at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily habit reminders...');
    await sendDailyReminders();
  });

  // Streak alerts check (runs daily at 8 PM)
  cron.schedule('0 20 * * *', async () => {
    console.log('Checking for streak milestones...');
    await checkStreakMilestones();
  });
};

const sendDailyReminders = async (): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT u.id, u.phone_number, h.id as habit_id, h.name as habit_name
       FROM users u
       JOIN habits h ON h.user_id = u.id
       WHERE u.phone_number IS NOT NULL
       AND h.id NOT IN (
         SELECT habit_id 
         FROM track_logs 
         WHERE date = CURRENT_DATE AND completed = true
       )`
    );

    for (const row of result.rows) {
      if (row.phone_number) {
        await sendHabitReminder(
          row.id,
          row.habit_name,
          row.phone_number
        );
      }
    }
  } catch (error) {
    console.error('Error sending daily reminders:', error);
  }
};

const checkStreakMilestones = async (): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT u.id, u.phone_number, h.id as habit_id, h.name as habit_name
       FROM users u
       JOIN habits h ON h.user_id = u.id
       WHERE u.phone_number IS NOT NULL`
    );

    for (const row of result.rows) {
      const streakData = await calculateStreak(row.habit_id, row.id);
      
      // Send alert for milestones (7, 14, 30, 50, 100 days)
      const milestones = [7, 14, 30, 50, 100];
      if (milestones.includes(streakData.currentStreak)) {
        await sendStreakAlert(
          row.id,
          row.habit_name,
          streakData.currentStreak,
          row.phone_number
        );
      }
    }
  } catch (error) {
    console.error('Error checking streak milestones:', error);
  }
};

