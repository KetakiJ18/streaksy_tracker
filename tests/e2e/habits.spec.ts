import { test, expect } from '@playwright/test';

test.describe('Habits Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new habit', async ({ page }) => {
    await page.goto('/habits');
    
    await page.click('text=New Habit');
    
    await page.fill('input[type="text"]', 'Exercise Daily');
    await page.fill('textarea', '30 minutes of exercise');
    await page.selectOption('select', 'daily');
    
    await page.click('button:has-text("Create")');
    
    // Should see the new habit
    await expect(page.locator('text=Exercise Daily')).toBeVisible();
  });

  test('should mark habit as completed', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on first incomplete habit
    const firstHabit = page.locator('svg[class*="Circle"]').first();
    await firstHabit.click();
    
    // Should show completed state
    await expect(page.locator('svg[class*="CheckCircle2"]').first()).toBeVisible();
  });
});

