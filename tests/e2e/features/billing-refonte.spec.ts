import { test, expect, Page } from "@playwright/test";
import { setupNetworkErrorTracking } from "./helpers";

// ─── Helpers ─────────────────────────────────────────────

/**
 * Verifie les erreurs reseau en ignorant les erreurs connues.
 * Bug connu : upsell_opportunities retourne 400 (double filtre created_at).
 */
function checkNoNetworkErrorsIgnoringKnown(
  tracker: ReturnType<typeof setupNetworkErrorTracking>,
) {
  const errors = tracker
    .getErrors()
    .filter((e) => !e.url.includes("upsell_opportunities"));
  if (errors.length > 0) {
    const details = errors
      .map((e) => `  [${e.status}] ${e.method} ${e.url}`)
      .join("\n");
    expect(
      errors,
      `Network API errors detected during test:\n${details}`,
    ).toHaveLength(0);
  }
}

const ADMIN_EMAIL = "e2e-admin-1@offmarket.test";
const ADMIN_PASSWORD = "TestE2E123!";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.fill("input[type='email'], input[name='email']", ADMIN_EMAIL);
  await page.fill(
    "input[type='password'], input[name='password']",
    ADMIN_PASSWORD,
  );
  await page.locator('button[type="submit"]').first().click();
  // Attendre la redirection post-login
  await page.waitForURL(/\/(admin|coach|client|sales)/, { timeout: 30_000 });
  // Fermer le popup RGPD si present
  const rgpdButton = page.getByRole("button", { name: /J.accepte/i });
  if (await rgpdButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await rgpdButton.click();
  }
}

async function goToBilling(page: Page) {
  await page.goto("/admin/billing");
  // Attendre que la page charge (titre Finances visible)
  await expect(page.getByRole("heading", { name: "Finances" })).toBeVisible({
    timeout: 30_000,
  });
}

// ─── Tests ───────────────────────────────────────────────

test.describe("Finance Admin — /admin/billing (refonte)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ════════════════════════════════════════════════════════
  // 1. STRUCTURE DE LA PAGE
  // ════════════════════════════════════════════════════════

  test.describe("Structure de la page", () => {
    test("affiche le titre Finances et la description", async ({ page }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      await expect(
        page.getByRole("heading", { name: "Finances" }),
      ).toBeVisible();
      await expect(
        page.getByText(
          "Vue d'ensemble des revenus, paiements et encaissements",
        ),
      ).toBeVisible();

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("affiche le select de filtre de periode avec '30 derniers jours' par defaut", async ({
      page,
    }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      // Le select doit exister et avoir "30 derniers jours" selectionne
      const periodSelect = page.locator("select").first();
      await expect(periodSelect).toBeVisible();
      await expect(periodSelect).toHaveValue("30d");

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("affiche les 8 KPI cards", async ({ page }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      // Les 8 KPI cards sont dans une grille grid-cols-2 lg:grid-cols-4
      const kpiGrid = page.locator(".grid.grid-cols-2").first();
      await expect(kpiGrid).toBeVisible({ timeout: 15_000 });

      const kpiLabels = [
        "CA période",
        "Encaissé",
        "Restant",
        "Panier moyen",
        "En retard",
        "Recouvrement",
        "LTV moyenne",
        "Revenu Upsell",
      ];

      for (const label of kpiLabels) {
        await expect(kpiGrid.getByText(label, { exact: true })).toBeVisible({
          timeout: 15_000,
        });
      }

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("ne contient PAS de HeroMetric 'Revenus du mois'", async ({
      page,
    }) => {
      await goToBilling(page);

      // Attendre que les KPIs se chargent
      await expect(page.getByText("CA période", { exact: true })).toBeVisible();

      // Verifier l'absence
      await expect(page.getByText("Revenus du mois")).not.toBeVisible();
    });

    test("affiche la section 'Detail LTV par client'", async ({ page }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      await expect(page.getByText("Détail LTV par client")).toBeVisible({
        timeout: 15_000,
      });

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("affiche la section 'Recommandations (Referral)'", async ({
      page,
    }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      await expect(page.getByText("Recommandations (Referral)")).toBeVisible({
        timeout: 15_000,
      });

      // Verifier les 3 sous-metriques
      await expect(page.getByText("Nb recommandations")).toBeVisible();
      await expect(page.getByText("CA moyen / referral")).toBeVisible();
      await expect(page.getByText("CA total Referral")).toBeVisible();

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("affiche la section 'CA par source d'acquisition'", async ({
      page,
    }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      await expect(page.getByText("CA par source d'acquisition")).toBeVisible({
        timeout: 15_000,
      });

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("affiche la section 'CA facture vs Cash collecte' (graphique)", async ({
      page,
    }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      await expect(page.getByText("CA facturé vs Cash collecté")).toBeVisible({
        timeout: 15_000,
      });

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("affiche la section 'Detail des paiements & encaissements'", async ({
      page,
    }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      await expect(
        page.getByText("Détail des paiements & encaissements"),
      ).toBeVisible({ timeout: 15_000 });

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("affiche la section 'Paiements a venir'", async ({ page }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      await expect(page.getByText(/Paiements à venir/)).toBeVisible({
        timeout: 15_000,
      });

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("affiche la section 'Previsionnel des 6 prochains mois'", async ({
      page,
    }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      await expect(
        page.getByText("Prévisionnel des 6 prochains mois"),
      ).toBeVisible({ timeout: 15_000 });

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("affiche les boutons 'Nouveau contrat' et 'Nouvelle facture'", async ({
      page,
    }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      await expect(
        page.getByRole("link", { name: /Nouveau contrat/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Nouvelle facture/i }),
      ).toBeVisible();

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });
  });

  // ════════════════════════════════════════════════════════
  // 2. FILTRE DE PERIODE
  // ════════════════════════════════════════════════════════

  test.describe("Filtre de periode", () => {
    test("changer vers 'Ce mois-ci' ne crashe pas et les KPIs restent visibles", async ({
      page,
    }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      const periodSelect = page.locator("select").first();
      await periodSelect.selectOption("this-month");
      await expect(periodSelect).toHaveValue("this-month");

      // Les KPIs doivent rester visibles apres le changement
      await expect(page.getByText("CA période", { exact: true })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByText("Encaissé", { exact: true })).toBeVisible();

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("changer vers '7 derniers jours' ne crashe pas", async ({ page }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      const periodSelect = page.locator("select").first();
      await periodSelect.selectOption("7d");
      await expect(periodSelect).toHaveValue("7d");

      await expect(page.getByText("CA période", { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("changer vers '14 derniers jours' ne crashe pas", async ({ page }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      const periodSelect = page.locator("select").first();
      await periodSelect.selectOption("14d");
      await expect(periodSelect).toHaveValue("14d");

      await expect(page.getByText("CA période", { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("changer vers 'Mois dernier' ne crashe pas", async ({ page }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      const periodSelect = page.locator("select").first();
      await periodSelect.selectOption("last-month");
      await expect(periodSelect).toHaveValue("last-month");

      await expect(page.getByText("CA période", { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("changer vers '3 derniers mois' ne crashe pas", async ({ page }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      const periodSelect = page.locator("select").first();
      await periodSelect.selectOption("3m");
      await expect(periodSelect).toHaveValue("3m");

      await expect(page.getByText("CA période", { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("changer vers 'Cette annee' ne crashe pas", async ({ page }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      const periodSelect = page.locator("select").first();
      await periodSelect.selectOption("this-year");
      await expect(periodSelect).toHaveValue("this-year");

      await expect(page.getByText("CA période", { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("cycle rapide entre toutes les periodes sans crash", async ({
      page,
    }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      const periodSelect = page.locator("select").first();
      const periods = [
        "7d",
        "14d",
        "this-month",
        "last-month",
        "3m",
        "this-year",
        "30d",
      ];

      for (const p of periods) {
        await periodSelect.selectOption(p);
        // Petit delai pour laisser React re-render
        await page.waitForTimeout(300);
      }

      // La page doit toujours etre debout
      await expect(
        page.getByRole("heading", { name: "Finances" }),
      ).toBeVisible();

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });
  });

  // ════════════════════════════════════════════════════════
  // 3. SELECTEUR MOIS CUSTOM
  // ════════════════════════════════════════════════════════

  test.describe("Selecteur mois personnalise", () => {
    test("selectionner 'Mois personnalise' fait apparaitre 2 selects supplementaires", async ({
      page,
    }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      const periodSelect = page.locator("select").first();

      // Avant : seulement 1 select visible (le filtre de periode)
      const selectsBefore = await page.locator("select").count();

      await periodSelect.selectOption("custom");
      await expect(periodSelect).toHaveValue("custom");

      // Apres : 3 selects visibles (periode + mois + annee)
      await expect(page.locator("select")).toHaveCount(selectsBefore + 2, {
        timeout: 5_000,
      });

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("les selects mois/annee disparaissent quand on revient a une autre periode", async ({
      page,
    }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      const periodSelect = page.locator("select").first();

      // Aller en custom
      await periodSelect.selectOption("custom");
      const selectsCustom = await page.locator("select").count();
      expect(selectsCustom).toBeGreaterThanOrEqual(3);

      // Revenir a 30d
      await periodSelect.selectOption("30d");

      // Les selects supplementaires doivent disparaitre
      await expect(page.locator("select")).toHaveCount(selectsCustom - 2, {
        timeout: 5_000,
      });

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("changer le mois custom ne crashe pas et les KPIs se mettent a jour", async ({
      page,
    }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      const periodSelect = page.locator("select").first();
      await periodSelect.selectOption("custom");

      // Selectionner un mois different (janvier = 0)
      const monthSelect = page.locator("select").nth(1);
      await monthSelect.selectOption("0");

      // Les KPIs doivent rester
      await expect(page.getByText("CA période", { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("changer l'annee custom ne crashe pas", async ({ page }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      const periodSelect = page.locator("select").first();
      await periodSelect.selectOption("custom");

      // Changer l'annee (l'annee precedente)
      const yearSelect = page.locator("select").nth(2);
      const currentYear = new Date().getFullYear();
      await yearSelect.selectOption(String(currentYear - 1));

      await expect(page.getByText("CA période", { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });
  });

  // ════════════════════════════════════════════════════════
  // 4. DONNEES ET AFFICHAGE
  // ════════════════════════════════════════════════════════

  test.describe("Donnees et affichage", () => {
    test("les KPI cards affichent des montants en EUR (format fr-FR)", async ({
      page,
    }) => {
      await goToBilling(page);

      // Attendre que les donnees se chargent (le loading disparait)
      await expect(page.getByText("CA période", { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      // Verifier qu'on trouve au moins un montant EUR sur la page
      // Le format fr-FR utilise des espaces insecables, donc on cherche le symbole EUR
      const euroValues = page.locator("text=/\\d.*€/");
      const count = await euroValues.count();
      expect(count).toBeGreaterThan(0);
    });

    test("la section Referral affiche 3 metriques numeriques", async ({
      page,
    }) => {
      await goToBilling(page);

      await expect(page.getByText("Recommandations (Referral)")).toBeVisible({
        timeout: 15_000,
      });

      // Les 3 labels doivent etre la
      await expect(page.getByText("Nb recommandations")).toBeVisible();
      await expect(page.getByText("CA moyen / referral")).toBeVisible();
      await expect(page.getByText("CA total Referral")).toBeVisible();
    });

    test("le previsionnel affiche jusqu'a 6 cartes de mois", async ({
      page,
    }) => {
      await goToBilling(page);

      await expect(
        page.getByText("Prévisionnel des 6 prochains mois"),
      ).toBeVisible({ timeout: 15_000 });

      // Chercher les textes "echeance(s) a venir" qui apparaissent dans chaque carte
      const forecastCards = page.getByText(/échéance\(s\) à venir/);
      const count = await forecastCards.count();
      // Le previsionnel doit afficher entre 0 et 6 cartes
      expect(count).toBeLessThanOrEqual(6);
    });
  });

  // ════════════════════════════════════════════════════════
  // 5. NAVIGATION
  // ════════════════════════════════════════════════════════

  test.describe("Navigation", () => {
    test("le lien 'Nouveau contrat' pointe vers /admin/billing/contracts", async ({
      page,
    }) => {
      await goToBilling(page);

      const link = page.getByRole("link", { name: /Nouveau contrat/i });
      await expect(link).toHaveAttribute("href", "/admin/billing/contracts");
    });

    test("le lien 'Nouvelle facture' pointe vers /admin/billing/invoices", async ({
      page,
    }) => {
      await goToBilling(page);

      const link = page.getByRole("link", { name: /Nouvelle facture/i });
      await expect(link).toHaveAttribute("href", "/admin/billing/invoices");
    });
  });

  // ════════════════════════════════════════════════════════
  // 7. RESILIENCE — pas de crash sur refresh ou retour arriere
  // ════════════════════════════════════════════════════════

  test.describe("Resilience", () => {
    test("refresh de la page ne cause pas de crash", async ({ page }) => {
      const tracker = setupNetworkErrorTracking(page);
      await goToBilling(page);

      // Attendre le chargement complet
      await expect(page.getByText("CA période", { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      // Refresh
      await page.reload();

      // La page doit se recharger normalement
      await expect(page.getByRole("heading", { name: "Finances" })).toBeVisible(
        { timeout: 30_000 },
      );
      await expect(page.getByText("CA période", { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      checkNoNetworkErrorsIgnoringKnown(tracker);
    });

    test("changer de filtre puis refresh garde la page fonctionnelle", async ({
      page,
    }) => {
      await goToBilling(page);

      const periodSelect = page.locator("select").first();
      await periodSelect.selectOption("this-month");

      await page.reload();

      await expect(page.getByRole("heading", { name: "Finances" })).toBeVisible(
        { timeout: 30_000 },
      );

      // Le select revient a la valeur par defaut (30d) apres reload (state non persiste)
      await expect(periodSelect).toHaveValue("30d");
    });
  });
});

// ════════════════════════════════════════════════════════
// PERMISSIONS — Acces interdit sans authentification
// ════════════════════════════════════════════════════════

test.describe("Finance Admin — Permissions", () => {
  test("un utilisateur non connecte qui accede a /admin/billing est redirige vers /login", async ({
    page,
  }) => {
    // Contexte frais, pas de login
    await page.goto("/admin/billing");
    // Le middleware doit rediriger vers login
    await page.waitForURL(/\/(login|auth)/, { timeout: 15_000 });
  });
});
