import { expect, test } from "@playwright/test";

test("shell inicial responde", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Astra Intranet Modern")).toBeVisible();
});
