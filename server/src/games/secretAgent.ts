import { SecretAgentState, SecretMission, MissionClaim, Player } from '../types/index.js';
import { SEED_MISSIONS } from '../data/seedData.js';
import { v4 as uuidv4 } from 'uuid';

export class SecretAgentGame {
  state: SecretAgentState;
  private playersList: string[];

  constructor(playerIds: string[], totalRounds: number = 2) {
    this.playersList = [...playerIds];
    this.state = {
      round: 1,
      totalRounds,
      phase: 'BRIEFING',
      timeRemaining: 15,
      playerMissions: {},
      claims: [],
    };
    this.assignMissions();
  }

  private assignMissions() {
    const shuffled = [...SEED_MISSIONS].sort(() => 0.5 - Math.random());
    this.state.playerMissions = {};
    this.playersList.forEach((pid, idx) => {
      this.state.playerMissions[pid] = shuffled[idx % shuffled.length];
    });
    this.state.claims = [];
  }

  getPrivateStateForPlayer(playerId: string) {
    // Return game state but ONLY include this player's secret mission
    return {
      round: this.state.round,
      totalRounds: this.state.totalRounds,
      phase: this.state.phase,
      timeRemaining: this.state.timeRemaining,
      myMission: this.state.playerMissions[playerId] || null,
      claims: this.state.claims.map((c) => ({
        id: c.id,
        playerId: c.playerId,
        playerNickname: c.playerNickname,
        missionTitle: c.missionTitle,
        claimedAt: c.claimedAt,
        status: c.status,
        challengedBy: c.challengedBy,
        challengedByNickname: c.challengedByNickname,
      })),
      allMissionsRevealed: this.state.phase === 'ROUND_SUMMARY' ? this.state.playerMissions : undefined,
    };
  }

  claimMission(playerId: string, playerNickname: string): MissionClaim | null {
    if (this.state.phase !== 'ACTIVE') return null;
    const existing = this.state.claims.find((c) => c.playerId === playerId && c.status !== 'DISMISSED');
    if (existing) return null;

    const mission = this.state.playerMissions[playerId];
    if (!mission) return null;

    const claim: MissionClaim = {
      id: uuidv4(),
      playerId,
      playerNickname,
      missionTitle: mission.title,
      claimedAt: Date.now(),
      status: 'PENDING',
    };
    this.state.claims.push(claim);
    return claim;
  }

  challengeClaim(claimId: string, challengerId: string, challengerNickname: string): boolean {
    const claim = this.state.claims.find((c) => c.id === claimId);
    if (!claim || claim.status !== 'PENDING' || claim.playerId === challengerId) {
      return false;
    }
    claim.status = 'CHALLENGED';
    claim.challengedBy = challengerId;
    claim.challengedByNickname = challengerNickname;
    return true;
  }

  resolveClaim(claimId: string, verified: boolean): { claim: MissionClaim; points: number } | null {
    const claim = this.state.claims.find((c) => c.id === claimId);
    if (!claim) return null;

    const mission = this.state.playerMissions[claim.playerId];
    const basePoints = mission ? mission.points : 100;

    if (verified) {
      claim.status = 'VERIFIED';
      return { claim, points: basePoints };
    } else {
      claim.status = 'DISMISSED';
      return { claim, points: 0 };
    }
  }

  nextPhase(): { shouldEndGame: boolean } {
    if (this.state.phase === 'BRIEFING') {
      this.state.phase = 'ACTIVE';
      this.state.timeRemaining = 60; // 60 seconds of chaotic agent missions
      return { shouldEndGame: false };
    } else if (this.state.phase === 'ACTIVE') {
      this.state.phase = 'REVIEW';
      this.state.timeRemaining = 25; // 25 seconds for host/group to review and dispute claims
      return { shouldEndGame: false };
    } else if (this.state.phase === 'REVIEW') {
      this.state.phase = 'ROUND_SUMMARY';
      this.state.timeRemaining = 12;
      return { shouldEndGame: false };
    } else {
      // ROUND_SUMMARY -> next round or end
      if (this.state.round < this.state.totalRounds) {
        this.state.round += 1;
        this.state.phase = 'BRIEFING';
        this.state.timeRemaining = 15;
        this.assignMissions();
        return { shouldEndGame: false };
      } else {
        return { shouldEndGame: true };
      }
    }
  }
}

