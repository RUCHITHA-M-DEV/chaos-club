import React, { useRef, useState, useEffect } from 'react';
import { QuickDrawClientState, DrawStroke, Player } from '../../types';
import { Timer } from '../common/Timer';
import { Scoreboard } from '../common/Scoreboard';
import {
  Paintbrush,
  Eraser,
  Trash2,
  Send,
  Eye,
  Sparkles,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { sound } from '../../services/sound';

interface QuickDrawViewProps {
  state: QuickDrawClientState;
  players: Record<string, Player>;
  currentPlayer: Player;
  onSendStroke: (stroke: DrawStroke) => void;
  onClearCanvas: () => void;
  onSubmitGuess: (text: string) => void;
}

const PALETTE = [
  '#FFFFFF', // White
  '#F43F5E', // Red
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#0E1322', // Dark background color
];

export const QuickDrawView: React.FC<QuickDrawViewProps> = ({
  state,
  players,
  currentPlayer,
  onSendStroke,
  onClearCanvas,
  onSubmitGuess,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [closeHint, setCloseHint] = useState<string | null>(null);

  const isDrawer = state.isDrawer;
  const canDraw = isDrawer && state.phase === 'DRAWING';

  // Redraw canvas from strokes state
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#0E1322';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    state.strokes.forEach((stroke) => {
      ctx.beginPath();
      ctx.moveTo(stroke.x0 * canvas.width, stroke.y0 * canvas.height);
      ctx.lineTo(stroke.x1 * canvas.width, stroke.y1 * canvas.height);
      ctx.strokeStyle = stroke.isEraser ? '#0E1322' : stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });
  }, [state.strokes]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  const handleStartDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canDraw) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setIsDrawing(true);
    setLastPos(coords);
  };

  const handleMoveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canDraw || !lastPos) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;

    const stroke: DrawStroke = {
      x0: lastPos.x,
      y0: lastPos.y,
      x1: coords.x,
      y1: coords.y,
      color,
      size: brushSize,
      isEraser,
    };

    onSendStroke(stroke);
    setLastPos(coords);
  };

  const handleEndDraw = () => {
    setIsDrawing(false);
    setLastPos(null);
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || state.hasGuessedCorrectly) return;
    sound.playClick();
    onSubmitGuess(guessInput.trim());
    setGuessInput('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Status Bar */}
      <div className="glass-card rounded-2xl p-4 border border-cyan-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-xl">
            🎨
          </div>
          <div>
            <div className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider">
              Quick Draw • Round {state.round} of {state.totalRounds}
            </div>
            <div className="text-base sm:text-lg font-black text-white">
              {isDrawer ? (
                <span>
                  YOU ARE DRAWING: <strong className="text-cyan-300 uppercase">{state.word}</strong>
                </span>
              ) : (
                <span>
                  DRAWER: <strong className="text-cyan-300">{state.drawerNickname}</strong> • HINT:{' '}
                  <span className="font-mono text-amber-300 tracking-widest">{state.hint}</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <Timer seconds={state.timeRemaining} totalSeconds={60} label="Time" size="md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Drawing Canvas Area (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="glass-card rounded-3xl p-3 sm:p-4 border border-cyan-500/25 relative overflow-hidden">
            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              onMouseDown={handleStartDraw}
              onMouseMove={handleMoveDraw}
              onMouseUp={handleEndDraw}
              onMouseLeave={handleEndDraw}
              onTouchStart={handleStartDraw}
              onTouchMove={handleMoveDraw}
              onTouchEnd={handleEndDraw}
              className={`w-full h-auto aspect-[16/10] rounded-2xl bg-[#0E1322] border border-cyan-500/20 shadow-inner ${
                canDraw ? 'cursor-crosshair touch-none' : 'cursor-default'
              }`}
            />

            {/* Drawing Controls (Drawer Only) */}
            {canDraw && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-surface/80 border border-purple-500/15">
                {/* Palette */}
                <div className="flex items-center gap-1.5">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setColor(c);
                        setIsEraser(false);
                      }}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c && !isEraser
                          ? 'scale-125 ring-2 ring-white shadow-md'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                {/* Brush / Eraser / Clear */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setIsEraser(false);
                    }}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                      !isEraser
                        ? 'bg-cyan-600 text-white border-cyan-400'
                        : 'bg-surface text-gray-400 border-purple-500/20'
                    }`}
                  >
                    <Paintbrush className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Brush</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setIsEraser(true);
                    }}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                      isEraser
                        ? 'bg-cyan-600 text-white border-cyan-400'
                        : 'bg-surface text-gray-400 border-purple-500/20'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Eraser</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playWrong();
                      onClearCanvas();
                    }}
                    className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold flex items-center gap-1"
                    title="Clear Canvas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Guesses Chat & Scoreboard (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Chat Guesses Box */}
          <div className="glass-card rounded-3xl p-4 border border-cyan-500/20 flex flex-col h-[340px]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-500/15">
              <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                Guessing Feed
              </span>
              <span className="text-[10px] text-gray-400">
                {state.correctGuessers.length} Guessed Correctly
              </span>
            </div>

            {/* Guesses Log */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {state.guesses.map((g, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl ${
                    g.isCorrect
                      ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-bold'
                      : 'bg-surface/70 text-gray-200'
                  }`}
                >
                  <strong className="text-purple-300">{g.nickname}:</strong> {g.text}
                </div>
              ))}
            </div>

            {/* Guess Input Form */}
            {!isDrawer && (
              <form onSubmit={handleGuessSubmit} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  disabled={state.hasGuessedCorrectly || state.phase !== 'DRAWING'}
                  placeholder={
                    state.hasGuessedCorrectly
                      ? 'You got it! Waiting for others...'
                      : 'Type your guess here...'
                  }
                  className="flex-1 px-3 py-2 rounded-xl bg-surface border border-cyan-500/30 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder-gray-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={state.hasGuessedCorrectly || state.phase !== 'DRAWING'}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

          {/* Mini Scoreboard */}
          <Scoreboard players={players} currentPlayerId={currentPlayer.id} />
        </div>
      </div>
    </div>
  );
};

