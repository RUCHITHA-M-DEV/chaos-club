import React, { useState } from 'react';
import {
  Copy,
  Check,
  Share2,
  Crown,
  Play,
  CheckCircle,
  Clock,
  Sparkles,
  Users,
  ShieldCheck,
  Zap,
  Sliders,
  UserX,
  AlertTriangle,
} from 'lucide-react';
import { Player, GameType, SanitizedRoomState } from '../../types';
import { sound } from '../../services/sound';
import { socket } from '../../services/socket';

interface RoomLobbyProps {
  room: SanitizedRoomState;
  currentPlayer: Player;
  onToggleReady: () => void;
  onSelectGame: (gameType: GameType) => void;
  onUpdateGameSettings: (settings: { quickDrawRounds?: number }) => void;
  onInitiateVoteKick: (targetPlayerId: string) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

const MINI_GAMES: {
  id: GameType;
  name: string;
  icon: string;
  tagline: string;
  minPlayers: number;
  maxPlayers: number;
  accent: string;
}[] = [
  {
    id: 'SECRET_AGENT',
    name: 'Secret Agent',
    icon: '🕵️‍♂️',
    tagline: 'Covert missions, deception, and challenge showdowns.',
    minPlayers: 2,
    maxPlayers: 10,
    accent: 'border-purple-500/40 text-purple-400',
  },
  {
    id: 'FAKE_ANSWER',
    name: 'Fake Answer',
    icon: '🎭',
    tagline: 'Submit ridiculous fake answers and fool everyone.',
    minPlayers: 2,
    maxPlayers: 10,
    accent: 'border-pink-500/40 text-pink-400',
  },
  {
    id: 'QUICK_DRAW',
    name: 'Quick Draw',
    icon: '🎨',
    tagline: 'Choose 1 of 3 words, sketch live with pro tools, and speed guess.',
    minPlayers: 2,
    maxPlayers: 10,
    accent: 'border-cyan-500/40 text-cyan-400',
  },
  {
    id: 'WHO_KNOWS_ME',
    name: 'Who Knows Me Best?',
    icon: '🔮',
    tagline: 'Predict your friend’s deepest secrets and habits.',
    minPlayers: 2,
    maxPlayers: 10,
    accent: 'border-amber-500/40 text-amber-400',
  },
  {
    id: 'SURVIVAL_VOTE',
    name: 'Survival Vote',
    icon: '🏝️',
    tagline: 'Vote on hilarious dilemmas to survive wild crises.',
    minPlayers: 2,
    maxPlayers: 10,
    accent: 'border-emerald-500/40 text-emerald-400',
  },
  {
    id: 'REACTION_BATTLE',
    name: 'Reaction Battle',
    icon: '⚡',
    tagline: 'Lightning reflex showdown with green GO and red STOP traps.',
    minPlayers: 2,
    maxPlayers: 10,
    accent: 'border-red-500/40 text-red-400',
  },
];

const ROUND_OPTIONS = [1, 2, 3, 5, 10];

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  room,
  currentPlayer,
  onToggleReady,
  onSelectGame,
  onUpdateGameSettings,
  onInitiateVoteKick,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [kickTarget, setKickTarget] = useState<Player | null>(null);

  const activePlayers = Object.values(room.players).filter((p) => p.isConnected);
  const isHost = currentPlayer.isHost;
  const canStart = activePlayers.length >= room.minPlayers;
  const currentRounds = room.gameSettings?.quickDrawRounds || 3;

  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (socket.connected && currentPlayer?.id) {
      socket.emit('player_ping', { roomCode: room.code, playerId: currentPlayer.id });
    }
  };

  const handleShare = async () => {
    sound.playClick();
    const shareUrl = `${window.location.origin}?room=${room.code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my CHAOS CLUB Room!',
          text: `Join my CHAOS CLUB multiplayer party room with code ${room.code}!`,
          url: shareUrl,
        });
      } catch (err) {
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
    if (socket.connected && currentPlayer?.id) {
      socket.emit('player_ping', { roomCode: room.code, playerId: currentPlayer.id });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner: Room Code & Share Invitation */}
      <div className="glass-card rounded-3xl p-5 sm:p-7 border border-purple-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-600 dark:text-purple-300">
              Private Room Lobby
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            Invite your friends to start the chaos!
          </h2>
        </div>

        {/* Room Code Badge & Action Buttons */}
        <div className="flex items-center gap-3">
          <div
            onClick={handleCopyCode}
            title="Click to copy room code"
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-surface border-2 border-purple-500/50 hover:border-purple-400 cursor-pointer transition-all shadow-lg hover:shadow-purple-500/20 group select-none"
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 dark:text-gray-400 block">
                Room Code
              </span>
              <span className="font-mono font-black text-2xl sm:text-3xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                {room.code}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-300 group-hover:bg-purple-500/20">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </div>
          </div>

          <button
            onClick={handleShare}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center"
            title="Share Room Invite"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Player Roster (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card rounded-3xl p-5 border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Joined Players</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                {activePlayers.length} / {room.maxPlayers}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {Object.values(room.players).map((p) => {
                const isMe = p.id === currentPlayer.id;
                const canVoteKickThisPlayer = !isMe && !p.isHost;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                      isMe
                        ? 'bg-purple-500/10 dark:bg-purple-900/30 border-2 border-purple-500/50'
                        : 'bg-surface/80 border border-purple-500/10'
                    } ${!p.isConnected ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shadow-inner bg-surfaceLight"
                        style={{ border: `2px solid ${p.color}` }}
                      >
                        {p.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-gray-900 dark:text-gray-100 max-w-[120px] truncate">
                            {p.nickname}
                          </span>
                          {isMe && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        {p.isHost && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                            <Crown className="w-3 h-3" />
                            <span>Room Host</span>
                          </div>
                        )}
                        {!p.isConnected && (
                          <span className="text-[10px] text-rose-500 font-medium">Reconnecting...</span>
                        )}
                      </div>
                    </div>

                    {/* Ready Status & Vote Kick Button */}
                    <div className="flex items-center gap-2">
                      {p.isReady ? (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>READY</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>WAITING</span>
                        </div>
                      )}

                      {/* Vote Kick Action */}
                      {canVoteKickThisPlayer && (
                        <button
                          type="button"
                          onClick={() => setKickTarget(p)}
                          title={`Vote to kick ${p.nickname}`}
                          className="p-1.5 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Toggle Ready Button (Non-host players) */}
            {!isHost && (
              <button
                onClick={() => {
                  sound.playClick();
                  onToggleReady();
                }}
                className={`w-full mt-4 py-3 rounded-2xl font-black text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                  currentPlayer.isReady
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{currentPlayer.isReady ? 'READY (CLICK TO UNREADY)' : 'I AM READY!'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Mini-Game Selector & Game Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-purple-500/20 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                  Select Mini-Game
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {isHost
                    ? 'Pick which game the squad will play first'
                    : 'The host will choose a game for this round'}
                </p>
              </div>
              <span className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">
                6 Modes
              </span>
            </div>

            {/* Game Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MINI_GAMES.map((game) => {
                const isSelected = room.selectedGame === game.id;
                return (
                  <div
                    key={game.id}
                    onClick={() => {
                      if (isHost) {
                        sound.playClick();
                        onSelectGame(game.id);
                      }
                    }}
                    className={`p-3.5 rounded-2xl transition-all border text-left ${
                      isSelected
                        ? 'bg-purple-500/10 dark:bg-purple-900/40 border-2 border-purple-500 shadow-lg shadow-purple-500/20'
                        : 'bg-surface/80 border-purple-500/10 hover:border-purple-500/30'
                    } ${isHost ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">{game.icon}</span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/40">
                          SELECTED
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">
                      {game.name}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight line-clamp-2">
                      {game.tagline}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* QUICK DRAW GAME SETTINGS (ROUNDS CONFIGURATION) */}
            {room.selectedGame === 'QUICK_DRAW' && (
              <div className="p-4 rounded-2xl bg-cyan-950/30 border-2 border-cyan-500/40 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                      Quick Draw Settings
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {currentRounds} {currentRounds === 1 ? 'Round' : 'Rounds'} Configured
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-300 font-medium">
                    {isHost ? 'Select Number of Rounds:' : 'Rounds configured by Host:'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {ROUND_OPTIONS.map((num) => (
                      <button
                        key={num}
                        type="button"
                        disabled={!isHost}
                        onClick={() => {
                          if (isHost) {
                            sound.playClick();
                            onUpdateGameSettings({ quickDrawRounds: num });
                          }
                        }}
                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                          currentRounds === num
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 scale-105'
                            : 'bg-surface text-gray-400 border border-cyan-500/20 hover:text-white'
                        } ${!isHost ? 'cursor-default' : 'cursor-pointer hover:scale-105'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Start Game Action (Host Only) */}
            {isHost ? (
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    onStartGame();
                  }}
                  disabled={!canStart}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-base tracking-wide shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>START {room.selectedGame.replace('_', ' ')}</span>
                </button>
                {!canStart && (
                  <p className="text-center text-xs text-amber-600 dark:text-amber-400/90 font-medium">
                    ⚠️ Need at least {room.minPlayers} players to start (currently {activePlayers.length})
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-surface/80 border border-purple-500/20 text-center">
                <p className="text-xs text-purple-700 dark:text-purple-300 font-bold">
                  🎮 Waiting for the room host to start the game...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal to Initiate Vote Kick */}
      {kickTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card max-w-sm w-full rounded-3xl p-6 border-2 border-rose-500/50 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-black text-white">Start Vote Kick?</h4>
              <p className="text-xs text-gray-300 mt-1">
                Start a room-wide vote to remove <strong className="text-rose-400">{kickTarget.nickname}</strong>?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setKickTarget(null)}
                className="py-2.5 rounded-xl bg-surface border border-purple-500/20 text-gray-300 text-xs font-bold hover:bg-surfaceLight"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onInitiateVoteKick(kickTarget.id);
                  setKickTarget(null);
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30"
              >
                Start Vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
