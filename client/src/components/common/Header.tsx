import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Wifi, WifiOff, LogOut, Download, Sparkles } from 'lucide-react';
import { sound } from '../../services/sound';
import { Player } from '../../types';

interface HeaderProps {
  player: Player | null;
  roomCode: string | null;
  isConnected: boolean;
  onLeaveRoom?: () => void;
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  player,
  roomCode,
  isConnected,
  onLeaveRoom,
  onLogoClick,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-purple-500/15 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={onLogoClick}
          className="flex items-center gap-2 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 p-[2px] transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 shadow-lg shadow-purple-500/25">
            <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center font-black text-lg text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 to-pink-400">
              ⚡
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white group-hover:text-purple-300 transition-colors">
                CHAOS<span className="text-purple-400">CLUB</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Party
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install Button */}
          {showInstallBtn && (
            <button
              onClick={handleInstallClick}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md hover:opacity-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* Connection Status Indicator */}
          <div
            title={isConnected ? 'Connected to Multiplayer Server' : 'Connecting to Server...'}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-400 animate-pulse'
            }`}
          >
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                <span className="hidden md:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span className="hidden md:inline">Connecting</span>
              </>
            )}
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="w-9 h-9 rounded-xl bg-surfaceLight/80 hover:bg-surfaceLight border border-purple-500/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-gray-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-purple-400" />
            )}
          </button>

          {/* Active Player Chip */}
          {player && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-surface border border-purple-500/20">
              <span className="text-lg leading-none" style={{ color: player.color }}>
                {player.avatar}
              </span>
              <span className="text-xs font-bold text-gray-200 max-w-[80px] sm:max-w-[120px] truncate">
                {player.nickname}
              </span>
              {player.isHost && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">
                  HOST
                </span>
              )}
            </div>
          )}

          {/* Leave Room Button */}
          {roomCode && onLeaveRoom && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to leave this game room?')) {
                  sound.playClick();
                  onLeaveRoom();
                }
              }}
              className="w-9 h-9 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
              title="Leave Room"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

