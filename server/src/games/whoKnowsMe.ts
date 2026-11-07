import { WhoKnowsMeState } from '../types/index.js';
import { SEED_WHO_KNOWS_QUESTIONS } from '../data/seedData.js';

export class WhoKnowsMeGame {
  state: WhoKnowsMeState;
  private playersList: string[];
  private currentSpotlightIndex: number = 0;
  private usedQuestions: Set<string> = new Set();

  constructor(playerIds: string[], playerNicknames: Record<string, string>, totalRounds?: number) {
    this.playersList = [...playerIds];
    const rounds = totalRounds || Math.max(playerIds.length, 3);
    this.currentSpotlightIndex = 0;
    const spotlightId = this.playersList[this.currentSpotlightIndex];
    const question = this.pickQuestion();

    this.state = {
      round: 1,
      totalRounds: rounds,
      spotlightPlayerId: spotlightId,
      spotlightNickname: playerNicknames[spotlightId] || 'Spotlight',
      question,
      phase: 'ANSWERING',
      timeRemaining: 30,
      spotlightAnswer: null,
      predictions: {},
      matches: [],
    };
  }

  private pickQuestion(): string {
    const available = SEED_WHO_KNOWS_QUESTIONS.filter((q) => !this.usedQuestions.has(q));
    const pool = available.length > 0 ? available : SEED_WHO_KNOWS_QUESTIONS;
    const q = pool[Math.floor(Math.random() * pool.length)];
    this.usedQuestions.add(q);
    return q;
  }

  submitSpotlightAnswer(playerId: string, answer: string): boolean {
    if (playerId !== this.state.spotlightPlayerId) return false;
    const clean = answer.trim();
    if (!clean) return false;
    this.state.spotlightAnswer = clean;
    return true;
  }

  submitPrediction(playerId: string, prediction: string): boolean {
    if (playerId === this.state.spotlightPlayerId) return false;
    const clean = prediction.trim();
    if (!clean) return false;
    this.state.predictions[playerId] = clean;
    return true;
  }

  allSubmitted(): boolean {
    if (!this.state.spotlightAnswer) return false;
    const guessers = this.playersList.filter((p) => p !== this.state.spotlightPlayerId);
    return guessers.every((g) => !!this.state.predictions[g]);
  }

  calculateReveal(playerNicknames: Record<string, string>): {
    scoresGained: Record<string, number>;
  } {
    this.state.phase = 'REVEAL';
    this.state.timeRemaining = 15;

    const scoresGained: Record<string, number> = {};
    this.playersList.forEach((pid) => (scoresGained[pid] = 0));

    const realAnswerLower = (this.state.spotlightAnswer || '').toLowerCase().trim();
    const realWords = realAnswerLower.split(/\s+/).filter((w) => w.length > 2);

    const matches: {
      playerId: string;
      nickname: string;
      prediction: string;
      isCorrect: boolean;
      points: number;
    }[] = [];

    let correctMatchesCount = 0;

    for (const [pid, pred] of Object.entries(this.state.predictions)) {
      const predLower = pred.toLowerCase().trim();
      // Exact match or significant keyword overlap
      let isMatch = predLower === realAnswerLower;
      if (!isMatch && realWords.length > 0) {
        isMatch = realWords.some((rw) => predLower.includes(rw)) || predLower.includes(realAnswerLower);
      }

      const points = isMatch ? 120 : 0;
      if (isMatch) {
        correctMatchesCount++;
        scoresGained[pid] = (scoresGained[pid] || 0) + points;
      }

      matches.push({
        playerId: pid,
        nickname: playerNicknames[pid] || 'Player',
        prediction: pred,
        isCorrect: isMatch,
        points,
      });
    }

    // Spotlight bonus for being well-known
    if (correctMatchesCount > 0) {
      const spotlightBonus = correctMatchesCount * 40;
      scoresGained[this.state.spotlightPlayerId] =
        (scoresGained[this.state.spotlightPlayerId] || 0) + spotlightBonus;
    }

    this.state.matches = matches;
    return { scoresGained };
  }

  getPublicState(playerId: string) {
    const isSpotlight = playerId === this.state.spotlightPlayerId;
    const isReveal = this.state.phase === 'REVEAL';

    return {
      round: this.state.round,
      totalRounds: this.state.totalRounds,
      spotlightPlayerId: this.state.spotlightPlayerId,
      spotlightNickname: this.state.spotlightNickname,
      question: this.state.question,
      phase: this.state.phase,
      timeRemaining: this.state.timeRemaining,
      spotlightAnswer: isReveal ? this.state.spotlightAnswer : isSpotlight ? this.state.spotlightAnswer : null,
      myPrediction: this.state.predictions[playerId] || null,
      submittedPredictionsCount: Object.keys(this.state.predictions).length,
      hasSubmitted: isSpotlight ? !!this.state.spotlightAnswer : !!this.state.predictions[playerId],
      isSpotlight,
      matches: isReveal ? this.state.matches : [],
    };
  }

  nextRound(playerNicknames: Record<string, string>): { shouldEndGame: boolean } {
    if (this.state.round < this.state.totalRounds) {
      this.state.round += 1;
      this.currentSpotlightIndex = (this.currentSpotlightIndex + 1) % this.playersList.length;
      const nextSpotlightId = this.playersList[this.currentSpotlightIndex];

      this.state.spotlightPlayerId = nextSpotlightId;
      this.state.spotlightNickname = playerNicknames[nextSpotlightId] || 'Spotlight';
      this.state.question = this.pickQuestion();
      this.state.phase = 'ANSWERING';
      this.state.timeRemaining = 30;
      this.state.spotlightAnswer = null;
      this.state.predictions = {};
      this.state.matches = [];

      return { shouldEndGame: false };
    } else {
      return { shouldEndGame: true };
    }
  }
}

