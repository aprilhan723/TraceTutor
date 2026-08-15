import { expect, type Page } from "@playwright/test";

export async function enterStudentDemo(page: Page) {
  await page.goto("/demo/student");
  await expect(page).toHaveURL(/\/student\/today$/);
  await expect(
    page.getByText("Demo Mode", { exact: true }).first(),
  ).toBeVisible();
}

export async function enterTutorDemo(page: Page) {
  await page.goto("/demo/tutor");
  await expect(page).toHaveURL(/\/tutor\/dashboard$/);
  await expect(
    page.getByText("Demo Mode", { exact: true }).first(),
  ).toBeVisible();
}
