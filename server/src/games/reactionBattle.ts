import { ReactionBattleState } from '../types/index.js';

export class ReactionBattleGame {
  state: ReactionBattleState;
  private playersList: string[];
  private waitTimeoutId: NodeJS.Timeout | null = null;

  constructor(playerIds: string[], totalRounds: number = 3) {
    this.playersList = [...playerIds];
    this.state = {
      round: 1,
      totalRounds,
      phase: 'WAITING',
      signalType: 'GO',
      signalTriggeredAt: null,
      timeRemaining: 10,
      falseStarters: [],
      reactions: {},
      rankings: [],
    };
  }

  getSignalDelayMs(): number {
    // Random between 2.2s and 6.0s
    return Math.floor(Math.random() * 3800) + 2200;
  }

  triggerSignal(): { signalType: 'GO' | 'STOP'; signalTriggeredAt: number } {
    // 80% chance GO, 20% chance deceptive STOP
    const isStop = Math.random() < 0.22;
    this.state.phase = 'SIGNAL';
    this.state.signalType = isStop ? 'STOP' : 'GO';
    this.state.signalTriggeredAt = Date.now();
    this.state.timeRemaining = 3;
    return {
      signalType: this.state.signalType,
      signalTriggeredAt: this.state.signalTriggeredAt,
    };
  }

  recordTap(
    playerId: string,
    clientReportedTime?: number
  ): {
    status: 'EARLY_PENALTY' | 'STOP_PENALTY' | 'VALID' | 'IGNORED';
    reactionTimeMs?: number;
  } {
    // If player already tapped or disqualified this round, ignore
    if (this.state.falseStarters.includes(playerId) || this.state.reactions[playerId] !== undefined) {
      return { status: 'IGNORED' };
    }

    const now = Date.now();

    // 1. Tapped during WAITING -> False start!
    if (this.state.phase === 'WAITING' || !this.state.signalTriggeredAt) {
      this.state.falseStarters.push(playerId);
      return { status: 'EARLY_PENALTY' };
    }

    // 2. Tapped during RED STOP -> Fooled by fake decoy!
    if (this.state.signalType === 'STOP') {
      this.state.falseStarters.push(playerId);
      return { status: 'STOP_PENALTY' };
    }

    // 3. Valid tap during GREEN GO
    const reactionTimeMs = Math.max(1, now - this.state.signalTriggeredAt);
    this.state.reactions[playerId] = reactionTimeMs;
    return { status: 'VALID', reactionTimeMs };
  }

  allPlayersResponded(): boolean {
    const totalHandled = this.state.falseStarters.length + Object.keys(this.state.reactions).length;
    return totalHandled >= this.playersList.length;
  }

  calculateRoundSummary(playerNicknames: Record<string, string>): {
    scoresGained: Record<string, number>;
  } {
    this.state.phase = 'ROUND_SUMMARY';
    this.state.timeRemaining = 8;

    const scoresGained: Record<string, number> = {};
    this.playersList.forEach((pid) => (scoresGained[pid] = 0));

    // Valid reactions sorted by fastest reaction time
    const validEntries = Object.entries(this.state.reactions).sort((a, b) => a[1] - b[1]);

    const rankings: {
      playerId: string;
      nickname: string;
      timeMs: number | null;
      pointsGained: number;
      status: 'FAST' | 'OK' | 'DISQUALIFIED' | 'MISSED';
    }[] = [];

    validEntries.forEach(([pid, timeMs], index) => {
      let points = 60;
      let status: 'FAST' | 'OK' = 'OK';
      if (index === 0) {
        points = 200;
        status = 'FAST';
      } else if (index === 1) {
        points = 150;
      } else if (index === 2) {
        points = 100;
      }

      scoresGained[pid] = points;
      rankings.push({
        playerId: pid,
        nickname: playerNicknames[pid] || 'Player',
        timeMs,
        pointsGained: points,
        status,
      });
    });

    // Penalize false starters
    this.state.falseStarters.forEach((pid) => {
      scoresGained[pid] = -50;
      rankings.push({
        playerId: pid,
        nickname: playerNicknames[pid] || 'Player',
        timeMs: null,
        pointsGained: -50,
        status: 'DISQUALIFIED',
      });
    });

    // Players who missed the tap entirely
    this.playersList.forEach((pid) => {
      if (!this.state.reactions[pid] && !this.state.falseStarters.includes(pid)) {
        rankings.push({
          playerId: pid,
          nickname: playerNicknames[pid] || 'Player',
          timeMs: null,
          pointsGained: 0,
          status: 'MISSED',
        });
      }
    });

    this.state.rankings = rankings;
    return { scoresGained };
  }

  getPublicState(playerId: string) {
    return {
      round: this.state.round,
      totalRounds: this.state.totalRounds,
      phase: this.state.phase,
      signalType: this.state.phase === 'SIGNAL' ? this.state.signalType : null,
      signalTriggeredAt: this.state.phase === 'SIGNAL' ? this.state.signalTriggeredAt : null,
      timeRemaining: this.state.timeRemaining,
      myReactionTime: this.state.reactions[playerId] || null,
      isDisqualified: this.state.falseStarters.includes(playerId),
      rankings: this.state.phase === 'ROUND_SUMMARY' ? this.state.rankings : undefined,
    };
  }

  nextRound(): { shouldEndGame: boolean } {
    if (this.state.round < this.state.totalRounds) {
      this.state.round += 1;
      this.state.phase = 'WAITING';
      this.state.signalType = 'GO';
      this.state.signalTriggeredAt = null;
      this.state.timeRemaining = 10;
      this.state.falseStarters = [];
      this.state.reactions = {};
      this.state.rankings = [];
      return { shouldEndGame: false };
    } else {
      return { shouldEndGame: true };
    }
  }
}

