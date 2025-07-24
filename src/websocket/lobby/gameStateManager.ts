// SUPPRESSION TOTALE DE LA LOGIQUE COUNTRIES
// Ce fichier ne gère plus rien concernant les pays.

// Type pour les données de progression d'un joueur
export type PlayerProgress = {
  validatedCountries: string[];
  incorrectCountries: string[];
  score: number;
  progress: number;
  status: string;
  name: string;
  lastAnswerTime?: number;
  consecutiveCorrect?: number;
};

/**
 * Gestionnaire de l'état du jeu
 */
export class GameStateManager {
  /**
   * Vérifie si un joueur a terminé la partie
   */
  static checkGameCompletion(
    playerProgress: PlayerProgress,
    totalQuestions: number
  ): boolean {
    return playerProgress.progress >= totalQuestions;
  }

  /**
   * Calcule les classements des joueurs
   */
  static calculateRankings(players: Map<string, PlayerProgress>): any[] {
    const playerArray = Array.from(players.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      score: data.score,
      progress: data.progress,
      status: data.status,
    }));

    // Trier par score décroissant, puis par progression décroissante
    const sortedPlayers = playerArray.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.progress - a.progress;
    });

    // Ajouter le rang à chaque joueur
    return sortedPlayers.map((player, index) => ({
      ...player,
      rank: index + 1, // Rang basé sur la position dans le tableau trié
      completionTime: null, // Pour l'instant, on n'a pas le temps de completion
    }));
  }

  /**
   * Fonction utilitaire pour mélanger un tableau
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
}
