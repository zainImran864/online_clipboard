import { test, expect } from '@playwright/test';

test.describe('Mobile QR Scanning & Offline Download Features', () => {
  test('read page provides QR scanner tab and opens camera scanner modal', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    await page.goto('/read', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Read shared content/i })).toBeVisible({ timeout: 15000 });

    // Verify tabs: Enter Code, Paste Link, Scan QR
    await page.goto('/read');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Read shared content/i })).toBeVisible();

    const scanQrTab = page.getByRole('button', { name: '📷 Scan QR' });
    await expect(scanQrTab).toBeVisible();
    await scanQrTab.click();

    // The QR scanner modal appears directly upon clicking the Scan QR tab
    await expect(page.getByText('Scan Share QR Code')).toBeVisible({ timeout: 10000 });

    // Verify photo upload fallback is present
    await expect(page.getByText(/Upload\/Snap Photo/i)).toBeVisible();

    // Close the scanner modal
    const closeBtn = page.getByRole('button', { name: /Close scanner|Cancel/i }).first();
    await closeBtn.click();
    await expect(page.getByText('Scan Share QR Code')).not.toBeVisible();
  });

  test('offline saved clips are displayed and accessible on read page', async ({ page }) => {
    // Inject a saved offline clip into indexedDB before loading
    await page.goto('/read', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Read shared content/i })).toBeVisible({ timeout: 15000 });

    await page.evaluate(async () => {
      const dbRequest = indexedDB.open('pasteport_offline_db', 1);
      dbRequest.onupgradeneeded = () => {
        const db = dbRequest.result;
        if (!db.objectStoreNames.contains('saved_clips')) {
          db.createObjectStore('saved_clips', { keyPath: 'code' });
        }
      };
      await new Promise<void>((resolve) => {
        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const tx = db.transaction('saved_clips', 'readwrite');
          tx.objectStore('saved_clips').put({
            code: '998877',
            type: 'text',
            content: 'Offline cached test content for mobile testing',
            savedAt: Date.now(),
          });
          tx.oncomplete = () => resolve();
        };
      });
    });

    // Revisit read page to see offline saved list
    await page.goto('/read', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Read shared content/i })).toBeVisible({ timeout: 15000 });

    // Verify Saved Offline Shares section appears
    await expect(page.getByText(/Saved Offline Shares/i)).toBeVisible();
    await expect(page.getByText('998877')).toBeVisible();
    await expect(page.getByText(/Offline cached test content/i).or(page.getByText(/Ready without internet/i))).toBeVisible();
  });

  test('view page allows saving offline and viewing offline copy with mobile viewport', async ({ page }) => {
    // Set mobile viewport (iPhone 14 size)
    await page.setViewportSize({ width: 390, height: 844 });

    // Seed offline copy in IndexedDB
    await page.goto('/');
    await page.evaluate(async () => {
      const dbRequest = indexedDB.open('pasteport_offline_db', 1);
      dbRequest.onupgradeneeded = () => {
        const db = dbRequest.result;
        if (!db.objectStoreNames.contains('saved_clips')) {
          db.createObjectStore('saved_clips', { keyPath: 'code' });
        }
      };
      await new Promise<void>((resolve) => {
        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const tx = db.transaction('saved_clips', 'readwrite');
          tx.objectStore('saved_clips').put({
            code: '123987',
            type: 'both',
            content: '',
            textContent: 'Mobile offline verified notes for field work.',
            files: [
              {
                fileName: 'field_report.txt',
                fileType: 'text/plain',
                fileSize: 1024,
                dataUrl: 'data:text/plain;base64,TW9iaWxlIGZpZWxkIHJlcG9ydA==',
              },
            ],
            savedAt: Date.now(),
          });
          tx.oncomplete = () => resolve();
        };
      });
    });

    // Navigate to offline clip view
    await page.goto('/view/123987', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Read/i })).toBeVisible({ timeout: 15000 });

    // Should detect and render offline copy
    await expect(page.getByText(/Offline Copy Active|Offline Copy/i).first()).toBeVisible();
    await expect(page.getByText(/Mobile offline verified notes/i)).toBeVisible();

    // Verify QR modal button is available on mobile
    const qrBtn = page.getByRole('button', { name: /QR/i });
    await expect(qrBtn).toBeVisible();
    await qrBtn.click();

    // Big QR modal should be displayed
    await expect(page.getByRole('heading', { name: /Mobile Share QR Code/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Save QR/i })).toBeVisible();

    // Close QR modal
    await page.getByRole('button', { name: /Close modal/i }).click();
    await expect(page.getByRole('heading', { name: /Mobile Share QR Code/i })).not.toBeVisible();
  });
});
