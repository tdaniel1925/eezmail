import { test, expect } from '@playwright/test';

// Simple smoke tests - no login required for now
test.describe('Marketing Site', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('/');
    
    // Check if page loads
    await expect(page).toHaveTitle(/easeMail/i);
  });

  test('should have Get Started button', async ({ page }) => {
    await page.goto('/');
    
    // Check for CTA button
    const getStartedButton = page.locator('a:has-text("Get Started")').first();
    await expect(getStartedButton).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Click login link
    await page.click('text=Login');
    
    // Verify we're on login page
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check for email and password inputs
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show signup page', async ({ page }) => {
    await page.goto('/signup');
    
    // Check for signup form
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

// Skip authenticated tests for now until we set up test user
test.describe.skip('Dashboard (Requires Auth)', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});

