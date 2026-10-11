import { test, expect } from "@playwright/test";

test.describe("Quote-Hub Primary User Flow Journey", () => {
  test("Guest browses, registers, posts themed quote, and views in feed", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /quote-hub/i })).toBeVisible();

    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/.*login/);

    await page.getByLabel(/email/i).fill("alice@example.com");
    await page.getByLabel(/password/i).fill("Password123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/.*feed/);

    await page.getByRole("button", { name: /compose|new quote/i }).click();
    await page.getByPlaceholder(/write your quote/i).fill("Simplicity is prerequisite for reliability. 🚀");
    await page.getByRole("dialog").getByRole("button", { name: /publish|post/i }).click();

    await expect(page.getByText("Simplicity is prerequisite for reliability. 🚀")).toBeVisible();
  });
});
