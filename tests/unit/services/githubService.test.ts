import { GitHubService } from "../../../src/services/githubService.js";

// Tests de la logique métier de GitHubService sans appels réseau réels
describe("GitHubService - Logique Métier Réelle", () => {
  // Mock global fetch pour éviter les appels réseau
  global.fetch = jest.fn();
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Configuration par défaut des variables d'environnement
    process.env.GITHUB_TOKEN = "test-token-123";
    process.env.GITHUB_REPO_OWNER = "test-owner";
    process.env.GITHUB_REPO_NAME = "test-repo";
  });

  afterEach(() => {
    // Nettoyer les variables d'environnement
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_REPO_OWNER;
    delete process.env.GITHUB_REPO_NAME;
  });

  describe("createIssueFromBugReport", () => {
    it("devrait formater correctement le bug report et créer l'issue GitHub", async () => {
      const bugReportData = {
        title: "Bug critique dans le quiz",
        description: "Le quiz ne fonctionne pas correctement sur mobile",
        stepsToReproduce:
          "1. Ouvrir sur mobile\n2. Démarrer quiz\n3. Observer le bug",
        location: "/quiz/multiplayer",
        environment: {
          browser: "Safari",
          browserVersion: "16.5",
          operatingSystem: "iOS 16.5",
          deviceType: "mobile",
          screenResolution: "390x844",
        },
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)",
        url: "https://mapquiz.app/quiz/123?token=secret&id=456",
        reporterId: "user-789",
      };

      // Mock de la réponse GitHub
      const mockGitHubResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            number: 42,
            title: "[Bug Report] Bug critique dans le quiz",
            html_url: "https://github.com/test-owner/test-repo/issues/42",
          }),
      };
      mockFetch.mockResolvedValue(mockGitHubResponse as Response);

      const result = await GitHubService.createIssueFromBugReport(
        bugReportData
      );

      // VALIDATION DE LA LOGIQUE MÉTIER RÉELLE

      // 1. Vérifier l'appel à l'API GitHub
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/map-quiz/mapquiz-back/issues",
        {
          method: "POST",
          headers: {
            Authorization: "token test-token-123",
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: expect.any(String),
        }
      );

      // 2. Vérifier le contenu du body de l'issue
      const requestBody = JSON.parse(
        mockFetch.mock.calls[0][1]?.body as string
      );

      expect(requestBody.title).toBe("[Bug Report] Bug critique dans le quiz");
      expect(requestBody.labels).toEqual([
        "bug",
        "user-reported",
        "needs-triage",
      ]);
      expect(requestBody.assignees).toEqual([]);

      // 3. Vérifier que le markdown est bien formaté
      expect(requestBody.body).toContain("## 🐛 Rapport de Bug Utilisateur");
      expect(requestBody.body).toContain("### Description");
      expect(requestBody.body).toContain(
        "Le quiz ne fonctionne pas correctement sur mobile"
      );
      expect(requestBody.body).toContain("### Étapes de reproduction");
      expect(requestBody.body).toContain("1. Ouvrir sur mobile");
      expect(requestBody.body).toContain("### Localisation");
      expect(requestBody.body).toContain("/quiz/multiplayer");
      expect(requestBody.body).toContain("### Informations techniques");
      expect(requestBody.body).toContain("**Navigateur** : Safari 16.5");
      expect(requestBody.body).toContain("**OS** : iOS 16.5");
      expect(requestBody.body).toContain("**Appareil** : mobile");
      expect(requestBody.body).toContain("**Résolution** : 390x844");

      // 4. Vérifier l'anonymisation des données sensibles
      expect(requestBody.body).not.toContain("token=secret");
      expect(requestBody.body).not.toContain("id=456");
      expect(requestBody.body).toContain("/quiz/123"); // URL anonymisée
      expect(requestBody.body).toContain("Unknown Browser on Unknown OS"); // User-Agent non reconnu dans l'anonymisation
      expect(requestBody.body).toContain("**Type** : Utilisateur connecté");

      // 5. Vérifier le résultat retourné
      expect(result).toEqual({
        success: true,
        issueNumber: 42,
        issueUrl: "https://github.com/test-owner/test-repo/issues/42",
        message: "Bug report créé: Issue #42",
      });
    });

    it("devrait gérer l'anonymisation des URLs avec paramètres sensibles", async () => {
      const bugReportData = {
        title: "Test anonymisation",
        description: "Test de l'anonymisation des URLs sensibles",
        environment: { browser: "Chrome" },
        url: "https://mapquiz.app/game?token=abc123&auth=xyz789&key=secret&password=hidden&secret=value&id=userId",
      };

      const mockGitHubResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            number: 1,
            html_url: "https://github.com/test/test/issues/1",
          }),
      };
      mockFetch.mockResolvedValue(mockGitHubResponse as Response);

      await GitHubService.createIssueFromBugReport(bugReportData);

      const requestBody = JSON.parse(
        mockFetch.mock.calls[0][1]?.body as string
      );

      // VALIDATION DE L'ANONYMISATION RÉELLE
      expect(requestBody.body).toContain("**URL** : /game");
      expect(requestBody.body).not.toContain("token=");
      expect(requestBody.body).not.toContain("auth=");
      expect(requestBody.body).not.toContain("key=");
      expect(requestBody.body).not.toContain("password=");
      expect(requestBody.body).not.toContain("secret=");
      expect(requestBody.body).not.toContain("id=");
    });

    it("devrait gérer l'anonymisation des User-Agents", async () => {
      const bugReportData = {
        title: "Test User-Agent",
        description: "Test de l'anonymisation des User-Agents",
        environment: { browser: "Firefox" },
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
      };

      const mockGitHubResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            number: 2,
            html_url: "https://github.com/test/test/issues/2",
          }),
      };
      mockFetch.mockResolvedValue(mockGitHubResponse as Response);

      await GitHubService.createIssueFromBugReport(bugReportData);

      const requestBody = JSON.parse(
        mockFetch.mock.calls[0][1]?.body as string
      );

      // VALIDATION DE L'ANONYMISATION RÉELLE
      expect(requestBody.body).toContain(
        "**User-Agent** : Firefox/119 on Windows"
      );
      expect(requestBody.body).not.toContain("Win64; x64");
      expect(requestBody.body).not.toContain("rv:109.0");
      expect(requestBody.body).not.toContain("Gecko/20100101");
    });

    it("devrait gérer les utilisateurs anonymes correctement", async () => {
      const bugReportData = {
        title: "Bug utilisateur anonyme",
        description: "Test pour utilisateur non connecté",
        environment: { browser: "Chrome" },
        // Pas de reporterId
      };

      const mockGitHubResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            number: 3,
            html_url: "https://github.com/test/test/issues/3",
          }),
      };
      mockFetch.mockResolvedValue(mockGitHubResponse as Response);

      await GitHubService.createIssueFromBugReport(bugReportData);

      const requestBody = JSON.parse(
        mockFetch.mock.calls[0][1]?.body as string
      );

      // VALIDATION POUR UTILISATEUR ANONYME
      expect(requestBody.body).toContain("**Type** : Utilisateur anonyme");
      expect(requestBody.body).not.toContain("Utilisateur connecté");
    });

    it("devrait gérer les champs optionnels manquants", async () => {
      const bugReportData = {
        title: "Bug minimal",
        description: "Bug report avec seulement les champs requis",
        environment: {},
        // Pas de stepsToReproduce, location, userAgent, url
      };

      const mockGitHubResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            number: 4,
            html_url: "https://github.com/test/test/issues/4",
          }),
      };
      mockFetch.mockResolvedValue(mockGitHubResponse as Response);

      await GitHubService.createIssueFromBugReport(bugReportData);

      const requestBody = JSON.parse(
        mockFetch.mock.calls[0][1]?.body as string
      );

      // VALIDATION DES VALEURS PAR DÉFAUT
      expect(requestBody.body).toContain("**URL** : Non spécifiée");
      expect(requestBody.body).toContain("**Navigateur** : Inconnu");
      expect(requestBody.body).toContain("**OS** : Inconnu");
      expect(requestBody.body).toContain("**User-Agent** : Non spécifié");
      expect(requestBody.body).not.toContain("### Étapes de reproduction");
      expect(requestBody.body).not.toContain("### Localisation");
    });
  });

  describe("Gestion d'Erreurs GitHub API", () => {
    it("devrait lever une erreur si le token GitHub est manquant", async () => {
      delete process.env.GITHUB_TOKEN;

      const bugReportData = {
        title: "Test sans token",
        description: "Test de la gestion d'erreur token manquant",
        environment: { browser: "Chrome" },
      };

      // VALIDATION DE LA LOGIQUE D'ERREUR
      await expect(
        GitHubService.createIssueFromBugReport(bugReportData)
      ).rejects.toThrow("GitHub token non configuré");

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("devrait gérer les erreurs d'API GitHub avec détails", async () => {
      const bugReportData = {
        title: "Test erreur API",
        description: "Test de la gestion d'erreur API GitHub",
        environment: { browser: "Chrome" },
      };

      const mockErrorResponse = {
        ok: false,
        status: 401,
        text: () => Promise.resolve('{"message":"Bad credentials"}'),
      };
      mockFetch.mockResolvedValue(mockErrorResponse as Response);

      // VALIDATION DE LA GESTION D'ERREUR DÉTAILLÉE
      await expect(
        GitHubService.createIssueFromBugReport(bugReportData)
      ).rejects.toThrow(
        'Erreur GitHub API: 401 - {"message":"Bad credentials"}'
      );
    });

    it("devrait utiliser les variables d'environnement par défaut", async () => {
      // Supprimer les variables personnalisées
      delete process.env.GITHUB_REPO_OWNER;
      delete process.env.GITHUB_REPO_NAME;

      const bugReportData = {
        title: "Test valeurs par défaut",
        description:
          "Test des valeurs par défaut des variables d'environnement",
        environment: { browser: "Chrome" },
      };

      const mockGitHubResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            number: 5,
            html_url: "https://github.com/map-quiz/mapquiz-back/issues/5",
          }),
      };
      mockFetch.mockResolvedValue(mockGitHubResponse as Response);

      await GitHubService.createIssueFromBugReport(bugReportData);

      // VALIDATION DES VALEURS PAR DÉFAUT
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/map-quiz/mapquiz-back/issues",
        expect.any(Object)
      );
    });
  });
});
