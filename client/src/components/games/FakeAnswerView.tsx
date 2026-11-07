import React, { useState } from 'react';
import { FakeAnswerClientState, Player } from '../../types';
import { Timer } from '../common/Timer';
import { Scoreboard } from '../common/Scoreboard';
import { HelpCircle, Send, CheckCircle2, Award, Sparkles, Laugh } from 'lucide-react';
import { sound } from '../../services/sound';

interface FakeAnswerViewProps {
  state: FakeAnswerClientState;
  players: Record<string, Player>;
  currentPlayer: Player;
  onSubmitBluff: (text: string) => void;
  onSubmitVote: (choiceId: string) => void;
}

export const FakeAnswerView: React.FC<FakeAnswerViewProps> = ({
  state,
  players,
  currentPlayer,
  onSubmitBluff,
  onSubmitVote,
}) => {
  const [bluffInput, setBluffInput] = useState('');
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  const handleBluffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bluffInput.trim()) return;
    sound.playClick();
    onSubmitBluff(bluffInput.trim());
  };

  const handleChoiceVote = (choiceId: string) => {
    sound.playClick();
    setSelectedChoiceId(choiceId);
    onSubmitVote(choiceId);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Status Bar */}
      <div className="glass-card rounded-2xl p-4 border border-pink-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-600/20 border border-pink-500/40 flex items-center justify-center text-xl">
            🎭
          </div>
          <div>
            <div className="text-xs uppercase font-extrabold text-pink-400 tracking-wider">
              Fake Answer • Round {state.round} of {state.totalRounds}
            </div>
            <div className="text-base sm:text-lg font-black text-white">
              {state.phase === 'WRITING'
                ? 'WRITE A BELIEVABLE FAKE ANSWER'
                : state.phase === 'VOTING'
                ? 'WHICH ONE IS THE REAL TRUTH?'
                : 'ROUND REVEAL & RESULTS'}
            </div>
          </div>
        </div>
        <Timer seconds={state.timeRemaining} totalSeconds={35} label="Time" size="md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Stage (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Question Card */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-purple-500/30 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-pink-400 uppercase tracking-widest mb-2">
              <HelpCircle className="w-4 h-4" />
              <span>{state.question.category}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
              &quot;{state.question.question}&quot;
            </h3>
          </div>

          {/* PHASE 1: WRITING BLUFF */}
          {state.phase === 'WRITING' && (
            <div className="glass-card rounded-3xl p-6 border border-pink-500/25">
              {state.hasSubmittedBluff ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-xl">
                    ✓
                  </div>
                  <h4 className="text-lg font-bold text-white">Bluff Submitted!</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Waiting for the other players to finish inventing their fake answers...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBluffSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                      Your Believable Fake Answer
                    </label>
                    <input
                      type="text"
                      value={bluffInput}
                      onChange={(e) => setBluffInput(e.target.value)}
                      placeholder="Invent something sneaky that sounds real..."
                      maxLength={80}
                      autoFocus
                      required
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-pink-500/30 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 text-white font-medium text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-pink-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>SUBMIT BLUFF</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* PHASE 2: VOTING CHOICES */}
          {state.phase === 'VOTING' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                Select the answer you believe is the real fact:
              </div>
              <div className="grid grid-cols-1 gap-3">
                {state.choices.map((choice) => {
                  const isSelected = selectedChoiceId === choice.id;
                  const isMyBluff = choice.isMyBluff;

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={isMyBluff || state.hasVoted}
                      onClick={() => handleChoiceVote(choice.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isMyBluff
                          ? 'bg-surface/40 border-gray-700/50 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-pink-900/40 border-2 border-pink-400 shadow-lg shadow-pink-500/20 scale-[1.01]'
                          : 'glass-card hover:border-pink-500/40 active:scale-[0.99]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm sm:text-base text-gray-100">
                          {choice.text}
                        </span>
                        {isMyBluff && (
                          <span className="text-[10px] uppercase font-bold text-pink-400 px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20">
                            Your Bluff
                          </span>
                        )}
                        {isSelected && <span className="text-pink-400 font-bold text-sm">✓ Selected</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PHASE 3: REVEAL */}
          {state.phase === 'REVEAL' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40">
                <div className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider mb-1">
                  Correct Real Answer:
                </div>
                <div className="text-lg font-black text-white">{state.question.realAnswer}</div>
              </div>

              {/* Reveal Choice Breakdown */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                  How Everyone Voted:
                </div>
                {state.choices.map((c) => {
                  return (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-2xl border text-sm flex items-center justify-between ${
                        c.isReal
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                          : 'bg-surface/80 border-purple-500/15 text-gray-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{c.text}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {c.isReal ? (
                            <strong className="text-emerald-400">The Real Answer!</strong>
                          ) : (
                            <span>
                              Written by <strong className="text-pink-400">{c.authorNickname}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                          {c.voteCount || 0} Votes
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Round Points Summary */}
              {state.roundResults && state.roundResults.length > 0 && (
                <div className="glass-card rounded-2xl p-4 border border-purple-500/20 space-y-2">
                  <div className="text-xs font-bold text-gray-400 uppercase">Round Score Highlights:</div>
                  {state.roundResults.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-200">
                        {r.nickname}: <span className="text-gray-400">{r.reason}</span>
                      </span>
                      <span className="font-black text-emerald-400">+{r.pointsGained}</span>
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

