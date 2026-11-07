import React, { useState } from 'react';
import { WhoKnowsMeClientState, Player } from '../../types';
import { Timer } from '../common/Timer';
import { Scoreboard } from '../common/Scoreboard';
import { Sparkles, Send, User, Check, Heart, Award, HelpCircle } from 'lucide-react';
import { sound } from '../../services/sound';

interface WhoKnowsMeViewProps {
  state: WhoKnowsMeClientState;
  players: Record<string, Player>;
  currentPlayer: Player;
  onSubmitAnswer: (answer: string) => void;
  onSubmitPrediction: (prediction: string) => void;
}

export const WhoKnowsMeView: React.FC<WhoKnowsMeViewProps> = ({
  state,
  players,
  currentPlayer,
  onSubmitAnswer,
  onSubmitPrediction,
}) => {
  const [inputText, setInputText] = useState('');
  const isSpotlight = state.isSpotlight;
  const spotlightPlayer = players[state.spotlightPlayerId];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sound.playClick();

    if (isSpotlight) {
      onSubmitAnswer(inputText.trim());
    } else {
      onSubmitPrediction(inputText.trim());
    }
    setInputText('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Status Bar */}
      <div className="glass-card rounded-2xl p-4 border border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-xl">
            🔮
          </div>
          <div>
            <div className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">
              Who Knows Me Best? • Round {state.round} of {state.totalRounds}
            </div>
            <div className="text-base sm:text-lg font-black text-white">
              {state.phase === 'ANSWERING'
                ? isSpotlight
                  ? 'YOU ARE IN THE SPOTLIGHT – SUBMIT YOUR ANSWER'
                  : `PREDICT ${state.spotlightNickname.toUpperCase()}'S ANSWER`
                : 'ROUND REVEAL & MATCHES'}
            </div>
          </div>
        </div>
        <Timer seconds={state.timeRemaining} totalSeconds={30} label="Time" size="md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Stage (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Spotlight Hero Card */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-amber-500/30 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shadow-lg bg-surfaceLight"
                style={{ border: `2px solid ${spotlightPlayer?.color || '#F59E0B'}` }}
              >
                {spotlightPlayer?.avatar || '🌟'}
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 block">
                  SPOTLIGHT PLAYER
                </span>
                <span className="text-xl font-black text-white">
                  {state.spotlightNickname} {isSpotlight && '(YOU!)'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface/80 border border-amber-500/20">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Prompt:
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                &quot;{state.question}&quot;
              </h3>
            </div>
          </div>

          {/* PHASE 1: SUBMISSION FORM */}
          {state.phase === 'ANSWERING' && (
            <div className="glass-card rounded-3xl p-6 border border-amber-500/20">
              {state.hasSubmitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-xl">
                    ✓
                  </div>
                  <h4 className="text-lg font-bold text-white">
                    {isSpotlight ? 'Spotlight Answer Locked In!' : 'Prediction Submitted!'}
                  </h4>
                  <p className="text-xs text-gray-400">
                    Waiting for everyone to submit their predictions...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                      {isSpotlight
                        ? 'Your Actual Honest Answer'
                        : `What do you predict ${state.spotlightNickname} answered?`}
                    </label>
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={
                        isSpotlight ? 'Type your real truth...' : 'Type your prediction...'
                      }
                      maxLength={70}
                      autoFocus
                      required
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-amber-500/30 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-white font-medium text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSpotlight ? 'SUBMIT CONFESSION' : 'LOCK IN PREDICTION'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* PHASE 2: REVEAL & MATCHES */}
          {state.phase === 'REVEAL' && (
            <div className="space-y-4">
              {/* Spotlight Real Answer Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 shadow-lg">
                <div className="text-xs uppercase font-extrabold text-amber-300 tracking-wider mb-1 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                  <span>{state.spotlightNickname}&apos;s Real Answer:</span>
                </div>
                <div className="text-2xl font-black text-white">{state.spotlightAnswer}</div>
              </div>

              {/* Predictions Comparison Cards */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                  Friend Predictions & Match Results:
                </div>

                {state.matches.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border text-sm flex items-center justify-between ${
                      m.isCorrect
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-surface/80 border-purple-500/15 text-gray-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        <span>{m.nickname}</span>
                        {m.isCorrect && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            MATCH!
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Predicted: &quot;{m.prediction}&quot;
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-black text-sm ${
                          m.isCorrect ? 'text-emerald-400' : 'text-gray-500'
                        }`}
                      >
                        +{m.points}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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

