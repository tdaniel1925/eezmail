import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';

// SKIP THESE TESTS FOR NOW - Need to add data-testid attributes to components
test.describe.skip('Reply Later Feature (TODO: Add test IDs)', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard/**');
    await page.waitForSelector('[data-testid="email-list"]', { timeout: 10000 });
  });

  test('should show Reply Later button in email viewer', async ({ page }) => {
    // Click on first email in list
    const firstEmail = page.locator('[data-testid="email-item"]').first();
    await firstEmail.click();

    // Wait for email viewer to open
    await page.waitForSelector('[data-testid="email-viewer"]');

    // Check if Reply Later button (clock icon) exists
    const replyLaterButton = page.locator('button[aria-label="Reply Later"]');
    await expect(replyLaterButton).toBeVisible();
  });

  test('should open date picker when clicking Reply Later', async ({ page }) => {
    // Open first email
    const firstEmail = page.locator('[data-testid="email-item"]').first();
    await firstEmail.click();
    await page.waitForSelector('[data-testid="email-viewer"]');

    // Click Reply Later button
    const replyLaterButton = page.locator('button[aria-label="Reply Later"]');
    await replyLaterButton.click();

    // Verify date picker appears
    await expect(page.locator('text=In 2 hours')).toBeVisible();
    await expect(page.locator('text=In 4 hours')).toBeVisible();
    await expect(page.locator('text=Tomorrow')).toBeVisible();
    await expect(page.locator('text=Next week')).toBeVisible();
  });

  test('should add email to Reply Later and show bubble', async ({ page }) => {
    // Open first email
    const firstEmail = page.locator('[data-testid="email-item"]').first();
    const emailSubject = await firstEmail.locator('[data-testid="email-subject"]').textContent();
    await firstEmail.click();
    await page.waitForSelector('[data-testid="email-viewer"]');

    // Click Reply Later and select "In 2 hours"
    const replyLaterButton = page.locator('button[aria-label="Reply Later"]');
    await replyLaterButton.click();
    await page.click('text=In 2 hours');

    // Wait for success toast
    await expect(page.locator('text=Added to Reply Later')).toBeVisible({ timeout: 5000 });

    // Verify bubble appears at bottom of screen
    const replyLaterBubble = page.locator('[data-testid="reply-later-bubble"]').first();
    await expect(replyLaterBubble).toBeVisible({ timeout: 5000 });

    // Verify badge shows count
    const badge = page.locator('text=1 Reply Later');
    await expect(badge).toBeVisible();
  });

  test('should show bubble at bottom-center of screen', async ({ page }) => {
    // Assuming email already added to Reply Later (from previous test or setup)
    await page.goto(`${BASE_URL}/dashboard/inbox`);
    
    // Wait for bubble to appear
    const bubble = page.locator('[data-testid="reply-later-bubble"]').first();
    await bubble.waitFor({ state: 'visible', timeout: 5000 });

    // Get bubble position
    const box = await bubble.boundingBox();
    const viewportSize = page.viewportSize();
    
    if (box && viewportSize) {
      const bubbleCenterX = box.x + box.width / 2;
      const viewportCenterX = viewportSize.width / 2;
      
      // Allow 50px tolerance for centering
      expect(Math.abs(bubbleCenterX - viewportCenterX)).toBeLessThan(50);
      
      // Verify it's near the bottom (within 100px of bottom)
      expect(viewportSize.height - (box.y + box.height)).toBeLessThan(100);
    }
  });

  test('should open preview modal when clicking bubble', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/inbox`);
    
    // Click on bubble
    const bubble = page.locator('[data-testid="reply-later-bubble"]').first();
    await bubble.click();

    // Verify preview modal opens
    await expect(page.locator('[data-testid="reply-later-preview"]')).toBeVisible();
    
    // Verify modal shows email details
    await expect(page.locator('[data-testid="preview-subject"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-sender"]')).toBeVisible();
    
    // Verify AI draft is shown (or loading)
    const draftArea = page.locator('[data-testid="ai-draft"]');
    await expect(draftArea).toBeVisible();
  });

  test('should remove email from Reply Later when clicking X', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/inbox`);
    
    // Get initial count
    const badge = page.locator('text=/\\d+ Reply Later/');
    const initialCount = parseInt((await badge.textContent()) || '0');

    // Hover over bubble to show X button
    const bubble = page.locator('[data-testid="reply-later-bubble"]').first();
    await bubble.hover();

    // Click X button
    const removeButton = bubble.locator('[aria-label="Remove from Reply Later"]');
    await removeButton.click();

    // Verify success toast
    await expect(page.locator('text=Removed from Reply Later')).toBeVisible();

    // Verify count decreased or bubble disappeared
    if (initialCount > 1) {
      const newCount = parseInt((await badge.textContent()) || '0');
      expect(newCount).toBe(initialCount - 1);
    } else {
      // Last bubble should disappear
      await expect(bubble).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should not show bubbles on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/dashboard/inbox`);

    // Wait a bit for any bubbles to potentially render
    await page.waitForTimeout(2000);

    // Bubbles should not be visible on mobile
    const bubble = page.locator('[data-testid="reply-later-bubble"]');
    await expect(bubble).not.toBeVisible();
  });
});

test.describe.skip('Email Action Buttons (TODO: Add test IDs)', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**');
    await page.waitForSelector('[data-testid="email-list"]');
  });

  test('should star/unstar email', async ({ page }) => {
    // Open first email
    const firstEmail = page.locator('[data-testid="email-item"]').first();
    await firstEmail.click();
    await page.waitForSelector('[data-testid="email-viewer"]');

    // Click star button
    const starButton = page.locator('button[aria-label="Star"]');
    await starButton.click();

    // Verify success toast
    await expect(page.locator('text=Email starred')).toBeVisible();

    // Click again to unstar
    await starButton.click();
    await expect(page.locator('text=Email unstarred')).toBeVisible();
  });

  test('should archive email', async ({ page }) => {
    // Open first email
    const firstEmail = page.locator('[data-testid="email-item"]').first();
    await firstEmail.click();
    await page.waitForSelector('[data-testid="email-viewer"]');

    // Click archive button
    const archiveButton = page.locator('button[aria-label="Archive"]');
    await archiveButton.click();

    // Verify loading toast
    await expect(page.locator('text=Archiving email')).toBeVisible();
    
    // Verify success toast
    await expect(page.locator('text=Email archived')).toBeVisible({ timeout: 5000 });

    // Verify email viewer closed
    await expect(page.locator('[data-testid="email-viewer"]')).not.toBeVisible();
  });

  test('should delete email', async ({ page }) => {
    // Open first email
    const firstEmail = page.locator('[data-testid="email-item"]').first();
    await firstEmail.click();
    await page.waitForSelector('[data-testid="email-viewer"]');

    // Click delete button
    const deleteButton = page.locator('button[aria-label="Delete"]');
    await deleteButton.click();

    // Verify loading toast
    await expect(page.locator('text=Deleting email')).toBeVisible();
    
    // Verify success toast
    await expect(page.locator('text=Email deleted')).toBeVisible({ timeout: 5000 });

    // Verify email viewer closed
    await expect(page.locator('[data-testid="email-viewer"]')).not.toBeVisible();
  });

  test('should open reply composer', async ({ page }) => {
    // Open first email
    const firstEmail = page.locator('[data-testid="email-item"]').first();
    await firstEmail.click();
    await page.waitForSelector('[data-testid="email-viewer"]');

    // Click reply button
    const replyButton = page.locator('button[aria-label="Reply"]');
    await replyButton.click();

    // Verify composer opens
    await expect(page.locator('[data-testid="email-composer"]')).toBeVisible({ timeout: 3000 });
    
    // Verify subject is pre-filled with "Re:"
    const subjectInput = page.locator('input[name="subject"]');
    const subject = await subjectInput.inputValue();
    expect(subject).toContain('Re:');
  });

  test('should open forward composer', async ({ page }) => {
    // Open first email
    const firstEmail = page.locator('[data-testid="email-item"]').first();
    await firstEmail.click();
    await page.waitForSelector('[data-testid="email-viewer"]');

    // Click forward button
    const forwardButton = page.locator('button[aria-label="Forward"]');
    await forwardButton.click();

    // Verify composer opens
    await expect(page.locator('[data-testid="email-composer"]')).toBeVisible({ timeout: 3000 });
    
    // Verify subject is pre-filled with "Fwd:"
    const subjectInput = page.locator('input[name="subject"]');
    const subject = await subjectInput.inputValue();
    expect(subject).toContain('Fwd:');
  });
});

test.describe.skip('Thread Summary Actions (TODO: Add test IDs)', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**');
  });

  test('should navigate to calendar when clicking Add to Calendar', async ({ page }) => {
    // Open an email with meeting detection
    await page.goto(`${BASE_URL}/dashboard/inbox`);
    const firstEmail = page.locator('[data-testid="email-item"]').first();
    await firstEmail.click();
    await page.waitForSelector('[data-testid="email-viewer"]');

    // Open AI Assistant panel (if not already open)
    await page.click('[data-testid="ai-assistant-toggle"]');

    // Click on Thread Summary tab
    await page.click('text=Threads');

    // Look for "Add to Calendar" button (if meeting detected)
    const addToCalendarButton = page.locator('button:has-text("Add to Calendar")');
    
    if (await addToCalendarButton.isVisible()) {
      await addToCalendarButton.click();
      
      // Verify navigation to calendar
      await page.waitForURL('**/dashboard/calendar**');
      
      // Verify event details are pre-filled in URL params
      const url = page.url();
      expect(url).toContain('event=');
    }
  });
});

