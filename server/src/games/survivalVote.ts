import {
  SurvivalVoteState,
  SurvivalScenario,
  SurvivalScenarioOption,
  Player,
} from '../types/index.js';
import { SEED_SURVIVAL_SCENARIOS } from '../data/seedData.js';

export class SurvivalVoteGame {
  state: SurvivalVoteState;
  private playersList: string[];
  private usedScenarios: Set<string> = new Set();

  constructor(playerIds: string[], totalRounds: number = 3) {
    this.playersList = [...playerIds];
    const initialScenario = this.pickScenario();

    this.state = {
      round: 1,
      totalRounds,
      scenario: initialScenario,
      phase: 'VOTING',
      timeRemaining: 30,
      votes: {},
      voteCounts: {},
      survivors: [],
    };
  }

  private pickScenario(): SurvivalScenario {
    const available = SEED_SURVIVAL_SCENARIOS.filter((s) => !this.usedScenarios.has(s.id));
    const pool = available.length > 0 ? available : SEED_SURVIVAL_SCENARIOS;
    const item = pool[Math.floor(Math.random() * pool.length)];
    this.usedScenarios.add(item.id);
    return item;
  }

  submitVote(playerId: string, optionId: string): boolean {
    if (this.state.phase !== 'VOTING') return false;
    const option = this.state.scenario.options.find((o) => o.id === optionId);
    if (!option) return false;

    this.state.votes[playerId] = optionId;
    return true;
  }

  allVoted(): boolean {
    return this.playersList.every((p) => !!this.state.votes[p]);
  }

  calculateConsequences(playerNicknames: Record<string, string>): {
    scoresGained: Record<string, number>;
  } {
    this.state.phase = 'CONSEQUENCE';
    this.state.timeRemaining = 15;

    const scoresGained: Record<string, number> = {};
    const voteCounts: Record<string, number> = {};

    // Tally votes
    for (const opt of this.state.scenario.options) {
      voteCounts[opt.id] = 0;
    }
    for (const optId of Object.values(this.state.votes)) {
      voteCounts[optId] = (voteCounts[optId] || 0) + 1;
    }
    this.state.voteCounts = voteCounts;

    // Find winning option (majority)
    let maxVotes = -1;
    let winningOpt: SurvivalScenarioOption = this.state.scenario.options[0];
    for (const opt of this.state.scenario.options) {
      if ((voteCounts[opt.id] || 0) > maxVotes) {
        maxVotes = voteCounts[opt.id] || 0;
        winningOpt = opt;
      }
    }
    this.state.winningOption = winningOpt;

    // Evaluate each survivor
    const survivors: {
      playerId: string;
      nickname: string;
      votedOptionId: string;
      scoreChange: number;
      statusText: string;
    }[] = [];

    for (const pid of this.playersList) {
      const votedOptId = this.state.votes[pid];
      const opt = this.state.scenario.options.find((o) => o.id === votedOptId) || winningOpt;
      const scoreChange = opt.survivalBonus * 10;
      scoresGained[pid] = scoreChange;

      survivors.push({
        playerId: pid,
        nickname: playerNicknames[pid] || 'Player',
        votedOptionId: opt.id,
        scoreChange,
        statusText: scoreChange > 0 ? 'SURVIVED' : 'INJURED',
      });
    }

    this.state.survivors = survivors;
    return { scoresGained };
  }

  getPublicState(playerId: string) {
    return {
      round: this.state.round,
      totalRounds: this.state.totalRounds,
      scenario: this.state.scenario,
      phase: this.state.phase,
      timeRemaining: this.state.timeRemaining,
      myVote: this.state.votes[playerId] || null,
      totalVotesCast: Object.keys(this.state.votes).length,
      voteCounts: this.state.phase === 'CONSEQUENCE' ? this.state.voteCounts : undefined,
      winningOption: this.state.phase === 'CONSEQUENCE' ? this.state.winningOption : undefined,
      survivors: this.state.phase === 'CONSEQUENCE' ? this.state.survivors : undefined,
    };
  }

  nextRound(): { shouldEndGame: boolean } {
    if (this.state.round < this.state.totalRounds) {
      this.state.round += 1;
      this.state.scenario = this.pickScenario();
      this.state.phase = 'VOTING';
      this.state.timeRemaining = 30;
      this.state.votes = {};
      this.state.voteCounts = {};
      this.state.winningOption = undefined;
      this.state.survivors = [];
      return { shouldEndGame: false };
    } else {
      return { shouldEndGame: true };
    }
  }
}

