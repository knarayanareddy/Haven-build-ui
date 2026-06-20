import { test, expect } from '@playwright/test';

test.describe('HAVEN iPhone suite browser E2E', () => {
  test('elder home has accessible 72px+ tap targets and language switching', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('HAVEN')).toBeVisible();

    const criticalButtons = [
      page.getByRole('button', { name: /My Pills/i }).first(),
      page.getByRole('button', { name: /Today/i }).first(),
      page.getByRole('button', { name: /Family/i }).first(),
      page.getByRole('button', { name: /Help/i }).first(),
    ];

    for (const button of criticalButtons) {
      await expect(button).toBeVisible();
      const box = await button.boundingBox();
      expect(box, 'button bounding box exists').not.toBeNull();
      expect(box!.width, 'tap target width').toBeGreaterThanOrEqual(72);
      expect(box!.height, 'tap target height').toBeGreaterThanOrEqual(72);
    }

    await page.getByRole('button', { name: 'NL' }).click();
    await expect(page.getByText(/Goedemorgen|Goedemiddag|Goedenavond/)).toBeVisible();
    await expect(page.getByText('Mijn pillen')).toBeVisible();
  });

  test('medication confirmation updates UI state', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /My Pills/i }).first().click();
    await expect(page.getByText(/Metformin|Lisinopril/)).toBeVisible();
    await page.getByRole('button', { name: /I took it/i }).click();
    await expect(page.getByText(/Medication confirmed/i)).toBeVisible();
  });

  test('shield simulation creates calm family escalation path', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /SCHILD/i }).click();
    await page.getByRole('button', { name: /Simulate suspicious call/i }).click();
    await expect(page.getByText(/caller asked for banking action/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Call family/i })).toBeVisible();
  });
});
