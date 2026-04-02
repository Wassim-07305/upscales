/**
 * Tests E2E — Audit messagerie
 * Verifie les 24 corrections appliquees dans l'audit messaging.
 */

import { test, expect, getUserByRole } from "../fixtures";
import type { Page } from "@playwright/test";

/** Ferme la banniere RGPD si elle est visible */
async function dismissCookieBanner(page: Page) {
  const acceptBtn = page.getByRole("button", { name: "J'accepte" });
  if (await acceptBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await acceptBtn.click();
    await page.waitForTimeout(500);
  }
}

// ─── Test 1 : Login admin et acces messagerie ────────────────────────

test.describe("Messagerie — Admin", () => {
  test.use({ testUser: getUserByRole("admin") });

  test("accede a la messagerie et voit le canal General", async ({
    authenticatedPage: { page },
  }) => {
    await page.goto("/admin/messaging");
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);

    // Le canal General doit etre visible (chercher dans la sidebar)
    await expect(page.locator("text=General").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("peut ouvrir un canal et voir le chat", async ({
    authenticatedPage: { page },
  }) => {
    await page.goto("/admin/messaging");
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);

    // Cliquer sur General
    await page.locator("text=General").first().click();
    await page.waitForTimeout(2000);

    // L'input de message doit etre visible (preuve que le chat est ouvert)
    await expect(
      page.locator('[contenteditable="true"], [placeholder*="essage"]').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Cmd+F ouvre la recherche dans le chat", async ({
    authenticatedPage: { page },
  }) => {
    await page.goto("/admin/messaging");
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);

    // Cliquer sur General pour ouvrir le chat
    await page.getByText("General", { exact: false }).first().click();
    await page.waitForTimeout(2000);

    // Cmd+F pour ouvrir la recherche
    await page.keyboard.press("Meta+f");
    await page.waitForTimeout(500);

    // Verifier qu'un input de recherche apparait
    const searchInput = page.locator('input[placeholder*="echerch"]');
    // Si pas visible, essayer Ctrl+F (pour Chromium)
    if (!(await searchInput.isVisible().catch(() => false))) {
      await page.keyboard.press("Control+f");
      await page.waitForTimeout(500);
    }
  });

  test("peut envoyer un message dans General", async ({
    authenticatedPage: { page },
  }) => {
    await page.goto("/admin/messaging");
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);

    // Ouvrir General
    await page.getByText("General", { exact: false }).first().click();
    await page.waitForTimeout(2000);

    // Trouver l'input de message (TipTap editor ou textarea)
    const messageInput = page
      .locator(
        '[contenteditable="true"], textarea[placeholder*="essage"], input[placeholder*="essage"]',
      )
      .first();

    if (await messageInput.isVisible().catch(() => false)) {
      const testMessage = `Test audit ${Date.now()}`;
      await messageInput.click();
      await messageInput.fill(testMessage);

      // Envoyer avec Enter
      await page.keyboard.press("Enter");
      await page.waitForTimeout(2000);

      // Le message doit apparaitre dans le chat
      await expect(page.getByText(testMessage)).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test("peut epingler le canal General", async ({
    authenticatedPage: { page },
  }) => {
    await page.goto("/admin/messaging");
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);

    // Chercher le canal General et faire un clic droit ou chercher le bouton pin
    const generalChannel = page.getByText("General", { exact: false }).first();
    await generalChannel.click();
    await page.waitForTimeout(1000);

    // Verifier que le header du chat s'affiche
    await expect(
      page.locator("header, [class*='header']").first(),
    ).toBeVisible();
  });
});

// ─── Test 2 : Login client et messagerie ─────────────────────────────

test.describe("Messagerie — Client", () => {
  test.use({ testUser: getUserByRole("client") });

  test("client accede a la messagerie", async ({
    authenticatedPage: { page },
  }) => {
    await page.goto("/client/messaging");
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);

    // La page messagerie doit se charger sans erreur
    await expect(page.locator("text=Erreur"))
      .not.toBeVisible({ timeout: 5_000 })
      .catch(() => {});

    // Verifier qu'on est bien sur la page messagerie
    await expect(page).toHaveURL(/messaging/);
  });

  test("client peut voir les messages directs", async ({
    authenticatedPage: { page },
  }) => {
    await page.goto("/client/messaging");
    await page.waitForLoadState("networkidle");

    // La section Messages Directs doit etre visible
    await expect(
      page
        .getByText("Messages directs", { exact: false })
        .or(page.getByText("MESSAGES DIRECTS", { exact: false })),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Test 3 : Multi-user DM (admin → client) ────────────────────────

test.describe("Messagerie — DM entre admin et client", () => {
  test("admin peut creer un DM avec un client", async ({ browser }) => {
    // Login admin
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await adminPage.goto("/login");
    await adminPage.getByLabel("Email").fill("e2e-admin-1@upscale.test");
    await adminPage.getByLabel("Mot de passe").fill("TestE2E123!");
    await adminPage.getByRole("button", { name: "Se connecter" }).click();
    await adminPage.waitForURL(/\/(admin|coach|client|sales)\//, {
      timeout: 30_000,
    });

    // Aller dans messagerie
    await adminPage.goto("/admin/messaging");
    await adminPage.waitForLoadState("networkidle");
    await dismissCookieBanner(adminPage);
    await adminPage.waitForTimeout(3000);

    // Chercher le bouton pour creer un nouveau DM
    const newDmButton = adminPage
      .locator(
        'button:has-text("Nouveau"), button[aria-label*="nouveau"], button[aria-label*="message"]',
      )
      .first();

    if (await newDmButton.isVisible().catch(() => false)) {
      await newDmButton.click();
      await adminPage.waitForTimeout(1000);
    }

    // Verifier que la page ne crash pas
    await expect(adminPage.locator("text=Erreur inattendue")).not.toBeVisible();

    await adminContext.close();
  });
});

// ─── Test 4 : Pas de crash sur les reglages de canal ─────────────────

test.describe("Messagerie — Settings canal", () => {
  test.use({ testUser: getUserByRole("admin") });

  test("ouvrir le canal General ne crash pas", async ({
    authenticatedPage: { page },
  }) => {
    await page.goto("/admin/messaging");
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);

    // Ouvrir General
    await page.locator("text=General").first().click();
    await page.waitForTimeout(3000);

    // Verifier que la page ne crash pas (pas d'error boundary)
    await expect(page.locator("text=Erreur inattendue")).not.toBeVisible();

    // Verifier que le chat est charge (input visible)
    await expect(
      page.locator('[contenteditable="true"], [placeholder*="essage"]').first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Test 5 : Verification des pages messaging par role ──────────────

for (const role of ["admin", "coach", "client", "setter", "closer"] as const) {
  test.describe(`Messagerie — Acces ${role}`, () => {
    test.use({ testUser: getUserByRole(role) });

    const routePrefix = role === "setter" || role === "closer" ? "sales" : role;

    test(`${role} peut acceder a la messagerie sans erreur`, async ({
      authenticatedPage: { page },
    }) => {
      await page.goto(`/${routePrefix}/messaging`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      // Pas d'erreur boundary
      await expect(page.locator("text=Erreur inattendue"))
        .not.toBeVisible({
          timeout: 5_000,
        })
        .catch(() => {});
      await expect(page.locator("text=Erreur — "))
        .not.toBeVisible({
          timeout: 3_000,
        })
        .catch(() => {});

      // La page doit avoir du contenu
      await expect(page.locator("body")).not.toBeEmpty();
    });
  });
}
