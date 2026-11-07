import React, { useState } from 'react';
import { SurvivalVoteClientState, Player } from '../../types';
import { Timer } from '../common/Timer';
import { Scoreboard } from '../common/Scoreboard';
import { ShieldAlert, Vote, Flame, Award, Skull, HeartHandshake } from 'lucide-react';
import { sound } from '../../services/sound';

interface SurvivalVoteViewProps {
  state: SurvivalVoteClientState;
  players: Record<string, Player>;
  currentPlayer: Player;
  onSubmitVote: (optionId: string) => void;
}

export const SurvivalVoteView: React.FC<SurvivalVoteViewProps> = ({
  state,
  players,
  currentPlayer,
  onSubmitVote,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(state.myVote);

  const handleVote = (optId: string) => {
    sound.playClick();
    setSelectedOptionId(optId);
    onSubmitVote(optId);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Status Bar */}
      <div className="glass-card rounded-2xl p-4 border border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-xl">
            🏝️
          </div>
          <div>
            <div className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
              Survival Vote • Round {state.round} of {state.totalRounds}
            </div>
            <div className="text-base sm:text-lg font-black text-white">
              {state.phase === 'VOTING'
                ? 'CRISIS DILEMMA – VOTE TO SURVIVE'
                : 'SURVIVAL CONSEQUENCES REVEAL'}
            </div>
          </div>
        </div>
        <Timer seconds={state.timeRemaining} totalSeconds={30} label="Time" size="md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Stage (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Scenario Card */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>EMERGENCY SCENARIO</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
              {state.scenario.title}
            </h3>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-medium">
              {state.scenario.narrative}
            </p>
          </div>

          {/* PHASE 1: VOTING OPTIONS */}
          {state.phase === 'VOTING' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                Choose your group survival plan:
              </div>
              <div className="grid grid-cols-1 gap-3">
                {state.scenario.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id || state.myVote === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleVote(opt.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-950/60 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-[1.01]'
                          : 'glass-card hover:border-emerald-500/40 active:scale-[0.99]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm sm:text-base text-gray-100">
                          {opt.text}
                        </span>
                        {isSelected && (
                          <span className="text-emerald-400 font-bold text-sm shrink-0 ml-2">
                            ✓ Your Choice
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {state.myVote && (
                <div className="p-3 text-center text-xs text-gray-400 rounded-xl bg-surface/60">
                  Vote locked in! You can change it anytime before the countdown reaches 0.
                </div>
              )}
            </div>
          )}

          {/* PHASE 2: CONSEQUENCES REVEAL */}
          {state.phase === 'CONSEQUENCE' && (
            <div className="space-y-4">
              {/* Winning Choice & Story Consequence */}
              {state.winningOption && (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-surface to-teal-950/80 border-2 border-emerald-500/50 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-black tracking-wider text-emerald-400">
                      GROUP DECISION OUTCOME
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      {state.voteCounts?.[state.winningOption.id] || 0} Votes Cast
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white">&quot;{state.winningOption.text}&quot;</h4>

                  <div className="p-3.5 rounded-2xl bg-surface/90 border border-emerald-500/20 text-sm text-gray-200 leading-relaxed">
                    <strong>Consequence: </strong>
                    {state.winningOption.consequence}
                  </div>
                </div>
              )}

              {/* Individual Survivor Status */}
              {state.survivors && state.survivors.length > 0 && (
                <div className="glass-card rounded-2xl p-4 border border-purple-500/20 space-y-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Survivor Tally:
                  </div>
                  {state.survivors.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-surface/70 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {s.statusText === 'SURVIVED' ? (
                          <span className="text-emerald-400 font-bold">🛡️ {s.nickname}</span>
                        ) : (
                          <span className="text-rose-400 font-bold">🩹 {s.nickname}</span>
                        )}
                        <span className="text-gray-400">({s.statusText})</span>
                      </div>
                      <span
                        className={`font-black ${
                          s.scoreChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {s.scoreChange >= 0 ? `+${s.scoreChange}` : s.scoreChange} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Scoreboard (5 cols) */}
        <div className="lg:col-span-5">
          <Scoreboard players={players} currentPlayerId={currentPlayer.id} />
        </div>
      </div>
    </div>
  );
};

