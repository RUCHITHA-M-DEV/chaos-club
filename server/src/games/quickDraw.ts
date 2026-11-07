import { QuickDrawState, DrawStroke, DrawGuess, QuickDrawWordItem } from '../types/index.js';
import { SEED_QUICK_DRAW_WORDS } from '../data/seedData.js';

export class QuickDrawGame {
  state: QuickDrawState;
  private playersList: string[];
  private currentDrawerIndex: number = 0;
  private usedWords: Set<string> = new Set();

  constructor(playerIds: string[], playerNicknames: Record<string, string>, totalRounds?: number) {
    this.playersList = [...playerIds];
    const rounds = totalRounds || 3;
    this.currentDrawerIndex = 0;
    const choices = this.pickThreeWords();
    const fallbackWord = choices[0];

    const drawerId = this.playersList[this.currentDrawerIndex];
    this.state = {
      round: 1,
      totalRounds: rounds,
      drawerId,
      drawerNickname: playerNicknames[drawerId] || 'Drawer',
      word: fallbackWord.word,
      hint: fallbackWord.hint,
      category: fallbackWord.category,
      difficulty: fallbackWord.difficulty,
      phase: 'SELECTING',
      timeRemaining: 15,
      wordChoices: choices,
      strokes: [],
      guesses: [],
      correctGuessers: [],
    };
  }

  private pickThreeWords(): QuickDrawWordItem[] {
    const easyWords = SEED_QUICK_DRAW_WORDS.filter((w) => w.difficulty === 'Easy');
    const mediumWords = SEED_QUICK_DRAW_WORDS.filter((w) => w.difficulty === 'Medium');
    const hardWords = SEED_QUICK_DRAW_WORDS.filter((w) => w.difficulty === 'Hard');

    const pickOne = (pool: QuickDrawWordItem[]): QuickDrawWordItem => {
      const unused = pool.filter((w) => !this.usedWords.has(w.word));
      const candidates = unused.length > 0 ? unused : pool;
      return candidates[Math.floor(Math.random() * candidates.length)];
    };

    const easy = pickOne(easyWords);
    const med = pickOne(mediumWords);
    const hard = pickOne(hardWords);

    return [easy, med, hard];
  }

  selectWord(wordToSelect: string): boolean {
    if (this.state.phase !== 'SELECTING') return false;
    const found = this.state.wordChoices.find(
      (w) => w.word.toLowerCase() === wordToSelect.toLowerCase().trim()
    );
    if (!found) return false;

    this.state.word = found.word;
    this.state.hint = found.hint;
    this.state.category = found.category;
    this.state.difficulty = found.difficulty;
    this.state.phase = 'DRAWING';
    this.state.timeRemaining = 60;
    this.usedWords.add(found.word);
    return true;
  }

  autoSelectFallbackWord(): void {
    if (this.state.phase !== 'SELECTING') return;
    const fallback = this.state.wordChoices[1] || this.state.wordChoices[0];
    this.selectWord(fallback.word);
  }

  addStroke(stroke: DrawStroke) {
    this.state.strokes.push(stroke);
  }

  undoLastStroke(): boolean {
    if (this.state.strokes.length === 0) return false;
    const lastStroke = this.state.strokes[this.state.strokes.length - 1];
    if (lastStroke.strokeId) {
      const idToUndo = lastStroke.strokeId;
      while (
        this.state.strokes.length > 0 &&
        this.state.strokes[this.state.strokes.length - 1].strokeId === idToUndo
      ) {
        this.state.strokes.pop();
      }
    } else {
      this.state.strokes.pop();
    }
    return true;
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
      word: isDrawer || isReveal ? this.state.word : null, // Secret word kept private until reveal
      hint: this.state.phase === 'SELECTING' ? 'Choosing a word...' : this.state.hint,
      category: this.state.phase === 'SELECTING' ? 'Secret Category' : this.state.category,
      difficulty: this.state.difficulty,
      phase: this.state.phase,
      timeRemaining: this.state.timeRemaining,
      wordChoices: isDrawer && this.state.phase === 'SELECTING' ? this.state.wordChoices : null,
      strokes: this.state.strokes,
      guesses: this.state.guesses,
      correctGuessers: this.state.correctGuessers,
      hasGuessedCorrectly: this.state.correctGuessers.includes(playerId),
      isDrawer,
    };
  }

  revealPhase() {
    this.state.phase = 'REVEAL';
    this.state.timeRemaining = 8;
  }

  nextRound(playerNicknames: Record<string, string>): { shouldEndGame: boolean } {
    if (this.state.round < this.state.totalRounds) {
      this.state.round += 1;
      this.currentDrawerIndex = (this.currentDrawerIndex + 1) % this.playersList.length;
      const nextDrawerId = this.playersList[this.currentDrawerIndex];
      const newChoices = this.pickThreeWords();
      const fallback = newChoices[0];

      this.state.drawerId = nextDrawerId;
      this.state.drawerNickname = playerNicknames[nextDrawerId] || 'Drawer';
      this.state.word = fallback.word;
      this.state.hint = fallback.hint;
      this.state.category = fallback.category;
      this.state.difficulty = fallback.difficulty;
      this.state.phase = 'SELECTING';
      this.state.timeRemaining = 15;
      this.state.wordChoices = newChoices;
      this.state.strokes = [];
      this.state.guesses = [];
      this.state.correctGuessers = [];

      return { shouldEndGame: false };
    } else {
      return { shouldEndGame: true };
    }
  }
}
