import { expect, test } from "@playwright/test";

const login = process.env.E2E_SUPERADMIN_LOGIN;
const password = process.env.E2E_SUPERADMIN_PASSWORD;

test("superadmin can sign in and manage a user", async ({ page }) => {
  test.skip(!login || !password, "Set E2E_SUPERADMIN_LOGIN and E2E_SUPERADMIN_PASSWORD");
  const temporaryLogin = `pw_check_${Date.now()}`;
  const pageErrors: string[] = [];
  const serverErrors: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 500) {
      serverErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto("/");
  await page.getByPlaceholder("Введите ID сотрудника").fill(login!);
  await page.getByPlaceholder("Введите пароль").fill(password!);
  await page.getByRole("button", { name: "Войти" }).click();

  await expect(page).toHaveURL(/\/superadmin(?:\/)?$/);
  await expect(page.getByText("СуперАдмин", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Выйти из аккаунта" })).toBeVisible();

  await page.goto("/superadmin/accounts");
  await expect(page.getByRole("heading", { name: "Аккаунты" })).toBeVisible();
  await expect(page.getByText(/\d+ аккаунтов/)).toBeVisible();

  await page.getByRole("button", { name: "Создать пользователя" }).click();
  await expect(page.getByRole("heading", { name: "Новый пользователь" })).toBeVisible();
  await page.getByPlaceholder("external_system_id").fill(temporaryLogin);
  await page.getByPlaceholder("Минимум 8 символов").fill("Playwright2026!");
  await page.getByText("Имя", { exact: true }).locator("..").getByRole("textbox").fill("Playwright");
  await page.getByText("Фамилия", { exact: true }).locator("..").getByRole("textbox").fill("Check");
  await page.getByRole("button", { name: "Создать", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Пользователь создан" })).toBeVisible();
  await expect(page.getByText(temporaryLogin, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Готово" }).click();

  await page.getByPlaceholder("Поиск по ФИО или ID...").fill(temporaryLogin);
  const accountRow = page.getByText(temporaryLogin, { exact: true }).locator("xpath=ancestor::div[contains(@class, 'items-center')][1]");
  await expect(accountRow).toBeVisible();
  await accountRow.getByRole("button", { name: "Удалить" }).click();
  await expect(page.getByRole("heading", { name: "Удалить аккаунт?" })).toBeVisible();
  await page.getByRole("button", { name: "Подтвердить" }).click();
  await expect(page.getByText(temporaryLogin, { exact: true })).toHaveCount(0);

  expect(pageErrors).toEqual([]);
  expect(serverErrors).toEqual([]);
});
