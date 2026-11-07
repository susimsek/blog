import { expect, test } from '@playwright/test';
import { installApiMocks, seedAdminSession, type ApiMockState } from './support/apiMocks';

const samplePostId = 'captain-tsubasa-2-world-fighters';
const locales = [
  { prefix: '', homeHeading: "Welcome to Şuayb's Blog" },
  { prefix: '/tr', homeHeading: "Şuayb'in Bloguna Hoş Geldiniz" },
];

let apiMockState: ApiMockState;

test.describe('site and admin user journeys', () => {
  test.beforeEach(async ({ page }) => {
    apiMockState = await installApiMocks(page);
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

    test(`opens an ${locale.prefix ? 'Turkish' : 'English'} article from its direct URL`, async ({ page }) => {
      await page.goto(`${locale.prefix}/posts/${samplePostId}`);

      await expect(page.getByRole('heading', { level: 1, name: /Captain Tsubasa 2: World Fighters/i })).toBeVisible();
    });

    test(`opens a category and topic in ${locale.prefix ? 'Turkish' : 'English'}`, async ({ page }) => {
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

  test('likes an article and submits a guest comment for moderation', async ({ page }) => {
    await page.goto(`/posts/${samplePostId}`);

    const likeButton = page.getByRole('button', { name: /Like this article/ });
    await expect(likeButton).toBeVisible();
    await likeButton.click();
    await expect(page.getByRole('button', { name: /Like this article 1/ })).toBeVisible();

    await page.getByLabel('Name', { exact: true }).fill('E2E Reader');
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill('reader@example.com');
    await page.getByLabel('Comment', { exact: true }).fill('This comment was submitted by the E2E journey.');
    await page.getByRole('button', { name: 'Post comment' }).click();

    await expect(page.getByText('Your comment was received and is awaiting moderation.')).toBeVisible();
    expect(apiMockState.calls.some(call => call.operation === 'AddCommentMutation')).toBe(true);
  });

  test('subscribes to the newsletter and can request the confirmation email again', async ({ page }) => {
    await page.goto('/');
    const email = page.locator('#pre-footer-newsletter-email');

    // Wait for the client side form handler to hydrate and verify its validation feedback.
    await page.getByRole('button', { name: 'Join' }).click();
    await expect(page.getByText('Email is required.')).toBeVisible();
    await email.fill('newsletter@example.com');
    await expect(email).toHaveAttribute('aria-invalid', 'false');
    await page.getByRole('button', { name: 'Join' }).click();

    await expect(page.getByText('Welcome aboard. Please check your inbox for the confirmation email.')).toBeVisible();
    await page.getByRole('button', { name: "Didn't get the email? Resend confirmation." }).click();
    await expect(page.getByText('Confirmation email sent again. Check your inbox and spam folder.')).toBeVisible();
    expect(apiMockState.calls.some(call => call.operation === 'SubscribeNewsletterMutation')).toBe(true);
    expect(apiMockState.calls.some(call => call.operation === 'ResendNewsletterConfirmationMutation')).toBe(true);
  });

  test('confirms a newsletter subscription from its callback link', async ({ page }) => {
    await page.goto('/callback?token=e2e-confirmation-token');

    await expect(page.getByRole('heading', { name: 'Subscription confirmed' })).toBeVisible();
    expect(apiMockState.calls.some(call => call.operation === 'ConfirmNewsletterSubscriptionMutation')).toBe(true);
  });

  test('plays a round of the Schulte table and restarts the board', async ({ page }) => {
    await page.goto('/games/schulte-table');
    await page.getByRole('radio', { name: '3×3' }).click();
    await page.getByRole('button', { name: 'Cell 1' }).click();

    await expect(page.getByText('Running', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Restart', exact: true }).click();
    await expect(page.getByText('Ready', { exact: true })).toBeVisible();
  });

  test('recalls a visual memory pattern and advances to the next level', async ({ page }) => {
    await page.goto('/games/visual-memory');
    await page.getByRole('radio', { name: /^Easy/ }).click();
    await page.getByRole('button', { name: 'Start round' }).click();
    await expect(page.getByText('Memorize', { exact: true })).toBeVisible();

    const highlightedCells = await page
      .locator('.visual-memory-cell.is-pattern')
      .evaluateAll(cells => cells.map(cell => Number(cell.getAttribute('aria-label')?.match(/(\d+)$/)?.[1]) - 1));
    expect(highlightedCells).toHaveLength(3);

    await expect(page.getByText('Recall', { exact: true })).toBeVisible();
    for (const index of highlightedCells) {
      await page.getByRole('button', { name: `Memory cell ${index + 1}` }).click();
    }
    await expect(page.locator('.visual-memory-stat-value').first()).toHaveText('2');
  });

  test('answers a Stroop prompt using its ink color', async ({ page }) => {
    await page.goto('/games/stroop-test');
    await page.getByRole('radio', { name: /^Practice/ }).click();

    const inkHint = page.getByText(/^Ink color:/);
    const targetColor = (await inkHint.innerText()).replace('Ink color:', '').trim();
    await page.getByRole('button', { name: targetColor, exact: true }).click();

    await expect(page.getByText('Running', { exact: true })).toBeVisible();
    await expect(page.locator('.stroop-stat-value').nth(1)).toHaveText('100');
  });

  test('shows the admin sign-in form without an authenticated session', async ({ page }) => {
    await page.goto('/admin/login');

    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('validates admin login credentials and displays a rejected sign-in', async ({ page }) => {
    apiMockState = await installApiMocks(page, { adminLoginSucceeds: false });
    await page.goto('/admin/login');

    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Enter your email address.')).toBeVisible();

    await page.getByLabel('Email', { exact: true }).fill('admin@example.com');
    await page.getByLabel('Password', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('.alert-danger').first()).toContainText('Login failed');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('signs into the admin dashboard and approves a pending comment', async ({ page }) => {
    apiMockState = await installApiMocks(page, {
      comments: [
        {
          id: 'comment-e2e',
          postId: samplePostId,
          postTitle: 'Captain Tsubasa 2: World Fighters',
          parentId: null,
          authorName: 'Reader Example',
          authorEmail: 'reader@example.com',
          content: 'An E2E moderation comment.',
          status: 'PENDING',
          createdAt: '2026-01-01T12:00:00.000Z',
          updatedAt: '2026-01-01T12:00:00.000Z',
        },
      ],
    });
    await page.goto('/admin/login');
    await page.getByLabel('Email', { exact: true }).fill('admin@example.com');
    await page.getByLabel('Password', { exact: true }).fill('correct-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('main h1').filter({ hasText: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('An E2E moderation comment.')).toBeVisible();
    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(page.getByText('An E2E moderation comment.')).toHaveCount(0);
  });

  test('loads representative admin content management after restoring a session', async ({ page }) => {
    await seedAdminSession(page);
    await page.goto('/admin/settings/content');

    await expect(page.getByRole('heading', { name: /content/i }).first()).toBeVisible();
    await page.getByRole('tab', { name: 'Posts' }).click();
    await expect(page.getByText('Captain Tsubasa 2: World Fighters').first()).toBeVisible();
  });

  test('edits and saves the content of a representative admin article', async ({ page }) => {
    await seedAdminSession(page);
    await page.goto(`/admin/settings/content/posts/en/${samplePostId}#content`);

    const editor = page.locator('#admin-content-post-content-editor');
    await expect(editor).toHaveValue(/Fixture body for editor workflow/);
    await editor.fill('# E2E content\n\nUpdated by Playwright.');
    await page.getByRole('button', { name: 'Save content' }).click();

    await expect(page.locator('.alert-success')).toContainText(`Post content updated: ${samplePostId}`);
    expect(apiMockState.calls.some(call => call.operation === 'AdminUpdateContentPostContentMutation')).toBe(true);
  });
});
