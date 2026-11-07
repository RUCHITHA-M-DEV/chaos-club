import React, { useState, useEffect } from 'react';
import { socket } from './services/socket';
import { sound } from './services/sound';
import { Header } from './components/common/Header';
import { LandingPage } from './components/landing/LandingPage';
import { PlayerEntry } from './components/entry/PlayerEntry';
import { RoomLobby } from './components/lobby/RoomLobby';
import { WinnerModal } from './components/common/WinnerModal';
import { SecretAgentView } from './components/games/SecretAgentView';
import { FakeAnswerView } from './components/games/FakeAnswerView';
import { QuickDrawView } from './components/games/QuickDrawView';
import { WhoKnowsMeView } from './components/games/WhoKnowsMeView';
import { SurvivalVoteView } from './components/games/SurvivalVoteView';
import { ReactionBattleView } from './components/games/ReactionBattleView';
import { Player, SanitizedRoomState, GameType, DrawStroke } from './types';

export function App() {
  const [view, setView] = useState<'landing' | 'entry' | 'lobby' | 'game'>('landing');
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [room, setRoom] = useState<SanitizedRoomState | null>(null);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initialRoomCode, setInitialRoomCode] = useState('');
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  // Check URL query parameters for room invitation (?room=CHAOS1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setInitialRoomCode(roomParam.toUpperCase());
      setView('entry');
    }
  }, []);

  // Socket Connection & Event Listeners
  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      // Auto-reconnect if player had a room
      if (room && currentPlayer) {
        socket.emit('join_room', {
          roomCode: room.code,
          player: {
            id: currentPlayer.id,
            nickname: currentPlayer.nickname,
            avatar: currentPlayer.avatar,
            color: currentPlayer.color,
          },
        });
      }
    };

    const onDisconnect = () => setIsConnected(false);

    const onRoomCreated = (data: { roomCode: string; player: Player }) => {
      sound.playCorrect();
      setCurrentPlayer(data.player);
      setView('lobby');
    };

    const onRoomJoined = (data: { roomCode: string; player: Player; isReconnect: boolean }) => {
      sound.playCorrect();
      setCurrentPlayer(data.player);
      setView('lobby');
    };

    const onRoomStateUpdate = (state: SanitizedRoomState) => {
      setRoom(state);
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
    };
  }, [room, currentPlayer]);

  // Handler functions
  const handleCreateRoom = (playerData: { nickname: string; avatar: string; color: string }) => {
    let playerId = localStorage.getItem('chaos_player_id');
    if (!playerId) {
      playerId = 'p_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('chaos_player_id', playerId);
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

    socket.emit('join_room', {
      roomCode,
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

  const handleStartGame = () => {
    socket.emit('start_game');
  };

  const handleLeaveRoom = () => {
    socket.emit('leave_room');
    setRoom(null);
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
            onResolveClaim={(claimId, verified) => socket.emit('resolve_claim', { claimId, verified })}
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
            onSendStroke={(stroke: DrawStroke) => socket.emit('draw_stroke', stroke)}
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

      <main className="flex-1">
        {view === 'landing' && (
          <LandingPage onStartPlaying={() => setView('entry')} />
        )}

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
    </div>
  );
}

export default App;

