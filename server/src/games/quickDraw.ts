import { QuickDrawState, DrawStroke, DrawGuess } from '../types/index.js';
import { SEED_QUICK_DRAW_WORDS } from '../data/seedData.js';

export class QuickDrawGame {
  state: QuickDrawState;
  private playersList: string[];
  private currentDrawerIndex: number = 0;
  private usedWords: Set<string> = new Set();

  constructor(playerIds: string[], playerNicknames: Record<string, string>, totalRounds?: number) {
    this.playersList = [...playerIds];
    const rounds = totalRounds || Math.max(playerIds.length, 3);
    this.currentDrawerIndex = 0;
    const initialWordObj = this.pickWord();

    const drawerId = this.playersList[this.currentDrawerIndex];
    this.state = {
      round: 1,
      totalRounds: rounds,
      drawerId,
      drawerNickname: playerNicknames[drawerId] || 'Drawer',
      word: initialWordObj.word,
      hint: initialWordObj.hint,
      category: initialWordObj.category,
      phase: 'DRAWING',
      timeRemaining: 60,
      strokes: [],
      guesses: [],
      correctGuessers: [],
    };
  }

  private pickWord() {
    const available = SEED_QUICK_DRAW_WORDS.filter((w) => !this.usedWords.has(w.word));
    const pool = available.length > 0 ? available : SEED_QUICK_DRAW_WORDS;
    const item = pool[Math.floor(Math.random() * pool.length)];
    this.usedWords.add(item.word);
    return item;
  }

  addStroke(stroke: DrawStroke) {
    this.state.strokes.push(stroke);
  }

  clearCanvas() {
    this.state.strokes = [];
  }

  private isClose(guess: string, word: string): boolean {
    const g = guess.toLowerCase().trim();
    const w = word.toLowerCase().trim();
    if (g === w) return false;
    if (Math.abs(g.length - w.length) > 2) return false;

    // Levenshtein distance check
    let diff = 0;
    const minLen = Math.min(g.length, w.length);
    for (let i = 0; i < minLen; i++) {
      if (g[i] !== w[i]) diff++;
    }
    diff += Math.abs(g.length - w.length);
    return diff <= 2;
  }

  processGuess(
    playerId: string,
    nickname: string,
    text: string
  ): {
    guess: DrawGuess;
    isCorrect: boolean;
    isClose: boolean;
    pointsAwarded?: { playerId: string; points: number };
    drawerBonus?: { drawerId: string; points: number };
    allGuessed: boolean;
  } {
    const cleanGuess = text.trim();
    const cleanWord = this.state.word.trim().toLowerCase();
    const isDrawer = playerId === this.state.drawerId;
    const alreadyCorrect = this.state.correctGuessers.includes(playerId);

    if (isDrawer || alreadyCorrect || this.state.phase !== 'DRAWING') {
      const publicGuess: DrawGuess = {
        playerId,
        nickname,
        text: cleanGuess,
        isCorrect: false,
        isClose: false,
        timestamp: Date.now(),
      };
      this.state.guesses.push(publicGuess);
      return { guess: publicGuess, isCorrect: false, isClose: false, allGuessed: false };
    }

    const matches = cleanGuess.toLowerCase() === cleanWord;
    const close = !matches && this.isClose(cleanGuess, cleanWord);

    if (matches) {
      this.state.correctGuessers.push(playerId);
      const guessOrder = this.state.correctGuessers.length;
      let points = 150;
      if (guessOrder === 1) points = 200;
      else if (guessOrder === 2) points = 160;
      else if (guessOrder === 3) points = 130;
      else points = 100;

      const guessObj: DrawGuess = {
        playerId,
        nickname,
        text: '🎉 Guessed the word correctly!',
        isCorrect: true,
        isClose: false,
        timestamp: Date.now(),
      };
      this.state.guesses.push(guessObj);

      // Drawer gets 40 points per correct guesser
      const drawerBonus = { drawerId: this.state.drawerId, points: 40 };

      // Check if all non-drawers have guessed correctly
      const nonDrawers = this.playersList.filter((p) => p !== this.state.drawerId);
      const allGuessed = this.state.correctGuessers.length >= nonDrawers.length;

      return {
        guess: guessObj,
        isCorrect: true,
        isClose: false,
        pointsAwarded: { playerId, points },
        drawerBonus,
        allGuessed,
      };
    }

    const regularGuess: DrawGuess = {
      playerId,
      nickname,
      text: cleanGuess,
      isCorrect: false,
      isClose: close,
      timestamp: Date.now(),
    };
    this.state.guesses.push(regularGuess);

    return {
      guess: regularGuess,
      isCorrect: false,
      isClose: close,
      allGuessed: false,
    };
  }

  getPublicState(playerId: string) {
    const isDrawer = playerId === this.state.drawerId;
    const isReveal = this.state.phase === 'REVEAL';

    return {
      round: this.state.round,
      totalRounds: this.state.totalRounds,
      drawerId: this.state.drawerId,
      drawerNickname: this.state.drawerNickname,
      word: isDrawer || isReveal ? this.state.word : null, // Secret word kept private until reveal!
      hint: this.state.hint,
      category: this.state.category,
      phase: this.state.phase,
      timeRemaining: this.state.timeRemaining,
      strokes: this.state.strokes,
      guesses: this.state.guesses,
      correctGuessers: this.state.correctGuessers,
      hasGuessedCorrectly: this.state.correctGuessers.includes(playerId),
      isDrawer,
    };
  }

  revealPhase() {
    this.state.phase = 'REVEAL';
    this.state.timeRemaining = 10;
  }

  nextRound(playerNicknames: Record<string, string>): { shouldEndGame: boolean } {
    if (this.state.round < this.state.totalRounds) {
      this.state.round += 1;
      this.currentDrawerIndex = (this.currentDrawerIndex + 1) % this.playersList.length;
      const nextDrawerId = this.playersList[this.currentDrawerIndex];
      const newWordObj = this.pickWord();

      this.state.drawerId = nextDrawerId;
      this.state.drawerNickname = playerNicknames[nextDrawerId] || 'Drawer';
      this.state.word = newWordObj.word;
      this.state.hint = newWordObj.hint;
      this.state.category = newWordObj.category;
      this.state.phase = 'DRAWING';
      this.state.timeRemaining = 60;
      this.state.strokes = [];
      this.state.guesses = [];
      this.state.correctGuessers = [];

      return { shouldEndGame: false };
    } else {
      return { shouldEndGame: true };
    }
  }
}

