import React, { useEffect, useState } from 'react';
import { ReactionBattleClientState, Player } from '../../types';
import { Timer } from '../common/Timer';
import { Scoreboard } from '../common/Scoreboard';
import { Zap, AlertOctagon, Trophy, Flame, ShieldAlert, Award } from 'lucide-react';
import { sound } from '../../services/sound';

interface ReactionBattleViewProps {
  state: ReactionBattleClientState;
  players: Record<string, Player>;
  currentPlayer: Player;
  onTapReaction: () => void;
}

export const ReactionBattleView: React.FC<ReactionBattleViewProps> = ({
  state,
  players,
  currentPlayer,
  onTapReaction,
}) => {
  const [tappedLocally, setTappedLocally] = useState(false);

  // Play sound when signal triggers
  useEffect(() => {
    if (state.phase === 'SIGNAL') {
      if (state.signalType === 'GO') {
        sound.playGo();
      } else if (state.signalType === 'STOP') {
        sound.playStop();
      }
    } else if (state.phase === 'WAITING') {
      setTappedLocally(false);
    }
  }, [state.phase, state.signalType]);

  const handleTap = () => {
    if (tappedLocally || state.isDisqualified) return;
    setTappedLocally(true);
    if (state.phase === 'WAITING') {
      sound.playWrong();
    } else if (state.phase === 'SIGNAL' && state.signalType === 'STOP') {
      sound.playWrong();
    } else {
      sound.playClick();
    }
    onTapReaction();
  };

  const getArenaStyle = () => {
    if (state.isDisqualified) {
      return 'bg-rose-950/80 border-rose-500 shadow-2xl shadow-rose-500/30';
    }
    if (state.phase === 'SIGNAL') {
      if (state.signalType === 'GO') {
        return 'bg-emerald-600 border-emerald-400 text-white shadow-2xl shadow-emerald-500/50 scale-[1.02]';
      }
      if (state.signalType === 'STOP') {
        return 'bg-rose-700 border-rose-400 text-white shadow-2xl shadow-rose-500/50 animate-pulse';
      }
    }
    return 'bg-surfaceLight/60 border-purple-500/30 hover:border-purple-500/50';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Status Bar */}
      <div className="glass-card rounded-2xl p-4 border border-red-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-xl">
            ⚡
          </div>
          <div>
            <div className="text-xs uppercase font-extrabold text-red-400 tracking-wider">
              Reaction Battle • Round {state.round} of {state.totalRounds}
            </div>
            <div className="text-base sm:text-lg font-black text-white">
              {state.phase === 'WAITING'
                ? 'WAIT FOR SIGNAL... DO NOT TAP EARLY'
                : state.phase === 'SIGNAL'
                ? state.signalType === 'GO'
                  ? '⚡ TAP NOW! GO! GO! ⚡'
                  : '🛑 STOP! DO NOT TAP! 🛑'
                : 'ROUND RESULTS'}
            </div>
          </div>
        </div>
        <Timer seconds={state.timeRemaining} totalSeconds={10} label="Time" size="md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reaction Battle Arena (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Big Interactive Tap Zone */}
          <div
            onClick={handleTap}
            onTouchStart={(e) => {
              e.preventDefault();
              handleTap();
            }}
            className={`w-full h-80 sm:h-96 rounded-3xl border-4 transition-all duration-150 flex flex-col items-center justify-center text-center p-6 cursor-pointer select-none relative overflow-hidden ${getArenaStyle()}`}
          >
            {state.isDisqualified ? (
              <div className="space-y-3">
                <AlertOctagon className="w-16 h-16 text-rose-400 mx-auto animate-bounce" />
                <h3 className="text-2xl sm:text-3xl font-black text-rose-200">
                  DISQUALIFIED FOR THIS ROUND!
                </h3>
                <p className="text-xs sm:text-sm text-rose-300 max-w-xs mx-auto">
                  Tapped before GO or tapped on the RED STOP trap! (-50 pts penalty)
                </p>
              </div>
            ) : state.myReactionTime ? (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                  YOUR REACTION TIME
                </div>
                <div className="text-5xl sm:text-6xl font-mono font-black text-white">
                  {state.myReactionTime} <span className="text-2xl">ms</span>
                </div>
                <div className="text-xs text-gray-200">Waiting for other players to finish...</div>
              </div>
            ) : state.phase === 'WAITING' ? (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center mx-auto text-2xl animate-pulse">
                  ⏳
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">WAIT FOR SIGNAL...</h3>
                <p className="text-xs sm:text-sm text-gray-400 max-w-xs mx-auto">
                  Tap only when you see <strong className="text-emerald-400">GREEN GO</strong>. Tapping
                  early will disqualify you!
                </p>
              </div>
            ) : state.phase === 'SIGNAL' ? (
              state.signalType === 'GO' ? (
                <div className="space-y-3 animate-ping-once">
                  <Zap className="w-20 h-20 text-white mx-auto fill-white" />
                  <h3 className="text-4xl sm:text-5xl font-black tracking-widest text-white">
                    TAP NOW!
                  </h3>
                  <div className="text-sm font-bold uppercase tracking-wider text-emerald-100">
                    TAP THE SCREEN FAST!
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <AlertOctagon className="w-20 h-20 text-white mx-auto" />
                  <h3 className="text-4xl sm:text-5xl font-black tracking-widest text-white">
                    STOP!
                  </h3>
                  <div className="text-sm font-bold uppercase tracking-wider text-rose-200">
                    DECOY TRAP! DO NOT TAP!
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-2">
                <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
                <h3 className="text-2xl font-black text-white">ROUND COMPLETE</h3>
                <p className="text-xs text-gray-400">Next round starting shortly...</p>
              </div>
            )}
          </div>

          {/* Round Results Table */}
          {state.phase === 'ROUND_SUMMARY' && state.rankings && (
            <div className="glass-card rounded-2xl p-4 border border-purple-500/20 space-y-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Reaction Rankings:
              </div>
              {state.rankings.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface/70 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-purple-300 w-5">#{i + 1}</span>
                    <span className="font-semibold text-white">{r.nickname}</span>
                    {r.status === 'DISQUALIFIED' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                        FALSE START
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gray-300">
                      {r.timeMs ? `${r.timeMs} ms` : '—'}
                    </span>
                    <span
                      className={`font-black ${
                        r.pointsGained > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {r.pointsGained > 0 ? `+${r.pointsGained}` : r.pointsGained}
                    </span>
                  </div>
                </div>
              ))}
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

