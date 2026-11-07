import React from 'react';
import { Trophy, Medal, Star, Flame } from 'lucide-react';
import { Player } from '../../types';

interface ScoreboardProps {
  players: Record<string, Player>;
  currentPlayerId?: string;
  showRoundScore?: boolean;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  players,
  currentPlayerId,
  showRoundScore = true,
}) => {
  const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 0:
        return <span className="text-xl">🥇</span>;
      case 1:
        return <span className="text-xl">🥈</span>;
      case 2:
        return <span className="text-xl">🥉</span>;
      default:
        return (
          <span className="w-6 h-6 rounded-full bg-surfaceLight flex items-center justify-center text-xs font-bold text-gray-400">
            #{rank + 1}
          </span>
        );
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-purple-500/20 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-base sm:text-lg text-white">Live Leaderboard</h3>
        </div>
        <span className="text-xs text-purple-300 font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30">
          {sortedPlayers.length} Players
        </span>
      </div>

      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {sortedPlayers.map((player, index) => {
          const isMe = player.id === currentPlayerId;
          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all duration-200 ${
                isMe
                  ? 'bg-purple-900/40 border-2 border-purple-500/60 shadow-md shadow-purple-500/10'
                  : 'bg-surface/60 border border-purple-500/10 hover:border-purple-500/30'
              }`}
            >
              {/* Rank & Profile */}
              <div className="flex items-center gap-3">
                <div className="w-7 flex justify-center">{getRankBadge(index)}</div>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shadow-inner bg-surfaceLight"
                  style={{ border: `2px solid ${player.color}` }}
                >
                  {player.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm sm:text-base text-gray-100 max-w-[100px] sm:max-w-[140px] truncate">
                      {player.nickname}
                    </span>
                    {isMe && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-purple-500/30 text-purple-300 font-bold">
                        YOU
                      </span>
                    )}
                    {player.isHost && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                        HOST
                      </span>
                    )}
                  </div>
                  {!player.isConnected && (
                    <span className="text-[10px] text-rose-400">Disconnected</span>
                  )}
                </div>
              </div>

              {/* Scores */}
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 font-black text-base sm:text-lg text-purple-300">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{player.score}</span>
                </div>
                {showRoundScore && player.currentRoundScore !== 0 && (
                  <div
                    className={`text-xs font-semibold ${
                      player.currentRoundScore > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {player.currentRoundScore > 0
                      ? `+${player.currentRoundScore}`
                      : player.currentRoundScore}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

