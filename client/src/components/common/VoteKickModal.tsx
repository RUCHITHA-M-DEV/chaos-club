import React from 'react';
import { VoteKickState, Player } from '../../types';
import { UserX, Check, X, ShieldAlert, Clock } from 'lucide-react';
import { sound } from '../../services/sound';

interface VoteKickModalProps {
  voteKick: VoteKickState;
  currentPlayer: Player;
  onVote: (vote: 'yes' | 'no') => void;
}

export const VoteKickModal: React.FC<VoteKickModalProps> = ({
  voteKick,
  currentPlayer,
  onVote,
}) => {
  const isTarget = currentPlayer.id === voteKick.targetId;
  const hasVotedYes = voteKick.yesVotes.includes(currentPlayer.id);
  const hasVotedNo = voteKick.noVotes.includes(currentPlayer.id);
  const hasVoted = hasVotedYes || hasVotedNo;
  const isEligible = voteKick.eligibleVoters.includes(currentPlayer.id);

  const totalEligible = voteKick.eligibleVoters.length;
  const neededYes = Math.floor(totalEligible / 2) + 1;
  const secondsLeft = Math.max(0, Math.ceil((voteKick.expiresAt - Date.now()) / 1000));

  const handleVote = (vote: 'yes' | 'no') => {
    sound.playClick();
    onVote(vote);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-card max-w-md w-full rounded-3xl p-6 border-2 border-rose-500/50 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-rose-500/20 blur-2xl rounded-full pointer-events-none" />

        {/* Header Badge & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
            <UserX className="w-7 h-7" />
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs uppercase font-extrabold tracking-widest text-rose-400">
            <ShieldAlert className="w-4 h-4" />
            <span>Vote Kick Active</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white">
            Kick <span className="text-rose-400 underline decoration-rose-500/60">{voteKick.targetNickname}</span>?
          </h3>

          <p className="text-xs text-gray-300">
            Started by <strong className="text-purple-300">{voteKick.initiatedByNickname}</strong>.
            Requires majority ({neededYes} out of {totalEligible}) to pass.
          </p>
        </div>

        {/* Voting Progress Counters */}
        <div className="p-4 rounded-2xl bg-surface/80 border border-purple-500/20 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Yes: {voteKick.yesVotes.length}
            </span>
            <span className="text-rose-400 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> No: {voteKick.noVotes.length}
            </span>
            <span className="text-gray-400 flex items-center gap-1 text-[11px]">
              <Clock className="w-3 h-3 text-amber-400" /> {secondsLeft}s left
            </span>
          </div>

          {/* Dual Progress Bar */}
          <div className="w-full h-3 rounded-full bg-surfaceLight overflow-hidden flex shadow-inner">
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{
                width: `${totalEligible > 0 ? (voteKick.yesVotes.length / totalEligible) * 100 : 0}%`,
              }}
            />
            <div
              className="bg-rose-500 transition-all duration-300"
              style={{
                width: `${totalEligible > 0 ? (voteKick.noVotes.length / totalEligible) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Action Controls */}
        {isTarget ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center text-amber-300 text-xs font-bold animate-pulse">
            You are the subject of this vote kick. Awaiting other players' decisions...
          </div>
        ) : hasVoted ? (
          <div className="p-4 rounded-2xl bg-surface border border-purple-500/30 text-center text-gray-300 text-xs font-bold flex items-center justify-center gap-2">
            <span>You voted {hasVotedYes ? 'YES' : 'NO'}. Waiting for other players...</span>
          </div>
        ) : isEligible ? (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleVote('no')}
              className="py-3 px-4 rounded-2xl bg-surface border border-purple-500/30 hover:border-purple-400 text-gray-200 hover:text-white font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow"
            >
              <X className="w-4 h-4 text-gray-400" />
              <span>No, Keep</span>
            </button>

            <button
              type="button"
              onClick={() => handleVote('yes')}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
            >
              <Check className="w-4 h-4" />
              <span>Yes, Kick</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

