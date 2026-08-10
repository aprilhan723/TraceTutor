import { expect, test, type Page } from "@playwright/test";

const connected = process.env.SUPABASE_E2E === "1";
const mailpitUrl =
  process.env.SUPABASE_E2E_MAILPIT_URL ?? "http://127.0.0.1:54324";

interface MailpitMessage {
  ID: string;
  To: Array<{ Address: string }>;
}

interface MailpitResponse {
  messages: MailpitMessage[];
}

async function confirmLatestEmail(page: Page, email: string) {
  await expect
    .poll(
      async () => {
        const response = await page.request.get(
          `${mailpitUrl}/api/v1/messages`,
        );
        if (!response.ok()) return null;
        const payload = (await response.json()) as MailpitResponse;
        return (
          payload.messages.find((message) =>
            message.To.some((recipient) => recipient.Address === email),
          )?.ID ?? null
        );
      },
      { timeout: 20_000 },
    )
    .not.toBeNull();
  const list = await page.request.get(`${mailpitUrl}/api/v1/messages`);
  const payload = (await list.json()) as MailpitResponse;
  const message = payload.messages.find((candidate) =>
    candidate.To.some((recipient) => recipient.Address === email),
  );
  if (!message) throw new Error("Confirmation email did not arrive.");
  const detail = await page.request.get(
    `${mailpitUrl}/api/v1/message/${message.ID}`,
  );
  const body = (await detail.json()) as { HTML: string; Text: string };
  const link = `${body.HTML ?? ""} ${body.Text ?? ""}`.match(
    /https?:\/\/[^\s"<>]+\/auth\/confirm\?[^\s"<>]+/,
  )?.[0];
  if (!link) throw new Error("Confirmation link was not found.");
  await page.goto(link.replace(/&amp;/g, "&"));
}

test.describe("connected Supabase account lifecycle", () => {
  test.skip(
    !connected,
    "Requires an explicitly configured local Supabase project.",
  );

  test("tutor invite → student assignment → isolated response", async ({
    browser,
  }) => {
    const suffix = Date.now();
    const tutorEmail = `tutor-${suffix}@example.test`;
    const studentEmail = `student-${suffix}@example.test`;
    const tutorContext = await browser.newContext();
    const tutorPage = await tutorContext.newPage();
    await tutorPage.goto("/auth/sign-up");
    await tutorPage.getByLabel("Name").fill("E2E Tutor");
    await tutorPage.getByLabel("Email").fill(tutorEmail);
    await tutorPage.getByLabel("Password").fill("TraceTutor-2026-test");
    await tutorPage
      .getByRole("button", { name: "Create secure account" })
      .click();
    await confirmLatestEmail(tutorPage, tutorEmail);
    await tutorPage.getByLabel("Name").fill("E2E Tutor");
    await tutorPage.getByLabel("tutor", { exact: true }).check();
    await tutorPage.getByRole("button", { name: "Continue" }).click();
    await tutorPage.getByLabel("Tutor workspace").fill("E2E Reading Studio");
    await tutorPage.getByLabel("First class").fill("E2E Sprint");
    await tutorPage
      .getByRole("button", { name: "Create workspace and class" })
      .click();
    await tutorPage
      .getByRole("button", { name: "Copy demo content into my workspace" })
      .click();
    await expect(
      tutorPage.getByText(/Copied \d+ original content items/),
    ).toBeVisible();
    await tutorPage
      .getByRole("button", { name: "Generate one-time student invite" })
      .click();
    const inviteUrl = await tutorPage.locator("p.select-all").textContent();
    expect(inviteUrl).toContain("/invite/");

    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();
    await studentPage.goto(inviteUrl ?? "");
    await studentPage.getByLabel("Name").fill("E2E Student");
    await studentPage.getByLabel("Email").fill(studentEmail);
    await studentPage.getByLabel("Password").fill("TraceTutor-2026-test");
    await studentPage
      .getByRole("button", { name: "Create secure account" })
      .click();
    await confirmLatestEmail(studentPage, studentEmail);
    await studentPage.getByLabel("Name").fill("E2E Student");
    await studentPage.getByLabel("student", { exact: true }).check();
    await studentPage.getByRole("button", { name: "Continue" }).click();
    await studentPage
      .getByRole("button", { name: "Save and see Today" })
      .click();

    await tutorPage.reload();
    await tutorPage
      .getByLabel("Student")
      .selectOption({ label: "E2E Student" });
    await tutorPage
      .getByRole("button", { name: "Assign correction item" })
      .click();
    await expect(
      tutorPage.getByText("Assignment sent to the linked student."),
    ).toBeVisible();

    await studentPage.reload();
    await studentPage.getByRole("link", { name: "Start correction" }).click();
    const typed = studentPage.getByLabel("Type the missing ending or word");
    if (await typed.isVisible()) {
      await typed.fill("er");
    } else {
      await studentPage.getByRole("radio").first().check();
      await studentPage.getByLabel("Certain").check();
      await studentPage.getByRole("checkbox").first().check();
    }
    await studentPage
      .getByRole("button", { name: "Submit correction trace" })
      .click();
    await expect(
      studentPage.getByText(/Response saved|already saved safely/),
    ).toBeVisible();

    await tutorPage.reload();
    await expect(
      tutorPage.getByText("E2E Student", { exact: false }),
    ).toBeVisible();
    await expect(
      tutorPage.getByText("E2E Student", { exact: false }),
    ).toHaveCount(1);
    await studentContext.close();
    await tutorContext.close();
  });
});
