import { test, expect } from '@playwright/test';

test('family app landing page explains the production data source', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('HAVEN Family Dashboard')).toBeVisible();
  await expect(page.getByText(/family_dashboard_summary/i)).toBeVisible();
});

test('protected dashboard routes redirect unauthenticated users to sign in', async ({ page }) => {
  await page.goto('/dashboard/medicijnen');
  await expect(page).toHaveURL(/\/inloggen$/);
  await expect(page.getByText('Sign in to HAVEN')).toBeVisible();
});

test('middleware annotates protected routes with the required permission header when a session is present', async ({ request }) => {
  const response = await request.get('/dashboard/locatie', {
    headers: { authorization: 'Bearer demo-session-token' },
  });
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['x-haven-required-permission']).toBe('can_view_location_events');
});
