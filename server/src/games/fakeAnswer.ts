import { FakeAnswerState, FakeAnswerChoice, Player } from '../types/index.js';
import { SEED_TRIVIA } from '../data/seedData.js';
import { v4 as uuidv4 } from 'uuid';

export class FakeAnswerGame {
  state: FakeAnswerState;
  private usedQuestionIds: Set<string> = new Set();
  private playersList: string[];

  constructor(playerIds: string[], totalRounds: number = 3) {
    this.playersList = [...playerIds];
    const initialQuestion = this.pickQuestion();
    this.state = {
      round: 1,
      totalRounds,
      phase: 'WRITING',
      timeRemaining: 35,
      question: initialQuestion,
      submittedBluffs: {},
      choices: [],
      roundResults: [],
    };
  }

  private pickQuestion() {
    const available = SEED_TRIVIA.filter((q) => !this.usedQuestionIds.has(q.id));
    const pool = available.length > 0 ? available : SEED_TRIVIA;
    const q = pool[Math.floor(Math.random() * pool.length)];
    this.usedQuestionIds.add(q.id);
    return q;
  }

  submitBluff(playerId: string, bluffText: string): boolean {
    if (this.state.phase !== 'WRITING') return false;
    const clean = bluffText.trim();
    if (!clean) return false;
    this.state.submittedBluffs[playerId] = clean;
    return true;
  }

  allBluffsSubmitted(): boolean {
    return this.playersList.every((pid) => !!this.state.submittedBluffs[pid]);
  }

  prepareVotingPhase(playerNicknames: Record<string, string>) {
    this.state.phase = 'VOTING';
    this.state.timeRemaining = 25;

    const rawChoices: FakeAnswerChoice[] = [
      {
        id: uuidv4(),
        text: this.state.question.realAnswer,
        authorId: null, // null means real answer!
        votes: [],
      },
    ];

    for (const [pid, bluff] of Object.entries(this.state.submittedBluffs)) {
      rawChoices.push({
        id: uuidv4(),
        text: bluff,
        authorId: pid,
        authorNickname: playerNicknames[pid] || 'Player',
        votes: [],
      });
    }

    // Shuffle choices
    this.state.choices = rawChoices.sort(() => 0.5 - Math.random());
  }

  submitVote(voterId: string, choiceId: string): boolean {
    if (this.state.phase !== 'VOTING') return false;
    const choice = this.state.choices.find((c) => c.id === choiceId);
    if (!choice) return false;

    // Prevent voting for own bluff
    if (choice.authorId === voterId) return false;

    // Remove any previous vote from this player
    for (const c of this.state.choices) {
      c.votes = c.votes.filter((id) => id !== voterId);
    }

    choice.votes.push(voterId);
    return true;
  }

  allVotesSubmitted(): boolean {
    const totalVotes = this.state.choices.reduce((sum, c) => sum + c.votes.length, 0);
    return totalVotes >= this.playersList.length;
  }

  calculateRevealResults(playerNicknames: Record<string, string>): {
    scoresGained: Record<string, number>;
  } {
    this.state.phase = 'REVEAL';
    this.state.timeRemaining = 15;

    const scoresGained: Record<string, number> = {};
    const results: { playerId: string; nickname: string; pointsGained: number; reason: string }[] = [];

    this.playersList.forEach((pid) => {
      scoresGained[pid] = 0;
    });

    const realChoice = this.state.choices.find((c) => c.authorId === null);
    if (realChoice) {
      realChoice.votes.forEach((voterId) => {
        scoresGained[voterId] = (scoresGained[voterId] || 0) + 100;
        results.push({
          playerId: voterId,
          nickname: playerNicknames[voterId] || 'Player',
          pointsGained: 100,
          reason: 'Identified the real answer! (+100)',
        });
      });
    }

    // Bonus for fooling other players
    for (const choice of this.state.choices) {
      if (choice.authorId && choice.votes.length > 0) {
        const fooledPoints = choice.votes.length * 60;
        scoresGained[choice.authorId] = (scoresGained[choice.authorId] || 0) + fooledPoints;
        results.push({
          playerId: choice.authorId,
          nickname: playerNicknames[choice.authorId] || 'Player',
          pointsGained: fooledPoints,
          reason: `Tricked ${choice.votes.length} player(s) with their bluff! (+${fooledPoints})`,
        });
      }
    }

    this.state.roundResults = results;
    return { scoresGained };
  }

  getPublicState(playerId?: string) {
    // When in WRITING phase, hide the real answer from clients!
    const sanitizedQuestion = {
      id: this.state.question.id,
      category: this.state.question.category,
      question: this.state.question.question,
      realAnswer: this.state.phase === 'REVEAL' ? this.state.question.realAnswer : '???',
    };

    // When in VOTING phase, hide the authors of choices to prevent cheating!
    const sanitizedChoices = this.state.choices.map((c) => ({
      id: c.id,
      text: c.text,
      isMyBluff: playerId ? c.authorId === playerId : false,
      authorNickname: this.state.phase === 'REVEAL' ? c.authorNickname : undefined,
      isReal: this.state.phase === 'REVEAL' ? c.authorId === null : undefined,
      votes: this.state.phase === 'REVEAL' ? c.votes : undefined,
      voteCount: this.state.phase === 'REVEAL' ? c.votes.length : undefined,
    }));

    return {
      round: this.state.round,
      totalRounds: this.state.totalRounds,
      phase: this.state.phase,
      timeRemaining: this.state.timeRemaining,
      question: sanitizedQuestion,
      choices: sanitizedChoices,
      hasSubmittedBluff: playerId ? !!this.state.submittedBluffs[playerId] : false,
      hasVoted: playerId ? this.state.choices.some((c) => c.votes.includes(playerId)) : false,
      roundResults: this.state.phase === 'REVEAL' ? this.state.roundResults : undefined,
    };
  }

  nextRound(): { shouldEndGame: boolean } {
    if (this.state.round < this.state.totalRounds) {
      this.state.round += 1;
      this.state.phase = 'WRITING';
      this.state.timeRemaining = 35;
      this.state.question = this.pickQuestion();
      this.state.submittedBluffs = {};
      this.state.choices = [];
      this.state.roundResults = [];
      return { shouldEndGame: false };
    } else {
      return { shouldEndGame: true };
    }
  }
}

