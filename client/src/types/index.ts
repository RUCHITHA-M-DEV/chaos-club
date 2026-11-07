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

export interface SecretAgentClientState {
  round: number;
  totalRounds: number;
  phase: 'BRIEFING' | 'ACTIVE' | 'REVIEW' | 'ROUND_SUMMARY';
  timeRemaining: number;
  myMission: SecretMission | null;
  claims: MissionClaim[];
  allMissionsRevealed?: Record<string, SecretMission>;
}

export interface FakeAnswerChoice {
  id: string;
  text: string;
  isMyBluff?: boolean;
  authorNickname?: string;
  isReal?: boolean;
  votes?: string[];
  voteCount?: number;
}

export interface FakeAnswerClientState {
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
  choices: FakeAnswerChoice[];
  hasSubmittedBluff: boolean;
  hasVoted: boolean;
  roundResults?: {
    playerId: string;
    nickname: string;
    pointsGained: number;
    reason: string;
  }[];
}

export interface QuickDrawClientState {
  round: number;
  totalRounds: number;
  drawerId: string;
  drawerNickname: string;
  word: string | null;
  hint: string;
  category: string;
  phase: 'SELECTING' | 'DRAWING' | 'REVEAL';
  timeRemaining: number;
  strokes: DrawStroke[];
  guesses: DrawGuess[];
  correctGuessers: string[];
  hasGuessedCorrectly: boolean;
  isDrawer: boolean;
}

export interface WhoKnowsMeClientState {
  round: number;
  totalRounds: number;
  spotlightPlayerId: string;
  spotlightNickname: string;
  question: string;
  phase: 'ANSWERING' | 'PREDICTING' | 'REVEAL';
  timeRemaining: number;
  spotlightAnswer: string | null;
  myPrediction: string | null;
  submittedPredictionsCount: number;
  hasSubmitted: boolean;
  isSpotlight: boolean;
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
  survivalBonus: number;
}

export interface SurvivalScenario {
  id: string;
  title: string;
  narrative: string;
  options: SurvivalScenarioOption[];
}

export interface SurvivalVoteClientState {
  round: number;
  totalRounds: number;
  scenario: SurvivalScenario;
  phase: 'VOTING' | 'CONSEQUENCE';
  timeRemaining: number;
  myVote: string | null;
  totalVotesCast: number;
  voteCounts?: Record<string, number>;
  winningOption?: SurvivalScenarioOption;
  survivors?: {
    playerId: string;
    nickname: string;
    votedOptionId: string;
    scoreChange: number;
    statusText: string;
  }[];
}

export interface ReactionBattleClientState {
  round: number;
  totalRounds: number;
  phase: 'WAITING' | 'SIGNAL' | 'ROUND_SUMMARY';
  signalType: 'GO' | 'STOP' | null;
  signalTriggeredAt: number | null;
  timeRemaining: number;
  myReactionTime: number | null;
  isDisqualified: boolean;
  rankings?: {
    playerId: string;
    nickname: string;
    timeMs: number | null;
    pointsGained: number;
    status: 'FAST' | 'OK' | 'DISQUALIFIED' | 'MISSED';
  }[];
}

export interface SanitizedRoomState {
  code: string;
  hostId: string;
  status: RoomStatus;
  selectedGame: GameType;
  players: Record<string, Player>;
  maxPlayers: number;
  minPlayers: number;
  leaderboard: Record<string, number>;
  gameSession: {
    type: GameType;
    data: any;
  } | null;
}

