import { APP_CONSTANTS } from "../../lib/config.js";
import { LobbyError, NotFoundError } from "../../lib/errors.js";
import { validateLobbyId } from "../../lib/validation.js";
import * as LobbyModel from "../../models/lobbyModel.js";
import * as UserModel from "../../models/userModel.js";
import { LobbyPlayer } from "../../types/index.js";
import { sendToUser } from "../../websocket/core/connectionManager.js";
import * as LobbyManager from "../../websocket/lobby/lobbyManager.js";

/**
 * Service dédié à la gestion des joueurs dans les lobbies
 */
export class LobbyPlayerService {
  /**
   * Invite un ami dans un lobby
   */
  static async inviteToLobby(
    hostId: string,
    lobbyId: string,
    friendId: string
  ) {
    // Vérifier que l'utilisateur est bien l'hôte du lobby
    const lobby = await LobbyModel.getLobby(lobbyId);
    if (!lobby || lobby.hostId !== hostId) {
      throw new LobbyError(APP_CONSTANTS.ERRORS.UNAUTHORIZED);
    }

    // Vérifier si le joueur est déjà dans le lobby
    const existingPlayer = await LobbyModel.getPlayerInLobby(lobbyId, friendId);

    // Si le joueur est déjà dans le lobby, ne pas renvoyer d'invitation
    if (existingPlayer) {
      return { success: true, message: "Joueur déjà dans le lobby" };
    }

    // Envoyer une notification à l'ami (sans l'ajouter au lobby)
    sendToUser(friendId, {
      type: "lobby_invitation",
      payload: {
        lobbyId,
        hostId,
        hostName: lobby.host.name,
        lobbyName: lobby.name,
      },
    });

    return { success: true, message: "Invitation envoyée" };
  }

  /**
   * Rejoint un lobby
   */
  static async joinLobby(userId: string, lobbyId: string) {
    // Vérifier que le lobby existe
    const lobby = await LobbyModel.getLobby(lobbyId);
    if (!lobby) {
      throw new NotFoundError("Lobby");
    }

    // Vérifier si l'utilisateur est déjà dans le lobby
    const existingPlayer = await LobbyModel.getPlayerInLobby(lobbyId, userId);

    // Récupérer les informations de l'utilisateur
    const user = await UserModel.findUserById(userId);
    if (!user) {
      throw new NotFoundError("Utilisateur");
    }

    // Si l'utilisateur n'est pas déjà dans le lobby, l'ajouter
    if (!existingPlayer) {
      await LobbyModel.addPlayerToLobby(
        lobbyId,
        userId,
        APP_CONSTANTS.PLAYER_STATUS.JOINED
      );
    } else {
      // Mettre à jour le statut du joueur dans la base de données
      await LobbyModel.updatePlayerStatus(
        lobbyId,
        userId,
        APP_CONSTANTS.PLAYER_STATUS.JOINED
      );
    }

    // Ajouter ou mettre à jour le joueur dans le lobby en mémoire
    const lobbyInMemory = LobbyManager.getLobbyInMemory(lobbyId);
    if (!lobbyInMemory || !lobbyInMemory.players.has(userId)) {
      // Si le joueur n'est pas dans le Map, l'ajouter
      LobbyManager.addPlayerToLobby(lobbyId, userId, user.name);
      console.log(`Joueur ${userId} ajouté au lobby en mémoire`);
    } else {
      // Si le joueur est déjà dans le Map, mettre à jour son statut
      LobbyManager.updatePlayerStatus(
        lobbyId,
        userId,
        APP_CONSTANTS.PLAYER_STATUS.JOINED
      );
      console.log(`Statut du joueur ${userId} mis à jour en mémoire`);
    }

    // Récupérer les informations complètes du lobby
    const players = await LobbyModel.getLobbyPlayers(lobbyId);

    return {
      success: true,
      message: "Lobby rejoint",
      lobby: {
        id: lobbyId,
        name: lobby?.name,
      },
      hostId: lobby?.hostId,
      players: players.map((p) => ({
        id: p.userId,
        name: p.user.name,
        status: p.status,
      })),
      settings: lobby?.gameSettings,
    };
  }

  /**
   * Quitte un lobby
   */
  static async leaveLobby(userId: string, lobbyId: string) {
    // Supprimer le joueur du lobby dans la base de données
    await LobbyModel.removePlayerFromLobby(lobbyId, userId);

    // Supprimer le joueur du lobby en mémoire
    LobbyManager.removePlayerFromLobby(lobbyId, userId);

    // Si c'était l'hôte, supprimer le lobby
    const lobby = await LobbyModel.getLobby(lobbyId);
    if (lobby && lobby.hostId === userId) {
      await LobbyModel.deleteLobby(lobbyId);
      LobbyManager.removeLobby(lobbyId);
    }

    return { success: true, message: "Lobby quitté" };
  }

  /**
   * Met à jour le statut de préparation d'un joueur
   */
  static async setPlayerReady(userId: string, lobbyId: string, ready: boolean) {
    console.log(
      `setPlayerReady - Début pour userId: ${userId}, lobbyId: ${lobbyId}, ready: ${ready}`
    );

    // Vérifier que le joueur est bien dans le lobby
    const player = await LobbyModel.getPlayerInLobby(lobbyId, userId);
    if (!player) {
      console.log(
        `setPlayerReady - Joueur ${userId} non trouvé dans le lobby ${lobbyId}`
      );
      throw new NotFoundError("Joueur dans le lobby");
    }

    console.log(
      `setPlayerReady - Joueur trouvé avec statut actuel: ${player.status}`
    );

    // Récupérer le lobby pour vérifier si l'utilisateur est l'hôte
    const lobby = await LobbyModel.getLobby(lobbyId);
    const isHost = lobby?.hostId === userId;
    const lobbyPlayers = await this.getLobbyPlayers(lobbyId);

    console.log(
      `setPlayerReady - isHost: ${isHost}, playersCount: ${lobbyPlayers.length}`
    );

    // Mettre à jour le statut du joueur
    const status = ready
      ? APP_CONSTANTS.PLAYER_STATUS.READY
      : APP_CONSTANTS.PLAYER_STATUS.JOINED;

    console.log(
      `setPlayerReady - Mise à jour du statut en BDD vers: ${status}`
    );
    await LobbyModel.updatePlayerStatus(lobbyId, userId, status);
    console.log(`setPlayerReady - Statut mis à jour en BDD`);

    // Mettre à jour le statut du joueur en mémoire
    console.log(
      `setPlayerReady - Mise à jour du statut en mémoire vers: ${status}`
    );
    const memoryUpdate = LobbyManager.updatePlayerStatus(
      lobbyId,
      userId,
      status
    );
    console.log(
      `setPlayerReady - Résultat de la mise à jour en mémoire: ${memoryUpdate}`
    );

    // Vérifier le statut après mise à jour
    const updatedPlayer = await LobbyModel.getPlayerInLobby(lobbyId, userId);
    console.log(
      `setPlayerReady - Statut après mise à jour: ${updatedPlayer?.status}`
    );

    return {
      success: true,
      message: ready ? "Prêt" : "Pas prêt",
    };
  }

  /**
   * Récupère la liste des joueurs d'un lobby
   */
  static async getLobbyPlayers(lobbyId: string): Promise<LobbyPlayer[]> {
    const validatedLobbyId = validateLobbyId(lobbyId);
    const players = await LobbyModel.getLobbyPlayers(validatedLobbyId);

    return players.map((p) => ({
      id: p.userId,
      name: p.user.name,
      status: p.status as LobbyPlayer["status"],
    }));
  }

  /**
   * Vérifie si un joueur est dans un lobby
   */
  static async verifyPlayerInLobby(userId: string, lobbyId: string) {
    console.log(
      `verifyPlayerInLobby - Vérification pour userId: ${userId}, lobbyId: ${lobbyId}`
    );

    const validatedLobbyId = validateLobbyId(lobbyId);
    const player = await LobbyModel.getPlayerInLobby(validatedLobbyId, userId);

    if (!player) {
      console.log(
        `verifyPlayerInLobby - Joueur ${userId} non trouvé dans le lobby ${lobbyId}`
      );

      // Récupérer tous les joueurs du lobby pour debug
      const allPlayers = await LobbyModel.getLobbyPlayers(validatedLobbyId);
      console.log(
        `verifyPlayerInLobby - Joueurs dans le lobby:`,
        allPlayers.map((p) => ({
          id: p.userId,
          name: p.user.name,
          status: p.status,
        }))
      );

      throw new NotFoundError("Joueur dans le lobby");
    }

    console.log(
      `verifyPlayerInLobby - Joueur ${userId} trouvé avec statut: ${player.status}`
    );
    return player;
  }

  /**
   * Vérifie si tous les joueurs sont prêts
   */
  static async areAllPlayersReady(
    lobbyId: string,
    hostId: string
  ): Promise<boolean> {
    console.log(
      `areAllPlayersReady - Vérification pour lobby: ${lobbyId}, host: ${hostId}`
    );

    const players = await this.getLobbyPlayers(lobbyId);
    console.log(
      `areAllPlayersReady - Joueurs récupérés:`,
      players.map((p: any) => ({
        id: p.id,
        name: p.name || "Unknown",
        status: p.status,
      }))
    );

    // Vérifier que tous les joueurs sont prêts
    const allReady = players.every(
      (p) => p.status === APP_CONSTANTS.PLAYER_STATUS.READY
    );
    console.log(
      `areAllPlayersReady - Tous les joueurs sont prêts: ${allReady}`
    );

    return allReady;
  }
}
