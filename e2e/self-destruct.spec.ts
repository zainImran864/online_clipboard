import { test, expect } from '@playwright/test';

test.describe('Self-Destruct & PIN Security Flow', () => {
  test('allows configuring Self-Destruct PIN and 4-character Access PIN in composer', async ({ page }) => {
    await page.goto('/send');

    // Type text
    const textarea = page.getByPlaceholder(/Type, write code, or press Ctrl \+ V/i);
    await textarea.fill('Top secret confidential data for self-destruct test');

    // Open Self-Destruct security options and enter PIN
    const securityBtn = page.getByRole('button', { name: /Self-Destruct PIN/i });
    await securityBtn.click();

    const selfDestructPinInput = page.getByPlaceholder(/e\.g\. 9842 or secret-key/i);
    await expect(selfDestructPinInput).toBeVisible();
    await selfDestructPinInput.fill('7890');

    // Verify 4-character Access PIN switch exists
    const accessPinSwitch = page.getByRole('switch', { name: /Toggle runtime 4-character PIN protection/i }).or(page.getByRole('switch'));
    await expect(accessPinSwitch.first()).toBeVisible();

    // Toggle Access PIN switch ON - modal should appear
    await accessPinSwitch.first().click();
    await expect(page.getByRole('heading', { name: /Set 4-Character Access PIN/i })).toBeVisible();

    // Input 4-character PIN
    const accessPinInput = page.getByPlaceholder(/e\.g\. ABCD or 7421/i);
    await accessPinInput.fill('ABCD');

    // Click Set PIN
    const setPinBtn = page.getByRole('button', { name: /Set PIN/i });
    await setPinBtn.click();

    // Verify PIN protection badge / indicator updated
    await expect(page.getByText(/Protected with PIN: ABCD/i)).toBeVisible();

    // Verify user can toggle OFF before generating code
    await accessPinSwitch.first().click();
    await expect(page.getByText(/Require a 4-character PIN/i)).toBeVisible();
  });

  test('validates 6-digit code input on read page without alert() popups', async ({ page }) => {
    await page.goto('/read');

    // Check no window.alert triggered
    page.on('dialog', () => {
      throw new Error('Unexpected window.alert() was triggered!');
    });

    const readBtn = page.getByRole('button', { name: 'Read', exact: true });
    // Attempt clicking with empty code - button should be disabled
    await expect(readBtn).toBeDisabled();

    // Enter partial 4-digit code
    const codeInput = page.getByPlaceholder('123456');
    await codeInput.fill('1234');
    await expect(readBtn).toBeDisabled();

    // Fill valid 6-digit code
    await codeInput.fill('999999');
    await expect(readBtn).toBeEnabled();
  });
});
