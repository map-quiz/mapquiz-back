# MapQuiz Backend API

> 🚀 **Documentation Complète** : Consultez [DEVELOPPEMENT.md](./DEVELOPPEMENT.md) pour le guide d'installation et [DEPLOIEMENT.md](./DEPLOIEMENT.md) pour le protocole de déploiement.

## 🎯 **Vue d'Ensemble**

API backend pour l'application MapQuiz, construite avec Fastify, TypeScript et Prisma. Gère l'authentification, le jeu multijoueur en temps réel, et toute la logique métier.

## 🛠️ **Stack Technique**

- **Runtime** : Node.js 22+ avec TypeScript
- **Framework** : Fastify (haute performance)
- **Base de données** : PostgreSQL + Prisma ORM
- **Authentication** : Better Auth + Google OAuth
- **WebSockets** : Support temps réel intégré
- **Tests** : Jest + Supertest
- **Sécurité** : Helmet, CORS, Rate Limiting

## ⚡ **Démarrage Rapide**

### **Installation**

```bash
cd backend
npm install
```

### **Configuration**

```bash
# Copier le template de configuration
cp env.example .env
# Éditer .env avec vos valeurs
```

### **Base de Données**

```bash
# Démarrer PostgreSQL (Docker)
npm run test:docker:start

# Appliquer les migrations
npm run db:push && npm run db:generate
```

### **Démarrage**

```bash
# Mode développement avec hot-reload
npm run dev

# Tests avec couverture
npm run test:coverage
```

**🌐 Serveur disponible** : http://localhost:3000

## 🏗️ **Architecture API**

### **Endpoints Principaux**

**Authentication**

- `GET/POST /auth/*` - Gestion authentification Better Auth
- `GET /auth/callback/google` - Callback OAuth Google

**Users & Social**

- `GET /api/users` - Liste des utilisateurs
- `GET /api/friends` - Système d'amis complet
- `POST /api/friends/add` - Ajouter un ami

**Game Logic**

- `POST /api/scores` - Sauvegarde des scores
- `GET /api/scores/history` - Historique des parties

**Lobbies & Multiplayer**

- WebSocket `/ws` - Communication temps réel
- Gestion complète des lobbies multijoueur

**Health & Monitoring**

- `GET /health` - Status API + base de données

### **WebSocket Events**

- `lobby:join` - Rejoindre un lobby
- `lobby:leave` - Quitter un lobby
- `game:progress` - Progression de partie
- `player:status` - Status des joueurs

## 🗄️ **Base de Données**

**Modèles Prisma :**

- `User` - Utilisateurs et authentification
- `Session` - Sessions utilisateur
- `Account` - Comptes OAuth
- `Friendship` - Relations d'amitié
- `GameScore` - Scores et historique
- `Lobby` - Lobbies multijoueur
- `LobbyPlayer` - Joueurs dans les lobbies

## 📋 **Scripts de Développement**

```bash
# Développement
npm run dev                 # Mode développement avec watch
npm run build:check         # Vérification TypeScript

# Base de données
npm run db:generate         # Générer client Prisma
npm run db:push            # Synchroniser schéma
npm run db:studio          # Interface graphique

# Tests
npm run test               # Suite complète
npm run test:unit          # Tests unitaires
npm run test:integration   # Tests d'intégration
npm run test:performance   # Tests de performance
npm run test:coverage      # Avec couverture

# Docker (tests)
npm run test:docker:start  # Démarrer PostgreSQL
npm run test:docker:stop   # Arrêter PostgreSQL

# Production
npm run build              # Build optimisé
npm start                 # Démarrage production
```

## 🔒 **Sécurité & Performance**

**Sécurité :**

- Rate limiting adaptatif
- Headers sécurisés (Helmet)
- CORS configuré
- Validation des données (Zod)

**Performance :**

- Fastify haute performance
- Connexions WebSocket optimisées
- Requêtes DB optimisées avec Prisma
- Logs structurés

## 🧪 **Tests**

**Couverture :** > 80% requise  
**Types :** Unitaires, intégration, performance  
**Environnement :** PostgreSQL Docker isolé  
**CI/CD :** Tests automatiques sur chaque PR

## 📁 **Structure du Code**

```
src/
├── controllers/        # Logique des routes
├── services/          # Logique métier
├── models/           # Modèles Prisma
├── routes/           # Définition des routes
├── lib/              # Utilitaires
├── middleware/       # Middlewares Fastify
├── websocket/        # Gestion WebSocket
└── types/           # Types TypeScript
```

**🔗 Liens utiles :**

- [Guide développement complet](./DEVELOPPEMENT.md)
- [Protocole de déploiement](./DEPLOIEMENT.md)
- [Schema Prisma](./prisma/schema.prisma)
- [Frontend MapQuiz](https://github.com/map-quiz/mapquiz-front)
