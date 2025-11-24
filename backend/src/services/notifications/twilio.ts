import twilio from 'twilio';
import { pool } from '../../config/database';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export interface NotificationMessage {
  type: 'reminder' | 'streak_alert' | 'encouragement';
  message: string;
  userId: number;
  habitId?: number;
}

export const sendWhatsAppNotification = async (
  phoneNumber: string,
  message: string
): Promise<boolean> => {
  try {
    if (!phoneNumber || !message) {
      throw new Error('Phone number and message are required');
    }

    // Format phone number for WhatsApp (ensure it starts with whatsapp:)
    const formattedNumber = phoneNumber.startsWith('whatsapp:')
      ? phoneNumber
      : `whatsapp:${phoneNumber}`;

    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
      to: formattedNumber,
      body: message,
    });

    console.log('WhatsApp notification sent:', result.sid);
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
    return false;
  }
};

export const saveNotification = async (
  notification: NotificationMessage
): Promise<void> => {
  await pool.query(
    `INSERT INTO notifications (user_id, type, message, sent_at, delivered)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP, true)
     RETURNING id`,
    [notification.userId, notification.type, notification.message]
  );
};

export const sendHabitReminder = async (
  userId: number,
  habitName: string,
  phoneNumber: string
): Promise<void> => {
  const message = `🔔 Habit Reminder: Don't forget to complete "${habitName}" today! You've got this! 💪`;
  
  const sent = await sendWhatsAppNotification(phoneNumber, message);
  if (sent) {
    await saveNotification({
      type: 'reminder',
      message,
      userId,
    });
  }
};

export const sendStreakAlert = async (
  userId: number,
  habitName: string,
  streakDays: number,
  phoneNumber: string
): Promise<void> => {
  const message = `🔥 Amazing! You've maintained "${habitName}" for ${streakDays} days in a row! Keep the momentum going! 🚀`;
  
  const sent = await sendWhatsAppNotification(phoneNumber, message);
  if (sent) {
    await saveNotification({
      type: 'streak_alert',
      message,
      userId,
    });
  }
};

export const sendEncouragement = async (
  userId: number,
  message: string,
  phoneNumber: string
): Promise<void> => {
  const sent = await sendWhatsAppNotification(phoneNumber, message);
  if (sent) {
    await saveNotification({
      type: 'encouragement',
      message,
      userId,
    });
  }
};

