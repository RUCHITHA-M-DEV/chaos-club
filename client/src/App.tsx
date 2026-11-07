import React, { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from './services/socket';
import { sound } from './services/sound';
import { Header } from './components/common/Header';
import { LandingPage } from './components/landing/LandingPage';
import { PlayerEntry } from './components/entry/PlayerEntry';
import { RoomLobby } from './components/lobby/RoomLobby';
import { WinnerModal } from './components/common/WinnerModal';
import { VoteKickModal } from './components/common/VoteKickModal';
import { SecretAgentView } from './components/games/SecretAgentView';
import { FakeAnswerView } from './components/games/FakeAnswerView';
import { QuickDrawView } from './components/games/QuickDrawView';
import { WhoKnowsMeView } from './components/games/WhoKnowsMeView';
import { SurvivalVoteView } from './components/games/SurvivalVoteView';
import { ReactionBattleView } from './components/games/ReactionBattleView';
import { Player, SanitizedRoomState, GameType, DrawStroke, VoteKickState } from './types';

export function App() {
  const [view, setView] = useState<'landing' | 'entry' | 'lobby' | 'game'>('landing');
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [room, setRoom] = useState<SanitizedRoomState | null>(null);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [initialRoomCode, setInitialRoomCode] = useState('');
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  // Active state refs to avoid stale closures in event listeners
  const roomRef = useRef<SanitizedRoomState | null>(null);
  const currentPlayerRef = useRef<Player | null>(null);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    currentPlayerRef.current = currentPlayer;
  }, [currentPlayer]);

  // Re-synchronize or rejoin current room
  const attemptRejoin = useCallback(() => {
    const activeRoomCode = roomRef.current?.code || sessionStorage.getItem('chaos_active_room');
    const storedPlayerStr = sessionStorage.getItem('chaos_player_info');
    const activePlayer =
      currentPlayerRef.current || (storedPlayerStr ? JSON.parse(storedPlayerStr) : null);

    if (activeRoomCode && activePlayer) {
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit('join_room', {
        roomCode: activeRoomCode,
        player: {
          id: activePlayer.id,
          nickname: activePlayer.nickname,
          avatar: activePlayer.avatar,
          color: activePlayer.color,
        },
      });
      socket.emit('player_ping', {
        roomCode: activeRoomCode,
        playerId: activePlayer.id,
      });
    }
  }, []);

  // Check URL query parameters for room invitation (?room=CHAOS1) or restore session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setInitialRoomCode(roomParam.toUpperCase());
      setView('entry');
    } else {
      // Auto-recover session if user refreshed or restored tab
      const savedRoom = sessionStorage.getItem('chaos_active_room');
      const savedPlayerStr = sessionStorage.getItem('chaos_player_info');
      if (savedRoom && savedPlayerStr) {
        try {
          const parsed = JSON.parse(savedPlayerStr);
          setCurrentPlayer(parsed);
          currentPlayerRef.current = parsed;
          setView('lobby');
          attemptRejoin();
        } catch {
          sessionStorage.removeItem('chaos_active_room');
          sessionStorage.removeItem('chaos_player_info');
        }
      }
    }
  }, [attemptRejoin]);

  // Window focus & mobile app visibility change listener (e.g. returning from WhatsApp share)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        attemptRejoin();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [attemptRejoin]);

  // Periodic heartbeat / ping every 3 seconds while in a room
  useEffect(() => {
    const timer = setInterval(() => {
      const activeRoom = roomRef.current?.code || sessionStorage.getItem('chaos_active_room');
      const activePlayer = currentPlayerRef.current;
      if (activeRoom && activePlayer?.id) {
        if (socket.connected) {
          socket.emit('player_ping', {
            roomCode: activeRoom,
            playerId: activePlayer.id,
          });
        } else {
          socket.connect();
        }
      }
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  // Socket Connection & Event Listeners (mounted once)
  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      attemptRejoin();
    };

    const onDisconnect = () => setIsConnected(false);

    const onRoomCreated = (data: { roomCode: string; player: Player }) => {
      sound.playCorrect();
      setCurrentPlayer(data.player);
      currentPlayerRef.current = data.player;
      sessionStorage.setItem('chaos_active_room', data.roomCode);
      sessionStorage.setItem(
        'chaos_player_info',
        JSON.stringify({
          id: data.player.id,
          nickname: data.player.nickname,
          avatar: data.player.avatar,
          color: data.player.color,
        })
      );
      setView('lobby');
    };

    const onRoomJoined = (data: { roomCode: string; player: Player; isReconnect: boolean }) => {
      sound.playCorrect();
      setCurrentPlayer(data.player);
      currentPlayerRef.current = data.player;
      sessionStorage.setItem('chaos_active_room', data.roomCode);
      sessionStorage.setItem(
        'chaos_player_info',
        JSON.stringify({
          id: data.player.id,
          nickname: data.player.nickname,
          avatar: data.player.avatar,
          color: data.player.color,
        })
      );
      setView('lobby');
    };

    const onRoomStateUpdate = (state: SanitizedRoomState) => {
      setRoom(state);
      roomRef.current = state;
      sessionStorage.setItem('chaos_active_room', state.code);

      // Keep currentPlayer synced (especially isHost, score, isConnected)
      const myId = currentPlayerRef.current?.id || localStorage.getItem('chaos_player_id');
      if (myId && state.players[myId]) {
        setCurrentPlayer(state.players[myId]);
        currentPlayerRef.current = state.players[myId];
      }

      if (state.status === 'IN_GAME') {
        setView('game');
        setShowWinnerModal(false);
      } else if (state.status === 'GAME_OVER') {
        setShowWinnerModal(true);
      } else if (state.status === 'LOBBY') {
        setView('lobby');
        setShowWinnerModal(false);
      }
    };

    const onGameStarted = () => {
      sound.playClick();
      setShowWinnerModal(false);
      setView('game');
    };

    const onGameEnded = () => {
      sound.playVictory();
      setShowWinnerModal(true);
    };

    const onReturnedToLobby = () => {
      sound.playClick();
      setShowWinnerModal(false);
      setView('lobby');
    };

    const onRematchStarted = () => {
      sound.playClick();
      setShowWinnerModal(false);
      setView('lobby');
    };

    const onErrorMessage = (data: { message: string }) => {
      sound.playWrong();
      setErrorMessage(data.message);
      setTimeout(() => setErrorMessage(null), 4000);
    };

    // Vote kick event handlers
    const onVoteKickStarted = (voteState: VoteKickState) => {
      sound.playWrong();
      setRoom((prev) => (prev ? { ...prev, activeVoteKick: voteState } : prev));
    };

    const onVoteKickUpdated = (voteState: VoteKickState) => {
      setRoom((prev) => (prev ? { ...prev, activeVoteKick: voteState } : prev));
    };

    const onVoteKickResolved = (data: { passed: boolean; targetNickname?: string }) => {
      if (data.passed) {
        sound.playVictory();
        setInfoMessage(`👢 Vote Kick PASSED: ${data.targetNickname || 'Player'} was removed.`);
      } else {
        sound.playWrong();
        setInfoMessage(`❌ Vote Kick FAILED against ${data.targetNickname || 'Player'}.`);
      }
      setTimeout(() => setInfoMessage(null), 4500);
      setRoom((prev) => (prev ? { ...prev, activeVoteKick: null } : prev));
    };

    const onKickedFromRoom = (data: { message: string }) => {
      sound.playWrong();
      sessionStorage.removeItem('chaos_active_room');
      sessionStorage.removeItem('chaos_player_info');
      setRoom(null);
      roomRef.current = null;
      setView('landing');
      setErrorMessage(data.message || 'You were kicked from the room by vote.');
      setTimeout(() => setErrorMessage(null), 5000);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room_created', onRoomCreated);
    socket.on('room_joined', onRoomJoined);
    socket.on('room_state_update', onRoomStateUpdate);
    socket.on('game_started', onGameStarted);
    socket.on('game_ended', onGameEnded);
    socket.on('returned_to_lobby', onReturnedToLobby);
    socket.on('rematch_started', onRematchStarted);
    socket.on('error_message', onErrorMessage);

    socket.on('vote_kick_started', onVoteKickStarted);
    socket.on('vote_kick_updated', onVoteKickUpdated);
    socket.on('vote_kick_resolved', onVoteKickResolved);
    socket.on('kicked_from_room', onKickedFromRoom);

    // If socket is already connected when listeners are bound, attempt immediate rejoin
    if (socket.connected) {
      attemptRejoin();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_created', onRoomCreated);
      socket.off('room_joined', onRoomJoined);
      socket.off('room_state_update', onRoomStateUpdate);
      socket.off('game_started', onGameStarted);
      socket.off('game_ended', onGameEnded);
      socket.off('returned_to_lobby', onReturnedToLobby);
      socket.off('rematch_started', onRematchStarted);
      socket.off('error_message', onErrorMessage);

      socket.off('vote_kick_started', onVoteKickStarted);
      socket.off('vote_kick_updated', onVoteKickUpdated);
      socket.off('vote_kick_resolved', onVoteKickResolved);
      socket.off('kicked_from_room', onKickedFromRoom);
    };
  }, [attemptRejoin]);

  // Handler functions
  const handleCreateRoom = (playerData: { nickname: string; avatar: string; color: string }) => {
    let playerId = localStorage.getItem('chaos_player_id');
    if (!playerId) {
      playerId = 'p_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('chaos_player_id', playerId);
    }

    sessionStorage.setItem(
      'chaos_player_info',
      JSON.stringify({
        id: playerId,
        nickname: playerData.nickname,
        avatar: playerData.avatar,
        color: playerData.color,
      })
    );

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('create_room', {
      player: {
        id: playerId,
        nickname: playerData.nickname,
        avatar: playerData.avatar,
        color: playerData.color,
      },
      initialGame: 'SECRET_AGENT',
    });
  };

  const handleJoinRoom = (
    roomCode: string,
    playerData: { nickname: string; avatar: string; color: string }
  ) => {
    let playerId = localStorage.getItem('chaos_player_id');
    if (!playerId) {
      playerId = 'p_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('chaos_player_id', playerId);
    }

    const cleanCode = roomCode.toUpperCase().trim();
    sessionStorage.setItem('chaos_active_room', cleanCode);
    sessionStorage.setItem(
      'chaos_player_info',
      JSON.stringify({
        id: playerId,
        nickname: playerData.nickname,
        avatar: playerData.avatar,
        color: playerData.color,
      })
    );

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join_room', {
      roomCode: cleanCode,
      player: {
        id: playerId,
        nickname: playerData.nickname,
        avatar: playerData.avatar,
        color: playerData.color,
      },
    });
  };

  const handleToggleReady = () => {
    socket.emit('player_ready');
  };

  const handleSelectGame = (gameType: GameType) => {
    socket.emit('game_selected', { gameType });
  };

  const handleUpdateGameSettings = (settings: { quickDrawRounds?: number }) => {
    socket.emit('update_game_settings', { settings });
  };

  const handleInitiateVoteKick = (targetPlayerId: string) => {
    socket.emit('initiate_vote_kick', { targetPlayerId });
  };

  const handleStartGame = () => {
    socket.emit('start_game');
  };

  const handleLeaveRoom = () => {
    socket.emit('leave_room');
    sessionStorage.removeItem('chaos_active_room');
    sessionStorage.removeItem('chaos_player_info');
    setRoom(null);
    roomRef.current = null;
    setShowWinnerModal(false);
    setView('landing');
  };

  const handleRematch = () => {
    socket.emit('rematch');
  };

  const handleReturnToLobby = () => {
    socket.emit('return_to_lobby');
  };

  // Render current view
  const renderGameView = () => {
    if (!room || !room.gameSession || !currentPlayer) return null;

    const game = room.gameSession;

    switch (game.type) {
      case 'SECRET_AGENT':
        return (
          <SecretAgentView
            state={game.data}
            players={room.players}
            currentPlayer={currentPlayer}
            onClaimMission={() => socket.emit('claim_mission')}
            onChallengeClaim={(claimId) => socket.emit('challenge_claim', { claimId })}
            onResolveClaim={(claimId, verified) =>
              socket.emit('resolve_claim', { claimId, verified })
            }
          />
        );

      case 'FAKE_ANSWER':
        return (
          <FakeAnswerView
            state={game.data}
            players={room.players}
            currentPlayer={currentPlayer}
            onSubmitBluff={(text) => socket.emit('submit_bluff', { text })}
            onSubmitVote={(choiceId) => socket.emit('submit_fake_vote', { choiceId })}
          />
        );

      case 'QUICK_DRAW':
        return (
          <QuickDrawView
            state={game.data}
            players={room.players}
            currentPlayer={currentPlayer}
            onSelectWord={(word) => socket.emit('select_drawing_word', { word })}
            onSendStroke={(stroke: DrawStroke) => socket.emit('draw_stroke', stroke)}
            onUndoStroke={() => socket.emit('undo_stroke')}
            onClearCanvas={() => socket.emit('clear_canvas')}
            onSubmitGuess={(text: string) => socket.emit('submit_guess', { text })}
          />
        );

      case 'WHO_KNOWS_ME':
        return (
          <WhoKnowsMeView
            state={game.data}
            players={room.players}
            currentPlayer={currentPlayer}
            onSubmitAnswer={(answer) => socket.emit('submit_who_knows_answer', { answer })}
            onSubmitPrediction={(prediction) =>
              socket.emit('submit_who_knows_prediction', { prediction })
            }
          />
        );

      case 'SURVIVAL_VOTE':
        return (
          <SurvivalVoteView
            state={game.data}
            players={room.players}
            currentPlayer={currentPlayer}
            onSubmitVote={(optionId) => socket.emit('submit_survival_vote', { optionId })}
          />
        );

      case 'REACTION_BATTLE':
        return (
          <ReactionBattleView
            state={game.data}
            players={room.players}
            currentPlayer={currentPlayer}
            onTapReaction={() => socket.emit('tap_reaction')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-gray-900 dark:text-gray-100 transition-colors duration-300 flex flex-col font-sans">
      <Header
        player={currentPlayer}
        roomCode={room?.code || null}
        isConnected={isConnected}
        onLeaveRoom={handleLeaveRoom}
        onLogoClick={() => {
          if (!room) setView('landing');
        }}
      />

      {errorMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-rose-500/90 text-white font-bold text-sm shadow-2xl backdrop-blur border border-white/20 animate-bounce">
          {errorMessage}
        </div>
      )}

      {infoMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-cyan-600/90 text-white font-bold text-sm shadow-2xl backdrop-blur border border-white/20 animate-fadeIn">
          {infoMessage}
        </div>
      )}

      <main className="flex-1">
        {view === 'landing' && <LandingPage onStartPlaying={() => setView('entry')} />}

        {view === 'entry' && (
          <PlayerEntry
            initialRoomCode={initialRoomCode}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            errorMessage={errorMessage}
          />
        )}

        {view === 'lobby' && room && currentPlayer && (
          <RoomLobby
            room={room}
            currentPlayer={currentPlayer}
            onToggleReady={handleToggleReady}
            onSelectGame={handleSelectGame}
            onUpdateGameSettings={handleUpdateGameSettings}
            onInitiateVoteKick={handleInitiateVoteKick}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {view === 'game' && renderGameView()}
      </main>

      {/* Global Winner & End-of-Game Modal */}
      {showWinnerModal && room && currentPlayer && (
        <WinnerModal
          players={room.players}
          isHost={currentPlayer.isHost}
          onRematch={handleRematch}
          onReturnToLobby={handleReturnToLobby}
        />
      )}

      {/* Active Vote Kick Modal Overlay */}
      {room?.activeVoteKick && currentPlayer && (
        <VoteKickModal
          voteKick={room.activeVoteKick}
          currentPlayer={currentPlayer}
          onVote={(vote) => socket.emit('cast_kick_vote', { vote })}
        />
      )}
    </div>
  );
}

export default App;
