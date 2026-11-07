import mongoose, { Schema, Document } from 'mongoose';

// 1. Player Model
export interface IPlayerDoc extends Document {
  playerId: string;
  nickname: string;
  avatar: string;
  color: string;
  totalGamesPlayed: number;
  totalWins: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayerDoc>(
  {
    playerId: { type: String, required: true, unique: true, index: true },
    nickname: { type: String, required: true },
    avatar: { type: String, required: true },
    color: { type: String, required: true },
    totalGamesPlayed: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const PlayerModel = mongoose.model<IPlayerDoc>('Player', PlayerSchema);

// 2. Room Model
export interface IRoomDoc extends Document {
  code: string;
  hostId: string;
  status: string;
  selectedGame: string;
  maxPlayers: number;
  createdAt: Date;
}

const RoomSchema = new Schema<IRoomDoc>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    hostId: { type: String, required: true },
    status: { type: String, default: 'LOBBY' },
    selectedGame: { type: String, default: 'SECRET_AGENT' },
    maxPlayers: { type: Number, default: 10 },
  },
  { timestamps: true }
);

export const RoomModel = mongoose.model<IRoomDoc>('Room', RoomSchema);

// 3. GameSession Model
export interface IGameSessionDoc extends Document {
  roomCode: string;
  gameType: string;
  roundCount: number;
  players: {
    playerId: string;
    nickname: string;
    score: number;
  }[];
  winnerId?: string;
  startedAt: Date;
  endedAt?: Date;
}

const GameSessionSchema = new Schema<IGameSessionDoc>(
  {
    roomCode: { type: String, required: true, index: true },
    gameType: { type: String, required: true },
    roundCount: { type: Number, default: 1 },
    players: [
      {
        playerId: { type: String, required: true },
        nickname: { type: String, required: true },
        score: { type: Number, default: 0 },
      },
    ],
    winnerId: { type: String },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

export const GameSessionModel = mongoose.model<IGameSessionDoc>('GameSession', GameSessionSchema);

// 4. GameHistory Model
export interface IGameHistoryDoc extends Document {
  gameType: string;
  roomCode: string;
  playerCount: number;
  winnerNickname: string;
  winningScore: number;
  durationSeconds: number;
  createdAt: Date;
}

const GameHistorySchema = new Schema<IGameHistoryDoc>(
  {
    gameType: { type: String, required: true, index: true },
    roomCode: { type: String, required: true },
    playerCount: { type: Number, required: true },
    winnerNickname: { type: String, required: true },
    winningScore: { type: Number, required: true },
    durationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const GameHistoryModel = mongoose.model<IGameHistoryDoc>('GameHistory', GameHistorySchema);

// 5. Question Model (for Fake Answer & Who Knows Me)
export interface IQuestionDoc extends Document {
  category: string;
  question: string;
  realAnswer: string;
  type: 'TRIVIA' | 'PERSONAL';
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestionDoc>(
  {
    category: { type: String, required: true, index: true },
    question: { type: String, required: true },
    realAnswer: { type: String, required: true },
    type: { type: String, enum: ['TRIVIA', 'PERSONAL'], default: 'TRIVIA' },
  },
  { timestamps: true }
);

export const QuestionModel = mongoose.model<IQuestionDoc>('Question', QuestionSchema);

// 6. Mission Model (for Secret Agent)
export interface IMissionDoc extends Document {
  title: string;
  description: string;
  points: number;
  difficulty: 'EASY' | 'MEDIUM' | 'CHAOS';
  createdAt: Date;
}

const MissionSchema = new Schema<IMissionDoc>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    points: { type: Number, default: 100 },
    difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'CHAOS'], default: 'MEDIUM' },
  },
  { timestamps: true }
);

export const MissionModel = mongoose.model<IMissionDoc>('Mission', MissionSchema);

// 7. SurvivalScenario Model (for Survival Vote)
export interface ISurvivalScenarioDoc extends Document {
  title: string;
  narrative: string;
  options: {
    id: string;
    text: string;
    consequence: string;
    survivalBonus: number;
  }[];
  createdAt: Date;
}

const SurvivalScenarioSchema = new Schema<ISurvivalScenarioDoc>(
  {
    title: { type: String, required: true },
    narrative: { type: String, required: true },
    options: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
        consequence: { type: String, required: true },
        survivalBonus: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

export const SurvivalScenarioModel = mongoose.model<ISurvivalScenarioDoc>(
  'SurvivalScenario',
  SurvivalScenarioSchema
);

