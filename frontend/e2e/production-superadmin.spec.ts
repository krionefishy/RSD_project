import { expect, type Page, test } from "@playwright/test";

const superadminLogin = process.env.E2E_SUPERADMIN_LOGIN;
const superadminPassword = process.env.E2E_SUPERADMIN_PASSWORD;

async function signIn(page: Page, login: string, password: string, target: RegExp) {
  await page.goto("/login");
  await page.getByPlaceholder("Введите ID сотрудника").fill(login);
  await page.getByPlaceholder("Введите пароль").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(target);
}

test("critical production journey works on a mobile viewport", async ({ page }) => {
  test.skip(
    !superadminLogin || !superadminPassword,
    "Set E2E_SUPERADMIN_LOGIN and E2E_SUPERADMIN_PASSWORD",
  );

  const temporaryLogin = `pw_full_${Date.now()}`;
  const temporaryPassword = "Playwright2026!";
  const pageErrors: string[] = [];
  const unexpectedServerErrors: string[] = [];
  let temporaryAccountCreated = false;

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    const url = new URL(response.url());
    const isExpectedSalesPlaceholder =
      response.status() === 501 &&
      ["/api/v1/sales/stats", "/api/v1/sales/motivation"].includes(url.pathname);
    if (response.status() >= 500 && !isExpectedSalesPlaceholder) {
      unexpectedServerErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.setViewportSize({ width: 390, height: 844 });

  const loginResponse = await page.goto("/");
  expect(loginResponse?.status()).toBe(200);
  await expect(page).toHaveURL(/\/login$/);
  await page.getByPlaceholder("Введите ID сотрудника").fill("invalid_playwright_user");
  await page.getByPlaceholder("Введите пароль").fill("invalid-password");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByText("Неверный ID сотрудника или пароль")).toBeVisible();

  await signIn(page, superadminLogin!, superadminPassword!, /\/superadmin\/?$/);
  await expect(page.getByText("СуперАдмин", { exact: true })).toBeVisible();
  await expect(page.getByText("Всего пользователей", { exact: true })).toBeVisible();
  await expect(page.getByText("Активных", { exact: true })).toBeVisible();

  await page.goto("/superadmin/structure");
  await expect(page.getByRole("heading", { name: "Блоки" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Все точки" })).toBeVisible();

  await page.goto("/superadmin/profile");
  await expect(page.getByText("Суперадмин", { exact: true })).toBeVisible();
  await expect(page.getByText("ID в системе", { exact: true })).toBeVisible();

  await page.goto("/superadmin/accounts");
  await expect(page.getByRole("heading", { name: "Аккаунты" })).toBeVisible();
  await expect(page.getByText(/\d+ аккаунтов/)).toBeVisible();
  await page.getByRole("button", { name: "Создать пользователя" }).click();
  await page.getByPlaceholder("external_system_id").fill(temporaryLogin);
  await page.getByPlaceholder("Минимум 8 символов").fill(temporaryPassword);
  await page.getByText("Имя", { exact: true }).locator("..").getByRole("textbox").fill("Full");
  await page.getByText("Фамилия", { exact: true }).locator("..").getByRole("textbox").fill("Check");
  await page.getByRole("button", { name: "Создать", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Пользователь создан" })).toBeVisible();
  temporaryAccountCreated = true;
  await page.getByRole("button", { name: "Готово" }).click();

  try {
    await page.goto("/superadmin/profile");
    await page.getByRole("button", { name: "Выйти из аккаунта" }).click();
    await signIn(page, temporaryLogin, temporaryPassword, /\/seller\/?$/);
    await expect(page.getByText("План на сегодня", { exact: true })).toBeVisible();

    await page.goto("/seller/knowledge");
    await expect(page.getByRole("heading", { name: "Мои курсы" })).toBeVisible();

    await page.goto("/seller/sales");
    await expect(page.getByRole("heading", { name: "Мои продажи" })).toBeVisible();

    await page.goto("/seller/rating");
    await expect(page.getByRole("heading", { name: "Рейтинг" })).toBeVisible();

    await page.goto("/seller/profile");
    await expect(page.getByRole("button", { name: "Выйти из аккаунта" })).toBeVisible();
  } finally {
    if (temporaryAccountCreated) {
      await page.goto("/login");
      await page.evaluate(() => localStorage.clear());
      await page.context().clearCookies();
      await signIn(page, superadminLogin!, superadminPassword!, /\/superadmin\/?$/);
      await page.goto("/superadmin/accounts");
      await page.getByPlaceholder("Поиск по ФИО или ID...").fill(temporaryLogin);
      const accountRow = page
        .getByText(temporaryLogin, { exact: true })
        .locator("xpath=ancestor::div[contains(@class, 'items-center')][1]");
      await expect(accountRow).toBeVisible();
      await accountRow.getByRole("button", { name: "Удалить" }).click();
      const deleteResponsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === "DELETE" &&
          response.url().includes("/api/v1/admin/software/users/"),
      );
      await page.getByRole("button", { name: "Подтвердить" }).click();
      const deleteResponse = await deleteResponsePromise;
      expect(deleteResponse.status()).toBe(204);
      await expect(page.getByRole("heading", { name: "Удалить аккаунт?" })).toBeHidden();
      await expect(page.getByText(temporaryLogin, { exact: true })).toHaveCount(0);
    }
  }

  expect(pageErrors).toEqual([]);
  expect(unexpectedServerErrors).toEqual([]);
});
