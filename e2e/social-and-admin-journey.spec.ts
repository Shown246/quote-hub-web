import { test, expect } from "@playwright/test";

test.describe("Social Interactions and Admin Moderation Journey", () => {
  test("User likes a quote, bookmarks it, and views in saved collection", async ({ page }) => {
    // 1. Sign in as Alice
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("alice@example.com");
    await page.getByLabel(/password/i).fill("Password123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/.*feed/);

    // 2. Locate a quote card in the feed authored by another user
    const quoteCard = page.locator("article[data-testid^='quote-card-']").filter({
      hasNotText: "@alice_e2e",
    }).first();
    await expect(quoteCard).toBeVisible();

    // 3. Like and bookmark the quote
    const likeButton = quoteCard.getByRole("button", { name: /like quote/i });
    await likeButton.click();

    const bookmarkButton = quoteCard.getByRole("button", { name: /bookmark quote/i });
    await bookmarkButton.click();

    // 4. Navigate to Saved Quotes
    await page.goto("/saved");
    await expect(page.getByRole("heading", { name: /saved quotes/i })).toBeVisible();

    // 5. Verify the saved collection renders cards
    await expect(page.locator("article[data-testid^='quote-card-']").first()).toBeVisible();
  });

  test("Admin logs in, inspects analytics, verifies audit logs, and opens moderation modal", async ({ page }) => {
    // 1. Sign in as Admin
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("admin@example.com");
    await page.getByLabel(/password/i).fill("AdminPassword123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/.*feed/);

    // 2. Navigate to Admin Dashboard
    await page.goto("/admin/dashboard");
    await expect(page.getByText(/platform analytics/i)).toBeVisible();

    // 3. Verify Audit Logs page
    await page.getByRole("link", { name: /audit logs/i }).click();
    await expect(page.getByRole("heading", { level: 1, name: /audit logs/i })).toBeVisible();

    // 4. Verify User Moderation page and suspension modal
    await page.getByRole("link", { name: /users/i }).click();
    await expect(page.getByRole("heading", { level: 1, name: /user moderation/i })).toBeVisible();

    const suspendButton = page.getByRole("button", { name: /^suspend$/i }).first();
    await expect(suspendButton).toBeVisible();
    await suspendButton.click();

    await expect(page.getByRole("heading", { level: 2, name: /suspend user/i })).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
  });
});
