# Playwright E2E Testing - Reply Later & Email Actions

## 🎭 Setup Complete!

Playwright has been installed and configured for end-to-end testing of the easeMail application.

---

## 📁 Files Created

1. **`tests/reply-later.spec.ts`** - Comprehensive E2E tests for:
   - Reply Later feature (button, date picker, bubbles, preview modal)
   - Email action buttons (star, archive, delete, reply, forward)
   - Thread summary actions (Add to Calendar)
   - Mobile responsiveness

2. **`playwright.config.ts`** - Configuration for:
   - Multiple browsers (Chrome, Firefox, Safari)
   - Mobile devices (Pixel 5, iPhone 12)
   - Screenshot/video on failure
   - Automatic dev server startup

3. **`.github/workflows/playwright.yml`** - CI/CD integration (optional)

---

## 🚀 Running Tests

### Run All Tests
```bash
npx playwright test
```

### Run in UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Run Specific Test File
```bash
npx playwright test reply-later
```

### Run in Debug Mode
```bash
npx playwright test --debug
```

### Run on Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run Mobile Tests
```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

---

## 🧪 Test Coverage

### **Reply Later Feature** (7 tests)

1. ✅ **Show Reply Later button in email viewer**
   - Verifies clock icon button exists
   
2. ✅ **Open date picker when clicking Reply Later**
   - Tests date picker UI with preset options
   
3. ✅ **Add email to Reply Later and show bubble**
   - Full flow: click button → select time → verify bubble appears
   
4. ✅ **Show bubble at bottom-center of screen**
   - Verifies correct positioning (centered horizontally, near bottom)
   
5. ✅ **Open preview modal when clicking bubble**
   - Tests bubble click → modal opens with email details
   
6. ✅ **Remove email from Reply Later when clicking X**
   - Tests hover → X button → remove from queue
   
7. ✅ **Not show bubbles on mobile viewport**
   - Verifies mobile responsiveness (bubbles hidden < 768px)

### **Email Action Buttons** (5 tests)

1. ✅ **Star/Unstar email**
   - Tests toggle functionality with API calls
   
2. ✅ **Archive email**
   - Tests archive button → success → viewer closes
   
3. ✅ **Delete email**
   - Tests delete button → success → viewer closes
   
4. ✅ **Open reply composer**
   - Tests reply button → composer opens with "Re:" subject
   
5. ✅ **Open forward composer**
   - Tests forward button → composer opens with "Fwd:" subject

### **Thread Summary Actions** (1 test)

1. ✅ **Navigate to calendar when clicking Add to Calendar**
   - Tests meeting detection → Add to Calendar → navigation

---

## 📝 Before Running Tests

### 1. **Set Up Test User**

Create a test user account:
```bash
# Option 1: Use your existing account
TEST_EMAIL=your-email@example.com
TEST_PASSWORD=your-password

# Option 2: Create dedicated test account via Supabase dashboard
```

### 2. **Generate Test Emails**

For the tests to work, you need emails in the database:

```bash
# Start dev server
npm run dev

# In browser, navigate to:
http://localhost:3000/dashboard/settings

# Scroll to "Danger Zone" → Click "Generate Test Emails"
# This creates 50 test emails
```

### 3. **Update Test Environment**

Edit `tests/reply-later.spec.ts` and update the test credentials:

```typescript
const TEST_EMAIL = process.env.TEST_EMAIL || 'your-test-email@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'your-test-password';
```

Or set environment variables:
```bash
# Windows PowerShell
$env:TEST_EMAIL="test@example.com"
$env:TEST_PASSWORD="testpassword123"

# Linux/Mac
export TEST_EMAIL="test@example.com"
export TEST_PASSWORD="testpassword123"
```

---

## 🎯 Test Data Requirements

For tests to pass, you need:

✅ **At least 1 email** in the inbox
✅ **Test user authenticated** with valid credentials
✅ **Email accounts connected** (or test emails generated)

---

## 🔍 Debugging Failed Tests

### View Test Report
```bash
npx playwright show-report
```

### Run with Headed Browser (See What's Happening)
```bash
npx playwright test --headed
```

### Run Single Test with Debug
```bash
npx playwright test reply-later --debug
```

### Take Screenshot Manually in Test
```typescript
await page.screenshot({ path: 'debug-screenshot.png' });
```

### Check Console Logs
Playwright captures console logs automatically. View them in the test report.

---

## 📊 Expected Test Results

When all tests pass, you should see:

```
Running 13 tests using 3 workers

  ✓ Reply Later Feature › should show Reply Later button in email viewer (1.2s)
  ✓ Reply Later Feature › should open date picker when clicking Reply Later (1.5s)
  ✓ Reply Later Feature › should add email to Reply Later and show bubble (2.3s)
  ✓ Reply Later Feature › should show bubble at bottom-center of screen (1.8s)
  ✓ Reply Later Feature › should open preview modal when clicking bubble (2.1s)
  ✓ Reply Later Feature › should remove email from Reply Later when clicking X (1.7s)
  ✓ Reply Later Feature › should not show bubbles on mobile viewport (1.3s)
  ✓ Email Action Buttons › should star/unstar email (1.4s)
  ✓ Email Action Buttons › should archive email (1.9s)
  ✓ Email Action Buttons › should delete email (1.8s)
  ✓ Email Action Buttons › should open reply composer (1.6s)
  ✓ Email Action Buttons › should open forward composer (1.5s)
  ✓ Thread Summary Actions › should navigate to calendar when clicking Add to Calendar (2.0s)

  13 passed (21s)
```

---

## 🚨 Common Test Failures & Solutions

### 1. **"Timeout waiting for selector"**

**Problem**: Element not found within timeout (default 30s)

**Solutions**:
- Verify element exists in your app
- Add `data-testid` attributes to components
- Increase timeout: `await page.waitForSelector('...', { timeout: 60000 });`

### 2. **"Login failed" / "Unauthorized"**

**Problem**: Test credentials invalid

**Solutions**:
- Verify `TEST_EMAIL` and `TEST_PASSWORD` are correct
- Check if user exists in Supabase Auth
- Manually test login at `http://localhost:3000/login`

### 3. **"No emails found"**

**Problem**: Empty inbox

**Solutions**:
- Generate test emails via Settings > Danger Zone
- Connect a real email account
- Or modify tests to handle empty state

### 4. **"Reply Later bubble not visible"**

**Problem**: Bubble positioning or rendering issue

**Solutions**:
- Check console logs in test report
- Run test in `--headed` mode to see UI
- Verify CSS classes are applied
- Check if `Mobile: true` in console logs (shouldn't be on desktop)

### 5. **Tests pass locally but fail in CI**

**Problem**: Environment differences

**Solutions**:
- Ensure CI has access to database
- Set environment variables in CI/CD settings
- Use separate test database for CI
- Check CI logs for specific errors

---

## 📈 Adding More Tests

### Test Template

```typescript
test('should do something specific', async ({ page }) => {
  // 1. Navigate to page
  await page.goto('http://localhost:3000/dashboard/inbox');
  
  // 2. Interact with elements
  await page.click('[data-testid="some-button"]');
  
  // 3. Wait for result
  await page.waitForSelector('[data-testid="result"]');
  
  // 4. Assert outcome
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

### Recommended Additional Tests

- **Bulk email operations** (select multiple → archive/delete)
- **Email search functionality**
- **Folder navigation** (inbox, sent, drafts, spam, trash)
- **Composer features** (attachments, scheduling, templates)
- **AI features** (AI reply, smart compose, thread summary)
- **Settings pages** (account settings, preferences, billing)
- **Contact management** (add, edit, delete contacts)
- **Calendar integration** (create events, view calendar)

---

## 🎬 Auto-Generate Tests

Playwright has a code generator:

```bash
npx playwright codegen http://localhost:3000
```

This opens a browser where you can:
1. Click around your app
2. Playwright generates test code automatically
3. Copy-paste into your test files

---

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

---

## ✅ Next Steps

1. **Run Tests**:
   ```bash
   npx playwright test --ui
   ```

2. **Fix Any Failing Tests**:
   - Add `data-testid` attributes where needed
   - Ensure test data exists
   - Update selectors to match your UI

3. **Add More Tests**:
   - Copy test patterns from `reply-later.spec.ts`
   - Cover critical user workflows
   - Test edge cases and error handling

4. **Integrate with CI/CD**:
   - GitHub Actions workflow already created
   - Configure environment variables in GitHub
   - Tests run automatically on every push

---

**Your E2E testing infrastructure is now set up! 🎉**

Run `npx playwright test --ui` to start testing your Reply Later and email action buttons!

