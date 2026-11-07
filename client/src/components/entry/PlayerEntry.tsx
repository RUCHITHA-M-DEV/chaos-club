import React, { useState } from 'react';
import { Sparkles, Dices, Users, PlusCircle, LogIn, ArrowRight } from 'lucide-react';
import { sound } from '../../services/sound';

interface PlayerEntryProps {
  initialRoomCode?: string;
  onCreateRoom: (playerData: { nickname: string; avatar: string; color: string }) => void;
  onJoinRoom: (roomCode: string, playerData: { nickname: string; avatar: string; color: string }) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

const AVATARS = ['👾', '🦊', '🤖', '👑', '🦄', '⚡', '🍕', '🎭', '🥷', '🚀', '💣', '🐙', '🐱', '🦁', '🐼', '🧙'];

const COLORS = [
  '#8B5CF6', // Chaos Purple
  '#EC4899', // Cyber Pink
  '#06B6D4', // Neon Cyan
  '#3B82F6', // Electric Blue
  '#10B981', // Toxic Emerald
  '#F97316', // Sunset Orange
  '#F59E0B', // Golden Amber
  '#EF4444', // Neon Red
];

const RANDOM_NAMES = [
  'ChaosGremlin',
  'NeonNinja',
  'PixelPirate',
  'CaptainClutch',
  'BluffMaster',
  'VibeCheck',
  'ZeroChill',
  'LaserLlama',
  'TurboSnail',
  'GlitchQueen',
];

export const PlayerEntry: React.FC<PlayerEntryProps> = ({
  initialRoomCode = '',
  onCreateRoom,
  onJoinRoom,
  isLoading = false,
  errorMessage = null,
}) => {
  const [mode, setMode] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [roomCode, setRoomCode] = useState(initialRoomCode.toUpperCase());
  const [formError, setFormError] = useState<string | null>(null);

  const handleRandomize = () => {
    sound.playClick();
    const randName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const randAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const randColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setNickname(randName);
    setAvatar(randAvatar);
    setColor(randColor);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanNick = nickname.trim();
    if (!cleanNick) {
      sound.playWrong();
      setFormError('Please choose a nickname!');
      return;
    }
    if (cleanNick.length > 15) {
      sound.playWrong();
      setFormError('Nickname must be 15 characters or less!');
      return;
    }

    sound.playClick();
    const playerData = { nickname: cleanNick, avatar, color };

    if (mode === 'create') {
      onCreateRoom(playerData);
    } else {
      const cleanCode = roomCode.trim().toUpperCase();
      if (cleanCode.length !== 6) {
        sound.playWrong();
        setFormError('Room code must be exactly 6 characters!');
        return;
      }
      onJoinRoom(cleanCode, playerData);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/30 shadow-2xl relative">
        {/* Header Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-surfaceLight mb-6 border border-purple-500/20">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setMode('create');
            }}
            className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              mode === 'create'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Room</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setMode('join');
            }}
            className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              mode === 'join'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Join Room</span>
          </button>
        </div>

        {/* Error notification */}
        {(formError || errorMessage) && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 dark:bg-rose-950/60 border border-rose-500/50 text-rose-600 dark:text-rose-300 text-xs font-semibold text-center animate-shake">
            {formError || errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Preview & Randomizer */}
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-xl bg-surfaceLight transition-transform hover:scale-105"
                style={{
                  border: `3px solid ${color}`,
                  boxShadow: `0 0 20px ${color}40`,
                }}
              >
                {avatar}
              </div>
              <button
                type="button"
                onClick={handleRandomize}
                title="Randomize Profile"
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-surface border border-purple-500/40 text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all"
              >
                <Dices className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Select or Randomize Your Vibe</span>
          </div>

          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
              Your Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. ChaosKing"
              maxLength={15}
              required
              className="w-full px-4 py-3 rounded-xl bg-surface border border-purple-500/25 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 text-sm shadow-sm"
            />
          </div>

          {/* Room Code (if in Join mode) */}
          {mode === 'join' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                6-Character Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. X7K9P2"
                maxLength={6}
                required
                className="w-full px-4 py-3 rounded-xl bg-surface border border-purple-500/25 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 text-gray-900 dark:text-white font-mono font-black text-center tracking-widest text-lg uppercase shadow-sm"
              />
            </div>
          )}

          {/* Avatar Picker Swatches */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
              Choose Avatar
            </label>
            <div className="grid grid-cols-8 gap-2">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setAvatar(av);
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform ${
                    avatar === av
                      ? 'bg-purple-600 text-white scale-110 shadow-md ring-2 ring-purple-400'
                      : 'bg-surface hover:bg-surfaceLight'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker Swatches */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
              Profile Color
            </label>
            <div className="flex items-center justify-between gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setColor(c);
                  }}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-purple-600 dark:ring-white' : 'hover:scale-110 opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-extrabold text-base tracking-wide shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Connecting...
              </span>
            ) : mode === 'create' ? (
              <>
                <PlusCircle className="w-5 h-5" />
                <span>CREATE ROOM & INVITE</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>JOIN GAME ROOM</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
