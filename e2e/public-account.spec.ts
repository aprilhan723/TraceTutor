import { expect, test } from "@playwright/test";

const publicAccountRelease = process.env.E2E_PUBLIC_ACCOUNT === "1";

test.describe("public account release", () => {
  test.skip(
    !publicAccountRelease,
    "Requires an explicitly selected hosted account-mode URL.",
  );

  test("registration, route protection, and Demo Mode stay separate", async ({
    page,
  }) => {
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /practice less randomly/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Create an account" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /explore the separate demo/i }),
    ).toBeVisible();

    await page.goto("/auth/sign-up");
    await expect(
      page.getByRole("heading", { name: /create a secure workspace/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByText(/public beta accounts use a password/i),
    ).toBeVisible();

    await page.goto("/student/today");
    await expect(page).toHaveURL(/\/auth\/sign-in$/);
    await expect(
      page.getByRole("heading", { name: /continue your correction trace/i }),
    ).toBeVisible();

    await page.goto("/demo/student");
    await expect(page).toHaveURL(/\/student\/today$/);
    await expect(
      page.getByText("Demo Mode", { exact: true }).first(),
    ).toBeVisible();

    const viewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
    expect(browserErrors).toEqual([]);
  });
});
