import {
  Room,
  Player,
  GameType,
  RoomStatus,
  DrawStroke,
} from '../types/index.js';
import { SecretAgentGame } from '../games/secretAgent.js';
import { FakeAnswerGame } from '../games/fakeAnswer.js';
import { QuickDrawGame } from '../games/quickDraw.js';
import { WhoKnowsMeGame } from '../games/whoKnowsMe.js';
import { SurvivalVoteGame } from '../games/survivalVote.js';
import { ReactionBattleGame } from '../games/reactionBattle.js';
import { RoomModel, GameSessionModel, GameHistoryModel } from '../models/index.js';
import { isDbConnected } from '../config/db.js';

type ActiveGameInstance =
  | { type: 'SECRET_AGENT'; engine: SecretAgentGame }
  | { type: 'FAKE_ANSWER'; engine: FakeAnswerGame }
  | { type: 'QUICK_DRAW'; engine: QuickDrawGame }
  | { type: 'WHO_KNOWS_ME'; engine: WhoKnowsMeGame }
  | { type: 'SURVIVAL_VOTE'; engine: SurvivalVoteGame }
  | { type: 'REACTION_BATTLE'; engine: ReactionBattleGame };

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private activeGames: Map<string, ActiveGameInstance> = new Map();
  private gameTimers: Map<string, NodeJS.Timeout> = new Map();
  private socketToPlayerMap: Map<string, { roomCode: string; playerId: string }> = new Map();

  constructor() {
    // Periodic cleanup of abandoned rooms every 5 minutes
    setInterval(() => this.cleanupAbandonedRooms(), 5 * 60 * 1000);
  }

  generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(
    hostPlayer: { id: string; nickname: string; avatar: string; color: string },
    socketId: string,
    initialGame: GameType = 'SECRET_AGENT'
  ): { room: Room; player: Player } {
    const code = this.generateRoomCode();
    const player: Player = {
      id: hostPlayer.id,
      socketId,
      nickname: hostPlayer.nickname,
      avatar: hostPlayer.avatar,
      color: hostPlayer.color,
      isHost: true,
      isReady: true,
      isConnected: true,
      score: 0,
      currentRoundScore: 0,
      lastActive: Date.now(),
    };

    const room: Room = {
      code,
      hostId: player.id,
      status: 'LOBBY',
      selectedGame: initialGame,
      players: { [player.id]: player },
      maxPlayers: 10,
      minPlayers: 2,
      gameSession: null,
      sessionLeaderboard: { [player.id]: 0 },
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    this.rooms.set(code, room);
    this.socketToPlayerMap.set(socketId, { roomCode: code, playerId: player.id });

    // Persist to MongoDB if connected
    if (isDbConnected()) {
      RoomModel.create({
        code,
        hostId: player.id,
        status: 'LOBBY',
        selectedGame: initialGame,
        maxPlayers: 10,
      }).catch((err: unknown) => console.error('MongoDB Room Save Error:', err));
    }

    return { room, player };
  }

  joinRoom(
    roomCode: string,
    joinData: { id: string; nickname: string; avatar: string; color: string },
    socketId: string
  ): { success: boolean; error?: string; room?: Room; player?: Player; isReconnect?: boolean } {
    const code = roomCode.toUpperCase().trim();
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false, error: 'Room not found. Check the code!' };
    }

    // Check reconnection
    const existingPlayer = room.players[joinData.id];
    if (existingPlayer) {
      existingPlayer.socketId = socketId;
      existingPlayer.isConnected = true;
      existingPlayer.lastActive = Date.now();
      room.lastActivity = Date.now();
      this.socketToPlayerMap.set(socketId, { roomCode: code, playerId: existingPlayer.id });

      return {
        success: true,
        room,
        player: existingPlayer,
        isReconnect: true,
      };
    }

    // New joiner validation
    if (room.status !== 'LOBBY') {
      return { success: false, error: 'Game is currently in progress in this room!' };
    }

    const currentPlayers = Object.values(room.players).filter((p) => p.isConnected);
    if (currentPlayers.length >= room.maxPlayers) {
      return { success: false, error: 'Room is full (maximum 10 players)!' };
    }

    const player: Player = {
      id: joinData.id,
      socketId,
      nickname: joinData.nickname,
      avatar: joinData.avatar,
      color: joinData.color,
      isHost: false,
      isReady: false,
      isConnected: true,
      score: 0,
      currentRoundScore: 0,
      lastActive: Date.now(),
    };

    room.players[player.id] = player;
    room.sessionLeaderboard[player.id] = 0;
    room.lastActivity = Date.now();
    this.socketToPlayerMap.set(socketId, { roomCode: code, playerId: player.id });

    return { success: true, room, player, isReconnect: false };
  }

  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode.toUpperCase().trim());
  }

  getPlayerBySocket(socketId: string): { room: Room; player: Player } | null {
    const meta = this.socketToPlayerMap.get(socketId);
    if (!meta) return null;
    const room = this.rooms.get(meta.roomCode);
    if (!room) return null;
    const player = room.players[meta.playerId];
    if (!player) return null;
    return { room, player };
  }

  toggleReady(roomCode: string, playerId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    const player = room.players[playerId];
    if (!player) return false;
    player.isReady = !player.isReady;
    room.lastActivity = Date.now();
    return true;
  }

  selectGame(roomCode: string, hostPlayerId: string, gameType: GameType): boolean {
    const room = this.rooms.get(roomCode);
    if (!room || room.hostId !== hostPlayerId || room.status !== 'LOBBY') return false;
    room.selectedGame = gameType;
    room.lastActivity = Date.now();
    return true;
  }

  handleDisconnect(socketId: string): {
    room: Room;
    player: Player;
    hostMigrated: boolean;
    roomEmpty: boolean;
  } | null {
    const meta = this.socketToPlayerMap.get(socketId);
    if (!meta) return null;
    this.socketToPlayerMap.delete(socketId);

    const room = this.rooms.get(meta.roomCode);
    if (!room) return null;

    const player = room.players[meta.playerId];
    if (!player) return null;

    player.isConnected = false;
    player.lastActive = Date.now();
    room.lastActivity = Date.now();

    let hostMigrated = false;
    const activePlayers = Object.values(room.players).filter((p) => p.isConnected);

    // If host disconnected, reassign to next connected player
    if (player.isHost && activePlayers.length > 0) {
      player.isHost = false;
      activePlayers[0].isHost = true;
      room.hostId = activePlayers[0].id;
      hostMigrated = true;
    }

    const roomEmpty = activePlayers.length === 0;
    return { room, player, hostMigrated, roomEmpty };
  }

  leaveRoom(socketId: string): { room: Room; player: Player; roomEmpty: boolean } | null {
    const meta = this.socketToPlayerMap.get(socketId);
    if (!meta) return null;
    this.socketToPlayerMap.delete(socketId);

    const room = this.rooms.get(meta.roomCode);
    if (!room) return null;

    const player = room.players[meta.playerId];
    if (!player) return null;

    delete room.players[meta.playerId];
    delete room.sessionLeaderboard[meta.playerId];
    room.lastActivity = Date.now();

    const activePlayers = Object.values(room.players).filter((p) => p.isConnected);
    if (player.isHost && activePlayers.length > 0) {
      activePlayers[0].isHost = true;
      room.hostId = activePlayers[0].id;
    }

    return { room, player, roomEmpty: Object.keys(room.players).length === 0 };
  }

  // --- GAME SESSION LIFECYCLE ---

  startGame(
    roomCode: string,
    hostPlayerId: string
  ): { success: boolean; error?: string; gameInstance?: ActiveGameInstance } {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room does not exist' };
    if (room.hostId !== hostPlayerId) return { success: false, error: 'Only the room host can start the game!' };

    const connectedPlayers = Object.values(room.players).filter((p) => p.isConnected);
    if (connectedPlayers.length < room.minPlayers) {
      return {
        success: false,
        error: `At least ${room.minPlayers} players are needed to start! (Current: ${connectedPlayers.length})`,
      };
    }

    const playerIds = connectedPlayers.map((p) => p.id);
    const playerNicknames: Record<string, string> = {};
    connectedPlayers.forEach((p) => (playerNicknames[p.id] = p.nickname));

    let instance: ActiveGameInstance;

    switch (room.selectedGame) {
      case 'SECRET_AGENT':
        instance = { type: 'SECRET_AGENT', engine: new SecretAgentGame(playerIds) };
        break;
      case 'FAKE_ANSWER':
        instance = { type: 'FAKE_ANSWER', engine: new FakeAnswerGame(playerIds) };
        break;
      case 'QUICK_DRAW':
        instance = { type: 'QUICK_DRAW', engine: new QuickDrawGame(playerIds, playerNicknames) };
        break;
      case 'WHO_KNOWS_ME':
        instance = { type: 'WHO_KNOWS_ME', engine: new WhoKnowsMeGame(playerIds, playerNicknames) };
        break;
      case 'SURVIVAL_VOTE':
        instance = { type: 'SURVIVAL_VOTE', engine: new SurvivalVoteGame(playerIds) };
        break;
      case 'REACTION_BATTLE':
        instance = { type: 'REACTION_BATTLE', engine: new ReactionBattleGame(playerIds) };
        break;
      default:
        return { success: false, error: 'Invalid game selection' };
    }

    this.activeGames.set(roomCode, instance);
    room.status = 'IN_GAME';
    room.lastActivity = Date.now();

    // Reset round scores
    connectedPlayers.forEach((p) => (p.currentRoundScore = 0));

    return { success: true, gameInstance: instance };
  }

  getActiveGame(roomCode: string): ActiveGameInstance | undefined {
    return this.activeGames.get(roomCode);
  }

  applyScoreUpdates(roomCode: string, scoreMap: Record<string, number>) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    for (const [pid, points] of Object.entries(scoreMap)) {
      if (room.players[pid]) {
        room.players[pid].score = (room.players[pid].score || 0) + points;
        room.players[pid].currentRoundScore = points;
        room.sessionLeaderboard[pid] = room.players[pid].score;
      }
    }
  }

  endGame(roomCode: string): { room: Room; winner: Player | null } {
    const room = this.rooms.get(roomCode);
    if (!room) throw new Error('Room not found');

    room.status = 'GAME_OVER';
    this.activeGames.delete(roomCode);

    // Stop active timer
    const timer = this.gameTimers.get(roomCode);
    if (timer) {
      clearInterval(timer);
      this.gameTimers.delete(roomCode);
    }

    // Determine winner
    const playersArr = Object.values(room.players);
    playersArr.sort((a, b) => b.score - a.score);
    const winner = playersArr.length > 0 ? playersArr[0] : null;

    // Record session history to MongoDB if connected
    if (isDbConnected() && winner) {
      GameHistoryModel.create({
        gameType: room.selectedGame,
        roomCode: room.code,
        playerCount: playersArr.length,
        winnerNickname: winner.nickname,
        winningScore: winner.score,
        durationSeconds: Math.floor((Date.now() - room.createdAt) / 1000),
      }).catch((e: unknown) => console.error('Error saving GameHistory:', e));
    }

    return { room, winner };
  }

  returnToLobby(roomCode: string, hostPlayerId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room || room.hostId !== hostPlayerId) return false;

    room.status = 'LOBBY';
    this.activeGames.delete(roomCode);

    const timer = this.gameTimers.get(roomCode);
    if (timer) {
      clearInterval(timer);
      this.gameTimers.delete(roomCode);
    }

    // Reset ready flags
    Object.values(room.players).forEach((p) => {
      p.isReady = p.isHost;
      p.currentRoundScore = 0;
    });

    return true;
  }

  rematch(roomCode: string, hostPlayerId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room || room.hostId !== hostPlayerId) return false;

    // Reset scores for rematch
    Object.values(room.players).forEach((p) => {
      p.score = 0;
      p.currentRoundScore = 0;
      room.sessionLeaderboard[p.id] = 0;
    });

    return this.returnToLobby(roomCode, hostPlayerId);
  }

  getSanitizedRoomState(roomCode: string, forPlayerId: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const game = this.activeGames.get(roomCode);
    let gameStateData = null;

    if (game) {
      switch (game.type) {
        case 'SECRET_AGENT':
          gameStateData = {
            type: 'SECRET_AGENT',
            data: game.engine.getPrivateStateForPlayer(forPlayerId),
          };
          break;
        case 'FAKE_ANSWER':
          gameStateData = {
            type: 'FAKE_ANSWER',
            data: game.engine.getPublicState(forPlayerId),
          };
          break;
        case 'QUICK_DRAW':
          gameStateData = {
            type: 'QUICK_DRAW',
            data: game.engine.getPublicState(forPlayerId),
          };
          break;
        case 'WHO_KNOWS_ME':
          gameStateData = {
            type: 'WHO_KNOWS_ME',
            data: game.engine.getPublicState(forPlayerId),
          };
          break;
        case 'SURVIVAL_VOTE':
          gameStateData = {
            type: 'SURVIVAL_VOTE',
            data: game.engine.getPublicState(forPlayerId),
          };
          break;
        case 'REACTION_BATTLE':
          gameStateData = {
            type: 'REACTION_BATTLE',
            data: game.engine.getPublicState(forPlayerId),
          };
          break;
      }
    }

    return {
      code: room.code,
      hostId: room.hostId,
      status: room.status,
      selectedGame: room.selectedGame,
      players: room.players,
      maxPlayers: room.maxPlayers,
      minPlayers: room.minPlayers,
      leaderboard: room.sessionLeaderboard,
      gameSession: gameStateData,
    };
  }

  private cleanupAbandonedRooms() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [code, room] of this.rooms.entries()) {
      const activePlayers = Object.values(room.players).filter((p) => p.isConnected);
      if (activePlayers.length === 0 || room.lastActivity < oneHourAgo) {
        this.rooms.delete(code);
        this.activeGames.delete(code);
        const timer = this.gameTimers.get(code);
        if (timer) {
          clearInterval(timer);
          this.gameTimers.delete(code);
        }
      }
    }
  }
}
