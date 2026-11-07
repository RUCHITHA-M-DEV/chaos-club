import React from 'react';
import { motion } from 'framer-motion';
import {
  Gamepad2,
  Users,
  Sparkles,
  Zap,
  Shield,
  Eye,
  Pencil,
  Brain,
  Vote,
  Gauge,
  ArrowRight,
  Smile,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { sound } from '../../services/sound';

interface LandingPageProps {
  onStartPlaying: () => void;
  onSelectGameDirectly?: (gameId: string) => void;
}

const MINI_GAMES = [
  {
    id: 'SECRET_AGENT',
    name: 'Secret Agent',
    icon: '🕵️‍♂️',
    category: 'Social Deduction',
    color: 'from-purple-600 to-indigo-700',
    borderColor: 'border-purple-500/30',
    description:
      'Every player receives a top-secret sabotage mission. Deceive your friends, claim victory, and challenge bluffers before time runs out!',
    players: '2-10 Players',
  },
  {
    id: 'FAKE_ANSWER',
    name: 'Fake Answer',
    icon: '🎭',
    category: 'Trivia Bluff',
    color: 'from-pink-600 to-rose-700',
    borderColor: 'border-pink-500/30',
    description:
      'Submit believable fake answers to obscure trivia questions. Vote on the truth and fool your friends into picking your bluffs!',
    players: '2-10 Players',
  },
  {
    id: 'QUICK_DRAW',
    name: 'Quick Draw',
    icon: '🎨',
    category: 'Drawing & Guessing',
    color: 'from-cyan-600 to-blue-700',
    borderColor: 'border-cyan-500/30',
    description:
      'Synchronized real-time sketch battle! Draw secret words while friends guess in lightning-fast chat with speed bonuses.',
    players: '2-10 Players',
  },
  {
    id: 'WHO_KNOWS_ME',
    name: 'Who Knows Me Best?',
    icon: '🔮',
    category: 'Friendship Quiz',
    color: 'from-amber-600 to-orange-700',
    borderColor: 'border-amber-500/30',
    description:
      'Put one friend in the hot seat. Predict their wildest confessions, worst habits, and impulse purchases for matching points.',
    players: '2-10 Players',
  },
  {
    id: 'SURVIVAL_VOTE',
    name: 'Survival Vote',
    icon: '🏝️',
    category: 'Apocalypse Dilemmas',
    color: 'from-emerald-600 to-teal-700',
    borderColor: 'border-emerald-500/30',
    description:
      'Vote on ridiculous decisions to survive zombie IKEA lockdowns, desert islands, and sentient appliance mutinies!',
    players: '2-10 Players',
  },
  {
    id: 'REACTION_BATTLE',
    name: 'Reaction Battle',
    icon: '⚡',
    category: 'Reflex Speed',
    color: 'from-red-600 to-amber-700',
    borderColor: 'border-red-500/30',
    description:
      'Server-authoritative reflex duel! Tap on green GO signals in milliseconds, but beware deceptive RED STOP decoys and false starts.',
    players: '2-10 Players',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onStartPlaying }) => {
  return (
    <div className="relative overflow-hidden">
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-64 right-10 w-80 h-80 bg-pink-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] left-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 text-center max-w-5xl mx-auto">
        {/* Floating Gaming Elements (Animated with Framer Motion) */}
        <motion.div
          animate={{ y: [-10, 10, -10], rotate: [0, 8, -6, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-8 left-4 sm:left-12 text-3xl sm:text-5xl select-none opacity-60 hidden sm:block pointer-events-none"
        >
          🎲
        </motion.div>
        <motion.div
          animate={{ y: [12, -12, 12], rotate: [0, -12, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-16 right-4 sm:right-16 text-3xl sm:text-5xl select-none opacity-60 hidden sm:block pointer-events-none"
        >
          🕹️
        </motion.div>
        <motion.div
          animate={{ y: [-8, 14, -8] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-16 left-12 text-2xl sm:text-4xl select-none opacity-40 hidden sm:block pointer-events-none"
        >
          💣
        </motion.div>
        <motion.div
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-12 right-20 text-2xl sm:text-4xl select-none opacity-40 hidden sm:block pointer-events-none"
        >
          👾
        </motion.div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs sm:text-sm font-semibold mb-6 shadow-inner backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-pink-500 dark:text-pink-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Real-Time Multiplayer Party Web Platform</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-gray-950 dark:text-white mb-6 leading-tight">
          Less scrolling.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 dark:from-purple-400 dark:via-pink-400 dark:to-cyan-400">
            More chaos.
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-base sm:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          Create a private room in 2 seconds, invite your squad with a 6-character room code, and battle
          through six hilarious real-time mini-games. No downloads or signups required.
        </p>

        {/* Play Now CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => {
              sound.playClick();
              onStartPlaying();
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-lg tracking-wide shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Gamepad2 className="w-6 h-6" />
            <span>PLAY NOW</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Stat Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-14 max-w-4xl mx-auto">
          {[
            { label: 'Mini-Games', val: '6 Live Games' },
            { label: 'Room Size', val: '2–10 Players' },
            { label: 'Account Needed', val: '0 (Instant Play)' },
            { label: 'Cross-Platform', val: 'Android / Web PWA' },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-surface/75 border border-purple-500/15 backdrop-blur-md text-center shadow-sm"
            >
              <div className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-300 dark:to-pink-300">
                {stat.val}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Explore Games Section */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-950 dark:text-white mb-3">
            Explore the <span className="text-purple-600 dark:text-purple-400">Chaos Arena</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Six completely different multiplayer mechanics designed to test your reflexes, bluffing, and friendships.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MINI_GAMES.map((game) => (
            <div
              key={game.id}
              className={`glass-card rounded-3xl p-6 border ${game.borderColor} glass-card-hover flex flex-col justify-between relative overflow-hidden`}
            >
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl p-2 rounded-2xl bg-surfaceLight border border-purple-500/20 shadow-inner">
                    {game.icon}
                  </span>
                  <span className="text-[11px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    {game.category}
                  </span>
                </div>

                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{game.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">{game.description}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-purple-500/15 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-300">
                  <Users className="w-3.5 h-3.5" />
                  {game.players}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Ready to Play
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How to Play Section */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-950 dark:text-white mb-3">
            How It <span className="text-pink-600 dark:text-pink-400">Works</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Three simple steps to instant party gaming.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Create a Room',
              desc: 'Pick your wild avatar, color, and nickname. Host gets a unique 6-character room code in 1 tap.',
              icon: '🚀',
            },
            {
              step: '02',
              title: 'Invite Friends',
              desc: 'Share the room code or invitation link with up to 10 friends on phone or PC.',
              icon: '📱',
            },
            {
              step: '03',
              title: 'Unleash the Chaos',
              desc: 'Host picks any of the six games. Battle for points on the live scoreboard and crown the winner!',
              icon: '👑',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="glass-card rounded-3xl p-6 border border-purple-500/20 relative overflow-hidden text-center shadow-sm"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <span className="text-xs font-black tracking-widest text-purple-600 dark:text-purple-400 block mb-1">
                STEP {item.step}
              </span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 border-t border-purple-500/15 py-10 px-4 text-center text-xs text-gray-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-gray-900 dark:text-white">CHAOS CLUB</span>
            <span>– Less scrolling. More chaos.</span>
          </div>
          <div>Built with React, Vite, Socket.IO, Tailwind & Express</div>
        </div>
      </footer>
    </div>
  );
};
