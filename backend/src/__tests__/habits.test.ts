import request from 'supertest';
import express from 'express';
import habitRoutes from '../routes/habits';
import { authenticate } from '../middleware/auth';
import { pool } from '../config/database';

const app = express();
app.use(express.json());
app.use('/api/habits', authenticate, habitRoutes);

// Mock authenticate middleware for testing
jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.userId = 1; // Mock user ID
    next();
  },
}));

describe('Habits Routes', () => {
  let habitId: number;

  beforeAll(async () => {
    // Create a test user if needed
    await pool.query(`
      INSERT INTO users (id, email, password_hash, name)
      VALUES (1, 'test@example.com', 'hash', 'Test User')
      ON CONFLICT (id) DO NOTHING
    `);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM habits WHERE user_id = 1');
    await pool.query('DELETE FROM users WHERE id = 1');
    await pool.end();
  });

  describe('POST /api/habits', () => {
    it('should create a new habit', async () => {
      const response = await request(app)
        .post('/api/habits')
        .send({
          name: 'Test Habit',
          description: 'Test Description',
          frequency: 'daily',
          color: '#3B82F6',
        })
        .expect(201);

      expect(response.body.habit).toHaveProperty('id');
      expect(response.body.habit.name).toBe('Test Habit');
      habitId = response.body.habit.id;
    });

    it('should reject invalid frequency', async () => {
      await request(app)
        .post('/api/habits')
        .send({
          name: 'Test Habit 2',
          frequency: 'invalid',
        })
        .expect(400);
    });
  });

  describe('GET /api/habits', () => {
    it('should get all habits for user', async () => {
      const response = await request(app)
        .get('/api/habits')
        .expect(200);

      expect(Array.isArray(response.body.habits)).toBe(true);
    });
  });

  describe('GET /api/habits/:id', () => {
    it('should get a specific habit', async () => {
      const response = await request(app)
        .get(`/api/habits/${habitId}`)
        .expect(200);

      expect(response.body.habit.id).toBe(habitId);
    });
  });

  describe('PUT /api/habits/:id', () => {
    it('should update a habit', async () => {
      const response = await request(app)
        .put(`/api/habits/${habitId}`)
        .send({
          name: 'Updated Habit',
        })
        .expect(200);

      expect(response.body.habit.name).toBe('Updated Habit');
    });
  });

  describe('DELETE /api/habits/:id', () => {
    it('should delete a habit', async () => {
      await request(app)
        .delete(`/api/habits/${habitId}`)
        .expect(200);
    });
  });
});

