import { expect, test } from '@playwright/test';

const samplePostId = 'captain-tsubasa-2-world-fighters';
const locales = [
  { prefix: '', homeHeading: "Welcome to Şuayb's Blog" },
  { prefix: '/tr', homeHeading: "Şuayb'in Bloguna Hoş Geldiniz" },
];

test.describe('public site', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(
      url => ['/graphql', '/api/graphql'].includes(url.pathname),
      route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) }),
    );
    await page.route('**/api/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) }),
    );
  });

  for (const locale of locales) {
    test(`loads the ${locale.prefix ? 'Turkish' : 'English'} home page and its article list`, async ({ page }) => {
      await page.goto(locale.prefix || '/');

      await expect(page.getByRole('heading', { level: 1, name: locale.homeHeading })).toBeVisible();
      await expect(page.getByRole('link', { name: /Captain Tsubasa 2: World Fighters/i }).first()).toBeVisible();
    });

    test(`loads the primary ${locale.prefix ? 'Turkish' : 'English'} information and game pages`, async ({ page }) => {
      for (const path of [
        '/about',
        '/contact',
        '/medium',
        '/search',
        '/games/schulte-table',
        '/games/visual-memory',
        '/games/stroop-test',
      ]) {
        await page.goto(`${locale.prefix}${path}`);
        await expect(
          page.locator('main h1, main h2').first(),
          `${locale.prefix}${path} should render a page heading`,
        ).toBeVisible();
      }
    });

    test(`opens a ${locale.prefix ? 'Turkish' : 'English'} article from its direct URL`, async ({ page }) => {
      await page.goto(`${locale.prefix}/posts/${samplePostId}`);

      await expect(page.getByRole('heading', { level: 1, name: /Captain Tsubasa 2: World Fighters/i })).toBeVisible();
    });

    test(`opens a ${locale.prefix ? 'Turkish' : 'English'} category and topic`, async ({ page }) => {
      await page.goto(`${locale.prefix}/categories/programming`);
      await expect(page.locator('main h1').first()).toBeVisible();

      await page.goto(`${locale.prefix}/topics/java`);
      await expect(page.locator('main h1').first()).toBeVisible();
    });
  }

  test('switches language while staying on the current article', async ({ page }) => {
    await page.goto(`/posts/${samplePostId}`);
    await page.getByRole('button', { name: /language/i }).click();
    await page.getByRole('button', { name: 'Türkçe' }).last().click();

    await expect(page).toHaveURL(new RegExp(`/tr/posts/${samplePostId}$`));
    await expect(page.getByRole('heading', { level: 1, name: /Captain Tsubasa 2: World Fighters/i })).toBeVisible();
  });

  test('finds an article from the keyboard search overlay', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Show search' }).click();

    const searchInput = page.getByRole('dialog').getByRole('combobox', { name: 'Search' });
    await expect(searchInput).toBeFocused();
    await searchInput.fill('Captain Tsubasa 2');

    const firstResult = page.getByRole('dialog').getByRole('option').first();
    await expect(firstResult).toBeVisible();
    await searchInput.press('Enter');

    await expect(page).toHaveURL(new RegExp(`/posts/${samplePostId}$`));
    await expect(page.getByRole('heading', { level: 1, name: /Captain Tsubasa 2: World Fighters/i })).toBeVisible();
  });

  test('search results page displays matching articles', async ({ page }) => {
    await page.goto('/search?q=Captain%20Tsubasa%202');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Captain Tsubasa 2: World Fighters/i }).first()).toBeVisible();
  });

  test('plays a round of the Schulte table and restarts the board', async ({ page }) => {
    await page.goto('/games/schulte-table');
    await page.getByRole('radio', { name: '3×3' }).click();
    await page.getByRole('button', { name: 'Cell 1' }).click();

    await expect(page.getByText('Running', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Restart', exact: true }).click();
    await expect(page.getByText('Ready', { exact: true })).toBeVisible();
  });

  test('shows the admin sign-in form without an authenticated session', async ({ page }) => {
    await page.goto('/admin/login');

    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
