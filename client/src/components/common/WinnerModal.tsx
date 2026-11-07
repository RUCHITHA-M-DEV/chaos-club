import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Sparkles, ArrowRight } from 'lucide-react';
import { Player } from '../../types';
import { sound } from '../../services/sound';

interface WinnerModalProps {
  players: Record<string, Player>;
  isHost: boolean;
  onRematch: () => void;
  onReturnToLobby: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  players,
  isHost,
  onRematch,
  onReturnToLobby,
}) => {
  const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  useEffect(() => {
    sound.playVictory();

    // Multi-stage confetti celebration
    const duration = 3.5 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'],
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/40 shadow-2xl relative overflow-hidden">
        {/* Glowing Background Blob */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-600/30 blur-3xl rounded-full pointer-events-none" />

        <div className="relative text-center">
          {/* Trophy Badge */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-pink-500 p-1 shadow-lg shadow-amber-500/30 mb-4 animate-bounce">
            <div className="w-full h-full bg-surface rounded-[14px] flex items-center justify-center">
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-300 mb-1">
            GAME OVER!
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            The chaos has settled. Here are the ultimate champions:
          </p>

          {/* Winner Spotlight */}
          {winner && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/15 to-pink-500/10 border border-amber-500/30 mb-6">
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl animate-pulse" style={{ color: winner.color }}>
                  {winner.avatar}
                </span>
                <div className="text-left">
                  <div className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
                    Grand Champion 👑
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white">{winner.nickname}</div>
                  <div className="text-sm font-bold text-amber-300">{winner.score} Total Points</div>
                </div>
              </div>
            </div>
          )}

          {/* Top Rankings Table */}
          <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-1 text-left">
            {sortedPlayers.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface/80 border border-purple-500/15 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-gray-400 w-5">#{idx + 1}</span>
                  <span>{p.avatar}</span>
                  <span className="font-semibold text-gray-200 truncate max-w-[150px]">
                    {p.nickname}
                  </span>
                </div>
                <span className="font-mono font-bold text-purple-300">{p.score} pts</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {isHost ? (
              <>
                <button
                  onClick={() => {
                    sound.playClick();
                    onRematch();
                  }}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Rematch</span>
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    onReturnToLobby();
                  }}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 text-gray-200 font-bold text-sm border border-purple-500/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Home className="w-4 h-4" />
                  <span>Return to Lobby</span>
                </button>
              </>
            ) : (
              <div className="w-full py-3 px-4 rounded-xl bg-surfaceLight text-center text-xs text-gray-400 border border-purple-500/20">
                Waiting for the host to select rematch or return to lobby...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

