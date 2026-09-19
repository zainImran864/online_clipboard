import { test, expect } from '@playwright/test';

test.describe('Markdown Editor Page', () => {
  test('renders markdown page without horizontal overflow on mobile', async ({ page }) => {
    // Test on small mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/markdown');

    // Verify main headings and buttons are visible
    await expect(page.getByRole('heading', { name: 'Live Markdown Preview & Editor' })).toBeVisible();

    // Verify NO page-level horizontal overflow (no bottom scrollbar)
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test('allows switching between Split, Edit, and Preview modes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/markdown');

    const editBtn = page.getByRole('button', { name: /Edit/i });
    const previewBtn = page.getByRole('button', { name: /Preview/i });
    const splitBtn = page.getByRole('button', { name: /Split/i });

    // Switch to Edit-only view
    await editBtn.click();
    await expect(page.getByPlaceholder('Type markdown here...')).toBeVisible();
    await expect(page.getByText('Rendered HTML Output')).not.toBeVisible();

    // Switch to Preview-only view
    await previewBtn.click();
    await expect(page.getByPlaceholder('Type markdown here...')).not.toBeVisible();
    await expect(page.getByText('Rendered HTML Output')).toBeVisible();

    // Switch back to Split view
    await splitBtn.click();
    await expect(page.getByPlaceholder('Type markdown here...')).toBeVisible();
    await expect(page.getByText('Rendered HTML Output')).toBeVisible();
  });

  test('updates preview when typing in markdown editor', async ({ page }) => {
    await page.goto('/markdown');

    const textarea = page.getByPlaceholder('Type markdown here...');
    await textarea.fill('# Hello Automated Playwright Test');

    const heading = page.locator('h1', { hasText: 'Hello Automated Playwright Test' });
    await expect(heading).toBeVisible();
  });
});
