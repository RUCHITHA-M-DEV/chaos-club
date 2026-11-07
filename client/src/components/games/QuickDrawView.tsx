import React, { useRef, useState, useEffect } from 'react';
import { QuickDrawClientState, DrawStroke, Player } from '../../types';
import { Timer } from '../common/Timer';
import { Scoreboard } from '../common/Scoreboard';
import {
  Paintbrush,
  Eraser,
  Trash2,
  Undo2,
  Send,
  Eye,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Palette,
  AlertTriangle,
  Flame,
  Zap,
} from 'lucide-react';
import { sound } from '../../services/sound';

interface QuickDrawViewProps {
  state: QuickDrawClientState;
  players: Record<string, Player>;
  currentPlayer: Player;
  onSelectWord: (word: string) => void;
  onSendStroke: (stroke: DrawStroke) => void;
  onUndoStroke: () => void;
  onClearCanvas: () => void;
  onSubmitGuess: (text: string) => void;
}

const PALETTE = [
  { name: 'Black', hex: '#000000' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Yellow', hex: '#FACC15' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Brown', hex: '#78350F' },
  { name: 'White', hex: '#FFFFFF' },
];

export const QuickDrawView: React.FC<QuickDrawViewProps> = ({
  state,
  players,
  currentPlayer,
  onSelectWord,
  onSendStroke,
  onUndoStroke,
  onClearCanvas,
  onSubmitGuess,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const currentStrokeId = useRef<string>('');

  const [color, setColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
    currentStrokeId.current = 'strk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
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
      strokeId: currentStrokeId.current,
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

  const handleSelectDifficultyColor = (diff?: string) => {
    if (diff === 'Easy') return 'from-emerald-500/20 to-emerald-950/40 border-emerald-500/50 text-emerald-400';
    if (diff === 'Hard') return 'from-rose-500/20 to-purple-950/40 border-rose-500/50 text-rose-400';
    return 'from-amber-500/20 to-amber-950/40 border-amber-500/50 text-amber-400';
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
            <div className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
              {state.phase === 'SELECTING' ? (
                isDrawer ? (
                  <span className="text-pink-400">PICK A WORD TO DRAW!</span>
                ) : (
                  <span>
                    DRAWER:{' '}
                    <strong className="text-cyan-400">{state.drawerNickname}</strong> is choosing a word...
                  </span>
                )
              ) : isDrawer ? (
                <span>
                  YOU ARE DRAWING:{' '}
                  <strong className="text-cyan-400 uppercase tracking-wider">{state.word}</strong>
                  {state.difficulty && (
                    <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {state.difficulty}
                    </span>
                  )}
                </span>
              ) : (
                <span>
                  DRAWER: <strong className="text-cyan-400">{state.drawerNickname}</strong> • HINT:{' '}
                  <span className="font-mono text-amber-400 tracking-widest">{state.hint}</span>
                  {state.category && (
                    <span className="ml-2 text-xs font-normal text-gray-400">({state.category})</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <Timer
          seconds={state.timeRemaining}
          totalSeconds={state.phase === 'SELECTING' ? 15 : 60}
          label={state.phase === 'SELECTING' ? 'Pick' : 'Time'}
          size="md"
        />
      </div>

      {/* WORD SELECTION MODAL (Drawer only) */}
      {state.phase === 'SELECTING' && isDrawer && state.wordChoices && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border-2 border-cyan-500/50 shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
              Your Turn to Draw!
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Choose 1 out of 3 Words
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Only you can see these choices. Pick one before the timer runs out!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {state.wordChoices.map((choice) => {
              const borderBadge = handleSelectDifficultyColor(choice.difficulty);
              return (
                <div
                  key={choice.word}
                  onClick={() => {
                    sound.playClick();
                    onSelectWord(choice.word);
                  }}
                  className={`p-6 rounded-2xl bg-gradient-to-br ${borderBadge} border-2 hover:scale-[1.03] transition-all cursor-pointer shadow-lg flex flex-col justify-between space-y-4 group`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-black/40 border border-white/10 tracking-widest">
                      {choice.difficulty}
                    </span>
                    <span className="text-[10px] text-gray-300 font-medium">
                      {choice.category}
                    </span>
                  </div>

                  <div className="text-center py-2">
                    <div className="text-2xl sm:text-3xl font-black text-white tracking-wide group-hover:text-cyan-300 transition-colors">
                      {choice.word}
                    </div>
                    <div className="text-xs font-mono text-gray-400 mt-1">
                      {choice.hint}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow"
                  >
                    Draw This Word
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GUESSERS WAITING SCREEN DURING WORD SELECTION */}
      {state.phase === 'SELECTING' && !isDrawer && (
        <div className="glass-card rounded-3xl p-10 text-center border border-cyan-500/20 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-3xl mx-auto animate-pulse">
            🎨
          </div>
          <h3 className="text-xl font-black text-white">
            {state.drawerNickname} is choosing a word...
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Get your keyboard ready! You will have 60 seconds to guess what they draw.
          </p>
        </div>
      )}

      {/* REVEAL PHASE BANNER */}
      {state.phase === 'REVEAL' && (
        <div className="glass-card rounded-2xl p-5 border border-emerald-500/40 bg-emerald-950/30 text-center space-y-1">
          <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">
            Round Ended!
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            The secret word was <span className="text-cyan-400 uppercase">{state.word}</span>
          </h3>
          <p className="text-xs text-gray-300">
            {state.correctGuessers.length > 0
              ? `${state.correctGuessers.length} player(s) guessed correctly!`
              : 'No one guessed in time!'}
          </p>
        </div>
      )}

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

            {/* Clear Confirmation Popover */}
            {showClearConfirm && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-3xl flex items-center justify-center p-4 z-20">
                <div className="bg-surface border-2 border-rose-500/50 rounded-2xl p-5 max-w-sm w-full text-center space-y-4 shadow-2xl">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-white">Clear Canvas?</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Are you sure you want to erase the entire drawing?
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 py-2 rounded-xl bg-surface border border-purple-500/20 text-gray-300 text-xs font-bold hover:bg-surfaceLight"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playWrong();
                        onClearCanvas();
                        setShowClearConfirm(false);
                      }}
                      className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Comprehensive Drawing Toolbar (Drawer Only) */}
            {canDraw && (
              <div className="mt-3 space-y-3 p-3 rounded-2xl bg-surface/90 border border-purple-500/20">
                {/* Row 1: Color Palette & Custom Color Picker */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {PALETTE.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        title={c.name}
                        onClick={() => {
                          sound.playClick();
                          setColor(c.hex);
                          setIsEraser(false);
                        }}
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-white/20 transition-all ${
                          color === c.hex && !isEraser
                            ? 'scale-125 ring-2 ring-cyan-400 shadow-md'
                            : 'opacity-80 hover:opacity-100 hover:scale-110'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}

                    {/* Custom Color Picker */}
                    <label
                      title="Custom Color"
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full cursor-pointer flex items-center justify-center border-2 border-dashed border-cyan-400/70 hover:scale-110 transition-transform relative overflow-hidden bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400"
                    >
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => {
                          setColor(e.target.value);
                          setIsEraser(false);
                        }}
                        className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                      />
                    </label>
                  </div>

                  {/* Actions: Undo & Clear */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onUndoStroke();
                      }}
                      disabled={state.strokes.length === 0}
                      className="px-2.5 py-1.5 rounded-xl border border-purple-500/30 bg-surfaceLight/80 text-gray-200 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-bold flex items-center gap-1 transition-all"
                      title="Undo last stroke"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Undo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-all"
                      title="Clear canvas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Clear</span>
                    </button>
                  </div>
                </div>

                {/* Row 2: Brush Sizes, Slider & Eraser */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-purple-500/10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setIsEraser(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                        !isEraser
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                          : 'bg-surface text-gray-400 border-purple-500/20'
                      }`}
                    >
                      <Paintbrush className="w-3.5 h-3.5" />
                      <span>Brush</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setIsEraser(true);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isEraser
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                          : 'bg-surface text-gray-400 border-purple-500/20'
                      }`}
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>Eraser</span>
                    </button>

                    {/* Quick Size Presets: Small, Medium, Large */}
                    <div className="flex items-center gap-1 ml-2">
                      {[
                        { label: 'S', size: 3 },
                        { label: 'M', size: 7 },
                        { label: 'L', size: 14 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setBrushSize(preset.size);
                          }}
                          className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${
                            brushSize === preset.size
                              ? 'bg-cyan-500 text-white ring-1 ring-cyan-300'
                              : 'bg-surfaceLight text-gray-400 hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Thickness Slider */}
                  <div className="flex items-center gap-2 flex-1 sm:max-w-xs justify-end">
                    <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">
                      Size: {brushSize}px
                    </span>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-24 sm:w-32 accent-cyan-400 cursor-pointer"
                    />
                  </div>
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
                      : state.phase === 'SELECTING'
                      ? 'Waiting for drawer to choose word...'
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
