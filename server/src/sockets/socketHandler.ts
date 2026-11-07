import { Server, Socket } from 'socket.io';
import { RoomManager } from '../managers/roomManager.js';
import { GameType, DrawStroke } from '../types/index.js';

export function setupSocketHandlers(io: Server, roomManager: RoomManager) {
  // Room timer ticker map
  const activeTimers: Map<string, NodeJS.Timeout> = new Map();

  function broadcastRoomState(roomCode: string) {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    for (const player of Object.values(room.players)) {
      if (player.socketId) {
        const playerState = roomManager.getSanitizedRoomState(roomCode, player.id);
        io.to(player.socketId).emit('room_state_update', playerState);
      }
    }
  }

  function startRoomTimer(roomCode: string) {
    // Clear any existing timer for this room
    if (activeTimers.has(roomCode)) {
      clearInterval(activeTimers.get(roomCode)!);
      activeTimers.delete(roomCode);
    }

    const interval = setInterval(() => {
      const room = roomManager.getRoom(roomCode);
      const gameInstance = roomManager.getActiveGame(roomCode);

      if (!room || !gameInstance || room.status !== 'IN_GAME') {
        clearInterval(interval);
        activeTimers.delete(roomCode);
        return;
      }

      const playerNicknames: Record<string, string> = {};
      Object.values(room.players).forEach((p) => (playerNicknames[p.id] = p.nickname));

      // Handle timer per game engine
      switch (gameInstance.type) {
        case 'SECRET_AGENT': {
          const engine = gameInstance.engine;
          if (engine.state.timeRemaining > 0) {
            engine.state.timeRemaining -= 1;
            io.to(roomCode).emit('timer_tick', { timeRemaining: engine.state.timeRemaining });
          } else {
            // Time expired -> advance phase
            const { shouldEndGame } = engine.nextPhase();
            if (shouldEndGame) {
              const { winner } = roomManager.endGame(roomCode);
              io.to(roomCode).emit('game_ended', { winner, leaderboard: room.sessionLeaderboard });
            } else {
              broadcastRoomState(roomCode);
            }
          }
          break;
        }

        case 'FAKE_ANSWER': {
          const engine = gameInstance.engine;
          if (engine.state.timeRemaining > 0) {
            engine.state.timeRemaining -= 1;
            io.to(roomCode).emit('timer_tick', { timeRemaining: engine.state.timeRemaining });
          } else {
            // Time expired
            if (engine.state.phase === 'WRITING') {
              engine.prepareVotingPhase(playerNicknames);
              broadcastRoomState(roomCode);
            } else if (engine.state.phase === 'VOTING') {
              const { scoresGained } = engine.calculateRevealResults(playerNicknames);
              roomManager.applyScoreUpdates(roomCode, scoresGained);
              broadcastRoomState(roomCode);
            } else if (engine.state.phase === 'REVEAL') {
              const { shouldEndGame } = engine.nextRound();
              if (shouldEndGame) {
                const { winner } = roomManager.endGame(roomCode);
                io.to(roomCode).emit('game_ended', { winner, leaderboard: room.sessionLeaderboard });
              } else {
                broadcastRoomState(roomCode);
              }
            }
          }
          break;
        }

        case 'QUICK_DRAW': {
          const engine = gameInstance.engine;
          if (engine.state.timeRemaining > 0) {
            engine.state.timeRemaining -= 1;
            io.to(roomCode).emit('timer_tick', { timeRemaining: engine.state.timeRemaining });
          } else {
            if (engine.state.phase === 'SELECTING') {
              engine.autoSelectFallbackWord();
              broadcastRoomState(roomCode);
            } else if (engine.state.phase === 'DRAWING') {
              engine.revealPhase();
              broadcastRoomState(roomCode);
            } else if (engine.state.phase === 'REVEAL') {
              const { shouldEndGame } = engine.nextRound(playerNicknames);
              if (shouldEndGame) {
                const { winner } = roomManager.endGame(roomCode);
                io.to(roomCode).emit('game_ended', { winner, leaderboard: room.sessionLeaderboard });
              } else {
                broadcastRoomState(roomCode);
              }
            }
          }
          break;
        }

        case 'WHO_KNOWS_ME': {
          const engine = gameInstance.engine;
          if (engine.state.timeRemaining > 0) {
            engine.state.timeRemaining -= 1;
            io.to(roomCode).emit('timer_tick', { timeRemaining: engine.state.timeRemaining });
          } else {
            if (engine.state.phase === 'ANSWERING') {
              const { scoresGained } = engine.calculateReveal(playerNicknames);
              roomManager.applyScoreUpdates(roomCode, scoresGained);
              broadcastRoomState(roomCode);
            } else if (engine.state.phase === 'REVEAL') {
              const { shouldEndGame } = engine.nextRound(playerNicknames);
              if (shouldEndGame) {
                const { winner } = roomManager.endGame(roomCode);
                io.to(roomCode).emit('game_ended', { winner, leaderboard: room.sessionLeaderboard });
              } else {
                broadcastRoomState(roomCode);
              }
            }
          }
          break;
        }

        case 'SURVIVAL_VOTE': {
          const engine = gameInstance.engine;
          if (engine.state.timeRemaining > 0) {
            engine.state.timeRemaining -= 1;
            io.to(roomCode).emit('timer_tick', { timeRemaining: engine.state.timeRemaining });
          } else {
            if (engine.state.phase === 'VOTING') {
              const { scoresGained } = engine.calculateConsequences(playerNicknames);
              roomManager.applyScoreUpdates(roomCode, scoresGained);
              broadcastRoomState(roomCode);
            } else if (engine.state.phase === 'CONSEQUENCE') {
              const { shouldEndGame } = engine.nextRound();
              if (shouldEndGame) {
                const { winner } = roomManager.endGame(roomCode);
                io.to(roomCode).emit('game_ended', { winner, leaderboard: room.sessionLeaderboard });
              } else {
                broadcastRoomState(roomCode);
              }
            }
          }
          break;
        }

        case 'REACTION_BATTLE': {
          const engine = gameInstance.engine;
          if (engine.state.phase === 'WAITING') {
            // Signal countdown is randomized! Handled by timeout, but decrement timeRemaining for fallback
            if (engine.state.timeRemaining > 0) engine.state.timeRemaining -= 1;
          } else if (engine.state.phase === 'SIGNAL') {
            if (engine.state.timeRemaining > 0) {
              engine.state.timeRemaining -= 1;
              io.to(roomCode).emit('timer_tick', { timeRemaining: engine.state.timeRemaining });
            } else {
              // Signal window closed -> calculate round summary
              const { scoresGained } = engine.calculateRoundSummary(playerNicknames);
              roomManager.applyScoreUpdates(roomCode, scoresGained);
              broadcastRoomState(roomCode);
            }
          } else if (engine.state.phase === 'ROUND_SUMMARY') {
            if (engine.state.timeRemaining > 0) {
              engine.state.timeRemaining -= 1;
              io.to(roomCode).emit('timer_tick', { timeRemaining: engine.state.timeRemaining });
            } else {
              const { shouldEndGame } = engine.nextRound();
              if (shouldEndGame) {
                const { winner } = roomManager.endGame(roomCode);
                io.to(roomCode).emit('game_ended', { winner, leaderboard: room.sessionLeaderboard });
              } else {
                broadcastRoomState(roomCode);
                scheduleReactionSignal(roomCode);
              }
            }
          }
          break;
        }
      }
    }, 1000);

    activeTimers.set(roomCode, interval);
  }

  function scheduleReactionSignal(roomCode: string) {
    const gameInstance = roomManager.getActiveGame(roomCode);
    if (!gameInstance || gameInstance.type !== 'REACTION_BATTLE') return;

    const delay = gameInstance.engine.getSignalDelayMs();
    setTimeout(() => {
      const room = roomManager.getRoom(roomCode);
      const active = roomManager.getActiveGame(roomCode);
      if (!room || !active || active.type !== 'REACTION_BATTLE' || active.engine.state.phase !== 'WAITING') {
        return;
      }
      const signalInfo = active.engine.triggerSignal();
      io.to(roomCode).emit('reaction_signal_triggered', signalInfo);
      broadcastRoomState(roomCode);
    }, delay);
  }

  io.on('connection', (socket: Socket) => {
    // 0. HEARTBEAT / KEEP-ALIVE / RESYNC
    socket.on('player_ping', (data: { roomCode: string; playerId: string }) => {
      if (!data?.roomCode || !data?.playerId) return;
      const room = roomManager.getRoom(data.roomCode);
      if (!room) return;

      const player = room.players[data.playerId];
      if (player) {
        player.lastActive = Date.now();
        const wasDisconnected = !player.isConnected || player.socketId !== socket.id;
        player.isConnected = true;
        player.socketId = socket.id;
        roomManager.registerSocket(socket.id, room.code, player.id);
        socket.join(room.code);

        if (wasDisconnected) {
          broadcastRoomState(room.code);
        }
      }
    });

    // 1. CREATE ROOM
    socket.on('create_room', (data: { player: { id: string; nickname: string; avatar: string; color: string }; initialGame?: GameType }) => {
      try {
        const { room, player } = roomManager.createRoom(data.player, socket.id, data.initialGame || 'SECRET_AGENT');
        socket.join(room.code);
        socket.emit('room_created', { roomCode: room.code, player });
        broadcastRoomState(room.code);
      } catch (err: any) {
        socket.emit('error_message', { message: err.message || 'Failed to create room' });
      }
    });

    // 2. JOIN ROOM
    socket.on('join_room', (data: { roomCode: string; player: { id: string; nickname: string; avatar: string; color: string } }) => {
      try {
        const result = roomManager.joinRoom(data.roomCode, data.player, socket.id);
        if (!result.success || !result.room || !result.player) {
          socket.emit('error_message', { message: result.error || 'Failed to join room' });
          return;
        }

        socket.join(result.room.code);
        socket.emit('room_joined', {
          roomCode: result.room.code,
          player: result.player,
          isReconnect: result.isReconnect,
        });

        // Notify others
        socket.to(result.room.code).emit('player_joined', { player: result.player });
        broadcastRoomState(result.room.code);
      } catch (err: any) {
        socket.emit('error_message', { message: err.message || 'Error joining room' });
      }
    });

    // 3. TOGGLE READY
    socket.on('player_ready', () => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      roomManager.toggleReady(info.room.code, info.player.id);
      broadcastRoomState(info.room.code);
    });

    // 4. SELECT GAME (Host only)
    socket.on('game_selected', (data: { gameType: GameType }) => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      const success = roomManager.selectGame(info.room.code, info.player.id, data.gameType);
      if (success) {
        io.to(info.room.code).emit('game_changed', { gameType: data.gameType });
        broadcastRoomState(info.room.code);
      }
    });

    // 4b. UPDATE GAME SETTINGS (Host only)
    socket.on('update_game_settings', (data: { settings: { quickDrawRounds?: number } }) => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      const success = roomManager.updateGameSettings(info.room.code, info.player.id, data.settings);
      if (success) {
        broadcastRoomState(info.room.code);
      }
    });

    // 5. START GAME (Host only)
    socket.on('start_game', () => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      const result = roomManager.startGame(info.room.code, info.player.id);
      if (!result.success) {
        socket.emit('error_message', { message: result.error || 'Cannot start game' });
        return;
      }

      io.to(info.room.code).emit('game_started', {
        selectedGame: info.room.selectedGame,
      });

      broadcastRoomState(info.room.code);
      startRoomTimer(info.room.code);

      if (info.room.selectedGame === 'REACTION_BATTLE') {
        scheduleReactionSignal(info.room.code);
      }
    });

    // --- GAME SPECIFIC ACTIONS ---

    // GAME 1: SECRET AGENT
    socket.on('claim_mission', () => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      const activeGame = roomManager.getActiveGame(info.room.code);
      if (!activeGame || activeGame.type !== 'SECRET_AGENT') return;

      const claim = activeGame.engine.claimMission(info.player.id, info.player.nickname);
      if (claim) {
        io.to(info.room.code).emit('mission_claimed', claim);
        broadcastRoomState(info.room.code);
      }
    });

    socket.on('challenge_claim', (data: { claimId: string }) => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      const activeGame = roomManager.getActiveGame(info.room.code);
      if (!activeGame || activeGame.type !== 'SECRET_AGENT') return;

      const ok = activeGame.engine.challengeClaim(data.claimId, info.player.id, info.player.nickname);
      if (ok) {
        io.to(info.room.code).emit('claim_challenged', { claimId: data.claimId, challenger: info.player.nickname });
        broadcastRoomState(info.room.code);
      }
    });

    socket.on('resolve_claim', (data: { claimId: string; verified: boolean }) => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info || !info.player.isHost) return;
      const activeGame = roomManager.getActiveGame(info.room.code);
      if (!activeGame || activeGame.type !== 'SECRET_AGENT') return;

      const result = activeGame.engine.resolveClaim(data.claimId, data.verified);
      if (result) {
        if (result.points > 0) {
          roomManager.applyScoreUpdates(info.room.code, { [result.claim.playerId]: result.points });
        }
        broadcastRoomState(info.room.code);
      }
    });

    // GAME 2: FAKE ANSWER
    socket.on('submit_bluff', (data: { text: string }) => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      const activeGame = roomManager.getActiveGame(info.room.code);
      if (!activeGame || activeGame.type !== 'FAKE_ANSWER') return;

      const ok = activeGame.engine.submitBluff(info.player.id, data.text);
      if (ok) {
        if (activeGame.engine.allBluffsSubmitted()) {
          const nicknames: Record<string, string> = {};
          Object.values(info.room.players).forEach((p) => (nicknames[p.id] = p.nickname));
          activeGame.engine.prepareVotingPhase(nicknames);
        }
        broadcastRoomState(info.room.code);
      }
    });

    socket.on('submit_fake_vote', (data: { choiceId: string }) => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      const activeGame = roomManager.getActiveGame(info.room.code);
      if (!activeGame || activeGame.type !== 'FAKE_ANSWER') return;

      const ok = activeGame.engine.submitVote(info.player.id, data.choiceId);
      if (ok) {
        if (activeGame.engine.allVotesSubmitted()) {
          const nicknames: Record<string, string> = {};
          Object.values(info.room.players).forEach((p) => (nicknames[p.id] = p.nickname));
          const { scoresGained } = activeGame.engine.calculateRevealResults(nicknames);
          roomManager.applyScoreUpdates(info.room.code, scoresGained);
        }
        broadcastRoomState(info.room.code);
      }
    });

    // GAME 3: QUICK DRAW
    socket.on('select_drawing_word', (data: { word: string }) => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      const activeGame = roomManager.getActiveGame(info.room.code);
      if (!activeGame || activeGame.type !== 'QUICK_DRAW') return;

      if (activeGame.engine.state.drawerId === info.player.id) {
        const ok = activeGame.engine.selectWord(data.word);
        if (ok) {
          broadcastRoomState(info.room.code);
        }
      }
    });

    socket.on('draw_stroke', (stroke: DrawStroke) => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      const activeGame = roomManager.getActiveGame(info.room.code);
      if (!activeGame || activeGame.type !== 'QUICK_DRAW') return;

      // Only drawer can send strokes
      if (activeGame.engine.state.drawerId === info.player.id && activeGame.engine.state.phase === 'DRAWING') {
        activeGame.engine.addStroke(stroke);
        socket.to(info.room.code).emit('draw_stroke', stroke);
      }
    });

    socket.on('undo_stroke', () => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      const activeGame = roomManager.getActiveGame(info.room.code);
      if (!activeGame || activeGame.type !== 'QUICK_DRAW') return;

      if (activeGame.engine.state.drawerId === info.player.id && activeGame.engine.state.phase === 'DRAWING') {
        const ok = activeGame.engine.undoLastStroke();
        if (ok) {
          io.to(info.room.code).emit('stroke_undone', { strokes: activeGame.engine.state.strokes });
        }
      }
    });

    socket.on('clear_canvas', () => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      const activeGame = roomManager.getActiveGame(info.room.code);
      if (!activeGame || activeGame.type !== 'QUICK_DRAW') return;

      if (activeGame.engine.state.drawerId === info.player.id) {
        activeGame.engine.clearCanvas();
        io.to(info.room.code).emit('clear_canvas');
      }
    });

    socket.on('submit_guess', (data: { text: string }) => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      const activeGame = roomManager.getActiveGame(info.room.code);
      if (!activeGame || activeGame.type !== 'QUICK_DRAW') return;

      const result = activeGame.engine.processGuess(info.player.id, info.player.nickname, data.text);

      if (result.isCorrect) {
        if (result.pointsAwarded) {
          roomManager.applyScoreUpdates(info.room.code, {
            [result.pointsAwarded.playerId]: result.pointsAwarded.points,
          });
        }
        if (result.drawerBonus) {
          roomManager.applyScoreUpdates(info.room.code, {
            [result.drawerBonus.drawerId]: result.drawerBonus.points,
          });
        }
        io.to(info.room.code).emit('new_guess', result.guess);

        if (result.allGuessed) {
          activeGame.engine.revealPhase();
        }
        broadcastRoomState(info.room.code);
      } else {
        if (result.isClose) {
          socket.emit('guess_close_hint', { message: 'You are so close!' });
        }
        io.to(info.room.code).emit('new_guess', result.guess);
      }
    });

    // GAME 4: WHO KNOWS ME BEST?
    socket.on('submit_who_knows_answer', (data: { answer: string }) => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      const activeGame = roomManager.getActiveGame(info.room.code);
      if (!activeGame || activeGame.type !== 'WHO_KNOWS_ME') return;

      const ok = activeGame.engine.submitSpotlightAnswer(info.player.id, data.answer);
      if (ok) {
        if (activeGame.engine.allSubmitted()) {
          const nicknames: Record<string, string> = {};
          Object.values(info.room.players).forEach((p) => (nicknames[p.id] = p.nickname));
          const { scoresGained } = activeGame.engine.calculateReveal(nicknames);
          roomManager.applyScoreUpdates(info.room.code, scoresGained);
        }
        broadcastRoomState(info.room.code);
      }
    });

    socket.on('submit_who_knows_prediction', (data: { prediction: string }) => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      const activeGame = roomManager.getActiveGame(info.room.code);
      if (!activeGame || activeGame.type !== 'WHO_KNOWS_ME') return;

      const ok = activeGame.engine.submitPrediction(info.player.id, data.prediction);
      if (ok) {
        if (activeGame.engine.allSubmitted()) {
          const nicknames: Record<string, string> = {};
          Object.values(info.room.players).forEach((p) => (nicknames[p.id] = p.nickname));
          const { scoresGained } = activeGame.engine.calculateReveal(nicknames);
          roomManager.applyScoreUpdates(info.room.code, scoresGained);
        }
        broadcastRoomState(info.room.code);
      }
    });

    // GAME 5: SURVIVAL VOTE
    socket.on('submit_survival_vote', (data: { optionId: string }) => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      const activeGame = roomManager.getActiveGame(info.room.code);
      if (!activeGame || activeGame.type !== 'SURVIVAL_VOTE') return;

      const ok = activeGame.engine.submitVote(info.player.id, data.optionId);
      if (ok) {
        if (activeGame.engine.allVoted()) {
          const nicknames: Record<string, string> = {};
          Object.values(info.room.players).forEach((p) => (nicknames[p.id] = p.nickname));
          const { scoresGained } = activeGame.engine.calculateConsequences(nicknames);
          roomManager.applyScoreUpdates(info.room.code, scoresGained);
        }
        broadcastRoomState(info.room.code);
      }
    });

    // GAME 6: REACTION BATTLE
    socket.on('tap_reaction', () => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;
      const activeGame = roomManager.getActiveGame(info.room.code);
      if (!activeGame || activeGame.type !== 'REACTION_BATTLE') return;

      const res = activeGame.engine.recordTap(info.player.id);
      if (res.status !== 'IGNORED') {
        socket.emit('reaction_registered', res);
        if (activeGame.engine.allPlayersResponded()) {
          const nicknames: Record<string, string> = {};
          Object.values(info.room.players).forEach((p) => (nicknames[p.id] = p.nickname));
          const { scoresGained } = activeGame.engine.calculateRoundSummary(nicknames);
          roomManager.applyScoreUpdates(info.room.code, scoresGained);
        }
        broadcastRoomState(info.room.code);
      }
    });

    // LOBBY & REPLAY CONTROLS
    socket.on('return_to_lobby', () => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info || !info.player.isHost) return;
      const ok = roomManager.returnToLobby(info.room.code, info.player.id);
      if (ok) {
        io.to(info.room.code).emit('returned_to_lobby');
        broadcastRoomState(info.room.code);
      }
    });

    socket.on('rematch', () => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info || !info.player.isHost) return;
      const ok = roomManager.rematch(info.room.code, info.player.id);
      if (ok) {
        io.to(info.room.code).emit('rematch_started');
        broadcastRoomState(info.room.code);
      }
    });

    // VOTE KICK
    socket.on('initiate_vote_kick', (data: { targetPlayerId: string }) => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;

      const res = roomManager.startVoteKick(info.room.code, info.player.id, data.targetPlayerId);
      if (!res.success) {
        socket.emit('error_message', { message: res.error || 'Failed to start vote kick' });
        return;
      }

      const vk = res.voteState;
      if (vk && vk.yesVotes.length >= Math.floor(vk.eligibleVoters.length / 2) + 1) {
        io.to(info.room.code).emit('vote_kick_resolved', {
          passed: true,
          targetNickname: vk.targetNickname,
        });
        broadcastRoomState(info.room.code);
        return;
      }

      io.to(info.room.code).emit('vote_kick_started', res.voteState);
      broadcastRoomState(info.room.code);
    });

    socket.on('cast_kick_vote', (data: { vote: 'yes' | 'no' }) => {
      const info = roomManager.getPlayerBySocket(socket.id);
      if (!info) return;

      const res = roomManager.castVoteKick(info.room.code, info.player.id, data.vote);
      if (!res.success) {
        socket.emit('error_message', { message: res.error || 'Cannot cast vote' });
        return;
      }

      if (res.resolved) {
        io.to(info.room.code).emit('vote_kick_resolved', {
          passed: res.passed,
          targetNickname: res.targetPlayer?.nickname,
        });

        if (res.passed && res.targetPlayer) {
          if (res.targetPlayer.socketId) {
            io.to(res.targetPlayer.socketId).emit('kicked_from_room', {
              message: 'You have been removed from the room by vote.',
            });
          }
        }
        broadcastRoomState(info.room.code);
      } else {
        io.to(info.room.code).emit('vote_kick_updated', res.voteState);
        broadcastRoomState(info.room.code);
      }
    });

    // LEAVE ROOM
    socket.on('leave_room', () => {
      const result = roomManager.leaveRoom(socket.id);
      if (result) {
        socket.leave(result.room.code);
        io.to(result.room.code).emit('player_left', { playerId: result.player.id });
        broadcastRoomState(result.room.code);
      }
    });

    // DISCONNECT
    socket.on('disconnect', () => {
      const result = roomManager.handleDisconnect(socket.id);
      if (result && !result.roomEmpty) {
        io.to(result.room.code).emit('player_disconnected', { playerId: result.player.id });
        if (result.hostMigrated) {
          io.to(result.room.code).emit('host_migrated', { newHostId: result.room.hostId });
        }
        broadcastRoomState(result.room.code);
      }
    });
  });
}

