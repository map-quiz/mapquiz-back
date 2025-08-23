# Guide de Développement - Backend MapQuiz

## 🚀 **Installation Rapide**

### **Prérequis Système**

- **Node.js** : v18+ (recommandé v22.16.0)
- **npm** : v8+
- **Docker** : Pour PostgreSQL de test
- **Git** : Gestion des versions

### **Outils Globaux Recommandés**

```bash
# TypeScript et outils de développement
npm install -g typescript tsx

# Prisma CLI
npm install -g prisma

# Fly CLI (pour déploiement)
curl -L https://fly.io/install.sh | sh
```

## ⚡ **Démarrage Express**

### **1. Installation**

```bash
# Cloner le repository
git clone https://github.com/map-quiz/mapquiz-back.git
cd mapquiz-backend

# Installer les dépendances
npm install
```

### **2. Configuration**

```bash
# Copier le template de configuration
cp env.example .env

# Éditer .env avec vos valeurs
nano .env  # ou votre éditeur préféré
```

### **3. Base de Données**

```bash
# Démarrer PostgreSQL (Docker)
npm run test:docker:start

# Appliquer les migrations
npm run db:push

# Générer le client Prisma
npm run db:generate
```

### **4. Démarrage**

```bash
# Mode développement avec hot-reload
npm run dev

# Vérifier que ça fonctionne
curl http://localhost:3000/health
```

**🌐 API disponible** : http://localhost:3000

## 🛠️ **Stack Technique Détaillée**

### **Runtime et Framework**

- **Node.js 22** : Runtime JavaScript/TypeScript
- **Fastify** : Framework web haute performance
- **TypeScript** : Langage avec typage statique
- **tsx** : Exécution directe TypeScript en développement

### **Base de Données**

- **PostgreSQL** : Base de données relationnelle
- **Prisma** : ORM moderne avec type-safety
- **Migrations** : Gestion des évolutions de schéma

### **Authentication & Sécurité**

- **Better Auth** : Système d'authentification moderne
- **Google OAuth** : Authentification sociale
- **Helmet** : Sécurisation des headers HTTP
- **CORS** : Gestion cross-origin
- **Rate Limiting** : Protection contre les abus

### **Communication Temps Réel**

- **WebSockets** : Communication bidirectionnelle
- **Fastify WebSocket** : Plugin WebSocket optimisé

## 📁 **Structure du Projet**

```
src/
├── controllers/           # Logique des routes HTTP
│   ├── authController.ts     # Authentification
│   ├── userController.ts     # Gestion utilisateurs
│   ├── scoreController.ts    # Scores et historique
│   └── websocketController.ts # WebSocket
├── services/             # Logique métier
│   ├── userService.ts       # Business logic utilisateurs
│   ├── gameService.ts       # Logique de jeu
│   ├── lobbyService.ts      # Gestion des lobbies
│   └── scoreService.ts      # Gestion des scores
├── models/               # Interaction base de données
│   ├── userModel.ts         # Modèle utilisateur
│   ├── lobbyModel.ts        # Modèle lobby
│   └── scoreModel.ts        # Modèle score
├── routes/               # Définition des routes
│   ├── auth.ts             # Routes d'authentification
│   ├── users.ts            # Routes utilisateurs
│   └── scores.ts           # Routes scores
├── websocket/            # Gestion WebSocket
│   ├── core/               # Logique de base WebSocket
│   ├── lobby/              # Gestion lobbies temps réel
│   └── messaging/          # Système de messages
├── lib/                  # Utilitaires et configuration
│   ├── database.ts         # Connexion Prisma
│   ├── auth.ts             # Configuration Better Auth
│   ├── validation.ts       # Schémas Zod
│   └── errorHandler.ts     # Gestion d'erreurs
├── middleware/           # Middlewares Fastify
│   └── auth.ts             # Middleware d'authentification
├── types/                # Types TypeScript
│   ├── api.ts              # Types API
│   ├── user.ts             # Types utilisateur
│   └── game.ts             # Types de jeu
└── server.ts             # Point d'entrée de l'application
```

## 🔧 **Configuration Détaillée**

### **Variables d'Environnement**

**Fichier `.env` (copier depuis `env.example`) :**

```env
# Base de données
DATABASE_URL="postgresql://postgres:password@localhost:5432/mapquiz_dev"

# Authentication
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth (créer dans Google Cloud Console)
GOOGLE_CLIENT_ID="votre-google-client-id"
GOOGLE_CLIENT_SECRET="votre-google-client-secret"

# Configuration application
SERVER_URL="http://localhost:3000"
NODE_ENV="development"
PORT=3000
HOST="0.0.0.0"

# GitHub integration (optionnel - pour bug reports)
GITHUB_TOKEN="votre-github-personal-token"
GITHUB_REPO_OWNER="votre-username"
GITHUB_REPO_NAME="mapquiz-backend"
```

### **Configuration Google OAuth**

1. **Aller sur [Google Cloud Console](https://console.cloud.google.com/)**
2. **Créer/sélectionner un projet**
3. **Activer l'API Google+ et OAuth**
4. **Créer des identifiants OAuth 2.0**
5. **Configurer les URLs autorisées :**
   - **Origine** : `http://localhost:3000`
   - **Redirection** : `http://localhost:3000/auth/callback/google`

### **Configuration Database**

**PostgreSQL local avec Docker :**

```bash
# Démarrer PostgreSQL
npm run test:docker:start

# Se connecter à la DB
psql postgresql://postgres:test_password@localhost:5433/test_db

# Explorer avec Prisma Studio
npm run db:studio
```

## 📋 **Scripts de Développement**

### **Scripts Principaux**

```bash
# Développement
npm run dev                    # Mode développement avec watch
npm run build                  # Build TypeScript
npm run start                  # Démarrage production
npm run build:check           # Vérification TypeScript uniquement

# Base de données
npm run db:generate            # Générer client Prisma
npm run db:push               # Synchroniser schéma (dev)
npm run db:migrate            # Créer une migration
npm run db:studio             # Interface graphique Prisma

# Tests
npm run test                  # Suite complète
npm run test:unit             # Tests unitaires uniquement
npm run test:integration      # Tests d'intégration
npm run test:performance      # Tests de performance
npm run test:coverage         # Avec couverture de code
npm run test:watch            # Mode watch
npm run test:debug            # Mode debug

# Docker pour tests
npm run test:docker:start     # Démarrer PostgreSQL test
npm run test:docker:stop      # Arrêter PostgreSQL test

# Qualité de code
npm run lint                  # ESLint
npm run lint:fix              # Correction automatique
```

## 🧪 **Tests et Qualité**

### **Stratégie de Tests**

**Types de tests :**

- **Unitaires** : Fonctions et services isolés
- **Intégration** : API endpoints avec DB
- **Performance** : Tests de charge et stress

**Configuration Jest :**

- Environnement Node.js avec ts-jest
- Base de données PostgreSQL dédiée
- Couverture de code > 80% requise
- Timeout 30 secondes pour tests async

### **Lancer les Tests**

```bash
# Tests complets avec setup automatique
npm run test

# Tests spécifiques
npm run test:unit              # Rapides, sans DB
npm run test:integration       # Avec DB PostgreSQL
npm run test:performance       # Tests de charge

# Tests en mode développement
npm run test:watch             # Relance automatique
npm run test:coverage          # Avec rapport de couverture
```

### **Structure des Tests**

```
tests/
├── unit/                     # Tests unitaires
│   ├── services/                # Tests des services
│   ├── lib/                     # Tests des utilitaires
│   └── controllers/             # Tests des contrôleurs
├── integration/              # Tests d'intégration
│   ├── http-error-handling.test.ts
│   └── websocket/
├── performance/              # Tests de performance
│   └── loadTest.test.ts
└── setup.ts                  # Configuration Jest
```

## 🔍 **Debug et Développement**

### **Logs de Développement**

**Configuration des logs :**

- Niveau `info` en développement
- Logs structurés avec Fastify
- Logs des requêtes automatiques
- Logs d'erreurs détaillés

### **Debug Node.js**

```bash
# Debug avec Node.js inspector
npm run test:debug

# Debug avec logs détaillés
DEBUG=* npm run dev

# Profiling mémoire
node --inspect --inspect-brk src/server.ts
```

### **Outils de Debug Recommandés**

**Base de données :**

- **Prisma Studio** : Interface graphique
- **pgAdmin** : Administration PostgreSQL
- **VS Code extensions** : Prisma, PostgreSQL

**API Testing :**

- **Thunder Client** (VS Code)
- **Postman** ou **Insomnia**
- **curl** pour tests rapides

## 🚀 **Workflow de Développement**

### **Nouvelle Fonctionnalité**

```bash
# 1. Créer une branche feature
git checkout -b feature/nom-fonctionnalite

# 2. Développer avec tests en parallèle
npm run test:watch  # Terminal 1
npm run dev         # Terminal 2

# 3. Vérifier la qualité avant commit
npm run lint
npm run test
npm run build:check

# 4. Commit et push
git add .
git commit -m "feat: description"
git push origin feature/nom-fonctionnalite
```

### **Correction de Bug**

```bash
# Branche depuis main pour hotfix
git checkout main
git checkout -b hotfix/correction-bug

# Développement avec TDD
npm run test:watch
# ... écrire le test qui échoue
# ... implémenter la correction
# ... vérifier que le test passe

# Push et PR
git push origin hotfix/correction-bug
```

### **Intégration Continue**

**À chaque PR :**

- Tests automatiques (unitaires + intégration)
- Audit de sécurité
- Vérification TypeScript
- Build réussi

**À chaque merge sur main :**

- Déploiement automatique
- Tests post-déploiement
- Health check

## 📊 **Performance et Optimisations**

### **Métriques de Développement**

- **Démarrage** : < 3 secondes
- **Hot reload** : < 1 seconde
- **Tests complets** : < 2 minutes
- **Build** : < 30 secondes

### **Optimisations Prisma**

```typescript
// Requêtes optimisées
const users = await prisma.user.findMany({
  select: { id: true, name: true }, // Sélection spécifique
  take: 10, // Limitation
  include: { friends: true }, // Relations nécessaires uniquement
});
```

### **Optimisations Fastify**

- Routes précompilées
- Validation Zod optimisée
- Serialisation JSON rapide
- Keep-alive connections

## 🔗 **Intégration avec Frontend**

### **APIs Exposées**

```typescript
// Authentification
POST /auth/signin
POST /auth/signup
GET  /auth/session

// Utilisateurs et social
GET  /api/users
GET  /api/friends
POST /api/friends/add

// Jeu et scores
POST /api/scores
GET  /api/scores/history

// WebSocket temps réel
WS   /ws (lobbies, jeu multijoueur)
```

### **CORS Configuration**

```typescript
// Configuration pour développement local
origin: ["http://localhost:5173"]; // Frontend Vite
credentials: true;
```

## 🚀 **Mise en Production**

### **Checklist Pré-Production**

- [ ] Variables d'environnement configurées
- [ ] Migrations appliquées
- [ ] Tests passent en CI
- [ ] Configuration CORS production
- [ ] Secrets sécurisés

### **Monitoring Production**

- Health endpoint `/health`
- Logs Fly.io intégrés
- Métriques de performance
- Alertes automatiques

---

**Besoin d'aide ?**

- 📖 [Documentation API](./docs/API.md)
- 🏗️ [Architecture](./docs/ARCHITECTURE.md)
- 🚀 [Protocole de déploiement](./DEPLOIEMENT.md)
- 🐛 Créer une issue sur GitHub

**Dernière mise à jour** : Janvier 2025  
**Maintenu par** : Équipe Backend MapQuiz
