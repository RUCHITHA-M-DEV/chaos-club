import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Flag,
  Award,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { SecretAgentClientState, Player } from '../../types';
import { Timer } from '../common/Timer';
import { Scoreboard } from '../common/Scoreboard';
import { sound } from '../../services/sound';

interface SecretAgentViewProps {
  state: SecretAgentClientState;
  players: Record<string, Player>;
  currentPlayer: Player;
  onClaimMission: () => void;
  onChallengeClaim: (claimId: string) => void;
  onResolveClaim: (claimId: string, verified: boolean) => void;
}

export const SecretAgentView: React.FC<SecretAgentViewProps> = ({
  state,
  players,
  currentPlayer,
  onClaimMission,
  onChallengeClaim,
  onResolveClaim,
}) => {
  const [revealed, setRevealed] = useState(false);
  const myMission = state.myMission;
  const isHost = currentPlayer.isHost;

  const hasClaimed = state.claims.some((c) => c.playerId === currentPlayer.id);

  const getPhaseTitle = () => {
    switch (state.phase) {
      case 'BRIEFING':
        return 'MISSION BRIEFING';
      case 'ACTIVE':
        return 'AGENTS ACTIVE – COMPLETE YOUR MISSION';
      case 'REVIEW':
        return 'DISPUTE & VERIFICATION PHASE';
      case 'ROUND_SUMMARY':
        return 'ROUND SUMMARY';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Status Bar */}
      <div className="glass-card rounded-2xl p-4 border border-purple-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-xl">
            🕵️‍♂️
          </div>
          <div>
            <div className="text-xs uppercase font-extrabold text-purple-400 tracking-wider">
              Secret Agent • Round {state.round} of {state.totalRounds}
            </div>
            <div className="text-base sm:text-lg font-black text-white">{getPhaseTitle()}</div>
          </div>
        </div>
        <Timer seconds={state.timeRemaining} totalSeconds={60} label="Time" size="md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Agent Area (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Private Secret Mission Card */}
          <div className="glass-card rounded-3xl p-6 border-2 border-purple-500/40 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black tracking-widest text-pink-400 uppercase flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-pink-400" />
                TOP SECRET MISSION DOSSIER
              </span>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setRevealed(!revealed);
                }}
                className="px-3 py-1 rounded-xl bg-surfaceLight border border-purple-500/30 text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1.5"
              >
                {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{revealed ? 'Hide Mission' : 'Tap to Reveal'}</span>
              </button>
            </div>

            {myMission ? (
              <div
                onClick={() => setRevealed(!revealed)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer select-none ${
                  revealed
                    ? 'bg-gradient-to-br from-purple-900/40 via-surface to-pink-900/30 border-purple-400/60'
                    : 'bg-surface/80 border-purple-500/20 hover:border-purple-500/40 text-center py-10'
                }`}
              >
                {revealed ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-white">{myMission.title}</h3>
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                        +{myMission.points} PTS
                      </span>
                    </div>
                    <p className="text-base text-gray-200 font-medium leading-relaxed">
                      {myMission.description}
                    </p>
                    {myMission.targetHint && (
                      <div className="p-3 rounded-xl bg-surface/80 border border-purple-500/20 text-xs text-purple-300">
                        <strong>Tactical Advice:</strong> {myMission.targetHint}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl mb-2">🔒</div>
                    <div className="text-sm font-bold text-gray-300">
                      MISSION CLASSIFIED – TAP TO REVEAL
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Keep your screen hidden from friends!</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">Assigning your secret mission...</div>
            )}

            {/* Claim Mission Button */}
            {state.phase === 'ACTIVE' && (
              <div className="mt-5">
                <button
                  onClick={() => {
                    sound.playCorrect();
                    onClaimMission();
                  }}
                  disabled={hasClaimed}
                  className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-xl transition-all ${
                    hasClaimed
                      ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 cursor-default'
                      : 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-purple-500/25 active:scale-95'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>{hasClaimed ? 'MISSION CLAIMED! AWAITING REVIEW' : 'I COMPLETED MY MISSION!'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Live Claims & Dispute Stream */}
          <div className="glass-card rounded-3xl p-5 border border-purple-500/20">
            <h4 className="font-extrabold text-sm text-white mb-3 flex items-center gap-2">
              <Flag className="w-4 h-4 text-purple-400" />
              <span>Live Mission Claims ({state.claims.length})</span>
            </h4>

            {state.claims.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500 rounded-2xl bg-surface/40">
                No agents have claimed mission completion yet. Complete your objective subtly!
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {state.claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-3.5 rounded-2xl bg-surface/80 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{claim.playerNickname}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            claim.status === 'VERIFIED'
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                              : claim.status === 'CHALLENGED'
                              ? 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                              : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                          }`}
                        >
                          {claim.status}
                        </span>
                      </div>
                      <div className="text-xs text-purple-300 mt-0.5">
                        Claimed: &quot;{claim.missionTitle}&quot;
                      </div>
                      {claim.challengedByNickname && (
                        <div className="text-[10px] text-rose-400">
                          Challenged by {claim.challengedByNickname}!
                        </div>
                      )}
                    </div>

                    {/* Actions: Challenge or Host Verify */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {claim.status === 'PENDING' && claim.playerId !== currentPlayer.id && (
                        <button
                          onClick={() => {
                            sound.playWrong();
                            onChallengeClaim(claim.id);
                          }}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-900/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 transition-colors"
                        >
                          Challenge!
                        </button>
                      )}

                      {isHost && (claim.status === 'PENDING' || claim.status === 'CHALLENGED') && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              sound.playCorrect();
                              onResolveClaim(claim.id, true);
                            }}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-700/50 hover:bg-emerald-600 text-white"
                          >
                            Verify ✓
                          </button>
                          <button
                            onClick={() => {
                              sound.playWrong();
                              onResolveClaim(claim.id, false);
                            }}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200"
                          >
                            Reject ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scoreboard (5 cols) */}
        <div className="lg:col-span-5">
          <Scoreboard players={players} currentPlayerId={currentPlayer.id} />
        </div>
      </div>
    </div>
  );
};

