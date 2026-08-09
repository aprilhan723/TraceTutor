import { expect, test } from "@playwright/test";

test("student can enter the demo from the landing page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /practice less randomly/i,
    }),
  ).toBeVisible();

  await page
    .getByRole("link", { name: /try the student demo/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/student\/today$/);
  await expect(
    page.getByRole("heading", { name: /today, jamie/i }),
  ).toBeVisible();
  await expect(
    page.getByText("Demo Mode", { exact: true }).first(),
  ).toBeVisible();
});

test("tutor shell navigation is reachable", async ({ page }) => {
  await page.goto("/tutor/dashboard");

  await expect(
    page.getByRole("heading", { name: /intervention queue/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Students" }).first().click();
  await expect(page).toHaveURL(/\/tutor\/students$/);
  await expect(page.getByRole("heading", { name: /students/i })).toBeVisible();
});
