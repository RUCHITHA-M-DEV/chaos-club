export type GameType =
  | 'SECRET_AGENT'
  | 'FAKE_ANSWER'
  | 'QUICK_DRAW'
  | 'WHO_KNOWS_ME'
  | 'SURVIVAL_VOTE'
  | 'REACTION_BATTLE';

export type RoomStatus = 'LOBBY' | 'IN_GAME' | 'ROUND_END' | 'GAME_OVER';

export interface Player {
  id: string;
  socketId: string;
  nickname: string;
  avatar: string;
  color: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  score: number;
  currentRoundScore: number;
  lastActive: number;
}

export interface DrawStroke {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  size: number;
  isEraser: boolean;
}

export interface DrawGuess {
  playerId: string;
  nickname: string;
  text: string;
  isCorrect: boolean;
  isClose: boolean;
  timestamp: number;
}

export interface SecretMission {
  id: string;
  title: string;
  description: string;
  targetHint?: string;
  points: number;
}

export interface MissionClaim {
  id: string;
  playerId: string;
  playerNickname: string;
  missionTitle: string;
  claimedAt: number;
  status: 'PENDING' | 'VERIFIED' | 'CHALLENGED' | 'DISMISSED';
  challengedBy?: string;
  challengedByNickname?: string;
}

export interface SecretAgentState {
  round: number;
  totalRounds: number;
  phase: 'BRIEFING' | 'ACTIVE' | 'REVIEW' | 'ROUND_SUMMARY';
  timeRemaining: number;
  playerMissions: Record<string, SecretMission>; // Only sent privately or revealed at end!
  claims: MissionClaim[];
}

export interface FakeAnswerChoice {
  id: string;
  text: string;
  authorId: string | null; // null = real answer
  authorNickname?: string;
  votes: string[]; // playerIds
}

export interface FakeAnswerState {
  round: number;
  totalRounds: number;
  phase: 'WRITING' | 'VOTING' | 'REVEAL';
  timeRemaining: number;
  question: {
    id: string;
    category: string;
    question: string;
    realAnswer: string;
  };
  submittedBluffs: Record<string, string>; // playerId -> text
  choices: FakeAnswerChoice[];
  roundResults?: {
    playerId: string;
    nickname: string;
    pointsGained: number;
    reason: string;
  }[];
}

export interface QuickDrawState {
  round: number;
  totalRounds: number;
  drawerId: string;
  drawerNickname: string;
  word: string; // Private to drawer
  hint: string; // Public (e.g. "_ _ _ _ _")
  category: string;
  phase: 'SELECTING' | 'DRAWING' | 'REVEAL';
  timeRemaining: number;
  strokes: DrawStroke[];
  guesses: DrawGuess[];
  correctGuessers: string[]; // playerIds in order of speed
}

export interface WhoKnowsMeState {
  round: number;
  totalRounds: number;
  spotlightPlayerId: string;
  spotlightNickname: string;
  question: string;
  phase: 'ANSWERING' | 'PREDICTING' | 'REVEAL';
  timeRemaining: number;
  spotlightAnswer: string | null;
  predictions: Record<string, string>; // playerId -> predicted answer
  matches: {
    playerId: string;
    nickname: string;
    prediction: string;
    isCorrect: boolean;
    points: number;
  }[];
}

export interface SurvivalScenarioOption {
  id: string;
  text: string;
  consequence: string;
  survivalBonus: number; // e.g. +10, -5
}

export interface SurvivalScenario {
  id: string;
  title: string;
  narrative: string;
  options: SurvivalScenarioOption[];
}

export interface SurvivalVoteState {
  round: number;
  totalRounds: number;
  scenario: SurvivalScenario;
  phase: 'VOTING' | 'CONSEQUENCE';
  timeRemaining: number;
  votes: Record<string, string>; // playerId -> optionId
  voteCounts: Record<string, number>; // optionId -> count
  winningOption?: SurvivalScenarioOption;
  survivors: {
    playerId: string;
    nickname: string;
    votedOptionId: string;
    scoreChange: number;
    statusText: string;
  }[];
}

export interface ReactionBattleState {
  round: number;
  totalRounds: number;
  phase: 'WAITING' | 'SIGNAL' | 'ROUND_SUMMARY';
  signalType: 'GO' | 'STOP';
  signalTriggeredAt: number | null;
  timeRemaining: number;
  falseStarters: string[]; // playerIds
  reactions: Record<string, number>; // playerId -> reactionTimeMs
  rankings: {
    playerId: string;
    nickname: string;
    timeMs: number | null; // null if false start or timeout
    pointsGained: number;
    status: 'FAST' | 'OK' | 'DISQUALIFIED' | 'MISSED';
  }[];
}

export type ActiveGameState =
  | { type: 'SECRET_AGENT'; data: SecretAgentState }
  | { type: 'FAKE_ANSWER'; data: FakeAnswerState }
  | { type: 'QUICK_DRAW'; data: QuickDrawState }
  | { type: 'WHO_KNOWS_ME'; data: WhoKnowsMeState }
  | { type: 'SURVIVAL_VOTE'; data: SurvivalVoteState }
  | { type: 'REACTION_BATTLE'; data: ReactionBattleState };

export interface Room {
  code: string;
  hostId: string;
  status: RoomStatus;
  selectedGame: GameType;
  players: Record<string, Player>;
  maxPlayers: number;
  minPlayers: number;
  gameSession: ActiveGameState | null;
  sessionLeaderboard: Record<string, number>; // playerId -> cumulative score
  createdAt: number;
  lastActivity: number;
}

