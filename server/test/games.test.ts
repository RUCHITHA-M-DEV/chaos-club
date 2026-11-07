import { test, describe } from 'node:test';
import assert from 'node:assert';
import { RoomManager } from '../src/managers/roomManager.js';
import { SecretAgentGame } from '../src/games/secretAgent.js';
import { FakeAnswerGame } from '../src/games/fakeAnswer.js';
import { QuickDrawGame } from '../src/games/quickDraw.js';
import { WhoKnowsMeGame } from '../src/games/whoKnowsMe.js';
import { SurvivalVoteGame } from '../src/games/survivalVote.js';
import { ReactionBattleGame } from '../src/games/reactionBattle.js';

describe('RoomManager Tests', () => {
  test('creates a room with a 6-character code and assigns host', () => {
    const manager = new RoomManager();
    const { room, player } = manager.createRoom(
      { id: 'p1', nickname: 'ChaosMaster', avatar: '👾', color: '#8B5CF6' },
      'socket-1'
    );

    assert.strictEqual(room.code.length, 6);
    assert.strictEqual(player.isHost, true);
    assert.strictEqual(room.hostId, 'p1');
    assert.strictEqual(room.status, 'LOBBY');
  });

  test('allows other players to join up to max limit', () => {
    const manager = new RoomManager();
    const { room } = manager.createRoom(
      { id: 'p1', nickname: 'Host', avatar: '👑', color: '#EC4899' },
      'socket-1'
    );

    const joinRes = manager.joinRoom(
      room.code,
      { id: 'p2', nickname: 'Guest', avatar: '🦊', color: '#3B82F6' },
      'socket-2'
    );

    assert.strictEqual(joinRes.success, true);
    assert.strictEqual(joinRes.player?.isHost, false);
    assert.strictEqual(Object.keys(room.players).length, 2);
  });

  test('handles player reconnection without duplicate entries', () => {
    const manager = new RoomManager();
    const { room } = manager.createRoom(
      { id: 'p1', nickname: 'Host', avatar: '👑', color: '#EC4899' },
      'socket-1'
    );

    // Simulate disconnect
    manager.handleDisconnect('socket-1');
    assert.strictEqual(room.players['p1'].isConnected, false);

    // Reconnect
    const reconnectRes = manager.joinRoom(
      room.code,
      { id: 'p1', nickname: 'Host', avatar: '👑', color: '#EC4899' },
      'socket-new-1'
    );

    assert.strictEqual(reconnectRes.success, true);
    assert.strictEqual(reconnectRes.isReconnect, true);
    assert.strictEqual(room.players['p1'].isConnected, true);
    assert.strictEqual(room.players['p1'].socketId, 'socket-new-1');
  });
});

describe('Mini-Games Engines Tests', () => {
  test('Secret Agent: assigns private missions and handles claim disputes', () => {
    const game = new SecretAgentGame(['p1', 'p2']);
    const stateP1 = game.getPrivateStateForPlayer('p1');
    const stateP2 = game.getPrivateStateForPlayer('p2');

    assert.ok(stateP1.myMission !== null);
    assert.ok(stateP2.myMission !== null);

    // Missions should be private
    assert.strictEqual(stateP1.allMissionsRevealed, undefined);

    // Advance to ACTIVE phase
    game.nextPhase();
    const claim = game.claimMission('p1', 'Player 1');
    assert.ok(claim !== null);
    assert.strictEqual(claim.status, 'PENDING');

    // p2 challenges claim
    const challenged = game.challengeClaim(claim.id, 'p2', 'Player 2');
    assert.strictEqual(challenged, true);
    assert.strictEqual(claim.status, 'CHALLENGED');

    // Host resolves
    const res = game.resolveClaim(claim.id, true);
    assert.ok(res !== null);
    assert.strictEqual(res.claim.status, 'VERIFIED');
    assert.ok(res.points > 0);
  });

  test('Fake Answer: collects bluffs, prevents self-voting, calculates scores', () => {
    const game = new FakeAnswerGame(['p1', 'p2']);
    game.submitBluff('p1', 'Fake answer from P1');
    game.submitBluff('p2', 'Fake answer from P2');

    game.prepareVotingPhase({ p1: 'Alice', p2: 'Bob' });
    assert.strictEqual(game.state.choices.length, 3); // 1 real + 2 bluffs

    // P1 cannot vote for their own bluff
    const p1Bluff = game.state.choices.find((c) => c.authorId === 'p1');
    assert.ok(p1Bluff);
    const selfVoteRes = game.submitVote('p1', p1Bluff.id);
    assert.strictEqual(selfVoteRes, false);

    // P2 votes for P1's bluff
    game.submitVote('p2', p1Bluff.id);

    // Reveal
    const { scoresGained } = game.calculateRevealResults({ p1: 'Alice', p2: 'Bob' });
    assert.strictEqual(scoresGained['p1'], 60); // P1 fooled P2 (+60 points)
  });

  test('Quick Draw: 1-of-3 word choice, difficulty levels, stroke undo and guess validation', () => {
    const game = new QuickDrawGame(['p1', 'p2', 'p3'], { p1: 'Drawer', p2: 'Guesser1', p3: 'Guesser2' }, 5);
    
    // 1. Initial phase is SELECTING
    assert.strictEqual(game.state.phase, 'SELECTING');
    assert.strictEqual(game.state.wordChoices.length, 3);
    assert.strictEqual(game.state.totalRounds, 5);

    // 3 choices must cover Easy, Medium, Hard
    const diffs = game.state.wordChoices.map((w) => w.difficulty);
    assert.ok(diffs.includes('Easy'));
    assert.ok(diffs.includes('Medium'));
    assert.ok(diffs.includes('Hard'));

    // Drawer can see choices; guessers cannot
    const drawerState = game.getPublicState('p1');
    const guesserState = game.getPublicState('p2');
    assert.ok(drawerState.wordChoices !== null && drawerState.wordChoices.length === 3);
    assert.strictEqual(guesserState.wordChoices, null);
    assert.strictEqual(guesserState.word, null);

    // 2. Drawer selects 1 word
    const chosen = game.state.wordChoices[1].word;
    const ok = game.selectWord(chosen);
    assert.strictEqual(ok, true);
    assert.strictEqual(game.state.phase, 'DRAWING');
    assert.strictEqual(game.state.word, chosen);
    assert.strictEqual(game.state.timeRemaining, 60);

    // 3. Drawing and Undo
    game.addStroke({ x0: 0, y0: 0, x1: 10, y1: 10, color: '#FFFFFF', size: 4, isEraser: false, strokeId: 's1' });
    game.addStroke({ x0: 10, y0: 10, x1: 20, y1: 20, color: '#FFFFFF', size: 4, isEraser: false, strokeId: 's1' });
    game.addStroke({ x0: 20, y0: 20, x1: 30, y1: 30, color: '#EF4444', size: 6, isEraser: false, strokeId: 's2' });
    assert.strictEqual(game.state.strokes.length, 3);

    // Undo removes the last stroke group (strokeId 's2')
    game.undoLastStroke();
    assert.strictEqual(game.state.strokes.length, 2);
    assert.strictEqual(game.state.strokes[1].strokeId, 's1');

    // 4. Guesser guesses correct word
    const res = game.processGuess('p2', 'Guesser1', chosen);
    assert.strictEqual(res.isCorrect, true);
    assert.strictEqual(res.pointsAwarded?.points, 200); // 1st guesser gets 200
    assert.strictEqual(res.drawerBonus?.points, 40); // Drawer gets 40

    // 5. Drawer rotation on next round
    const nextRes = game.nextRound({ p1: 'Drawer', p2: 'Guesser1', p3: 'Guesser2' });
    assert.strictEqual(nextRes.shouldEndGame, false);
    assert.strictEqual(game.state.round, 2);
    assert.strictEqual(game.state.drawerId, 'p2'); // Rotated to next player
    assert.strictEqual(game.state.phase, 'SELECTING');
  });

  test('RoomManager: game settings configuration and Vote Kick system', () => {
    const manager = new RoomManager();
    const { room } = manager.createRoom(
      { id: 'host', nickname: 'HostPlayer', avatar: '👑', color: '#8B5CF6' },
      's-host'
    );
    manager.joinRoom(room.code, { id: 'p2', nickname: 'Player2', avatar: '🦊', color: '#3B82F6' }, 's-p2');
    manager.joinRoom(room.code, { id: 'p3', nickname: 'Player3', avatar: '🦄', color: '#EC4899' }, 's-p3');

    // 1. Host updates Quick Draw rounds
    const updateOk = manager.updateGameSettings(room.code, 'host', { quickDrawRounds: 5 });
    assert.strictEqual(updateOk, true);
    assert.strictEqual(room.gameSettings.quickDrawRounds, 5);

    // Non-host cannot update settings
    const badUpdate = manager.updateGameSettings(room.code, 'p2', { quickDrawRounds: 10 });
    assert.strictEqual(badUpdate, false);

    // 2. Vote Kick: Host is protected
    const kickHostRes = manager.startVoteKick(room.code, 'p2', 'host');
    assert.strictEqual(kickHostRes.success, false);
    assert.ok(kickHostRes.error?.includes('host cannot be kicked'));

    // Cannot vote kick self
    const kickSelfRes = manager.startVoteKick(room.code, 'p2', 'p2');
    assert.strictEqual(kickSelfRes.success, false);

    // 3. Initiate vote kick against Player 3
    const startKick = manager.startVoteKick(room.code, 'p2', 'p3');
    assert.strictEqual(startKick.success, true);
    assert.strictEqual(startKick.voteState?.targetId, 'p3');
    assert.strictEqual(startKick.voteState?.yesVotes.length, 1); // Initiator votes Yes

    // Duplicate vote rejected
    const dupVote = manager.castVoteKick(room.code, 'p2', 'yes');
    assert.strictEqual(dupVote.success, false);

    // Host votes Yes -> Majority reached (2 yes out of 2 eligible voters)
    const hostVote = manager.castVoteKick(room.code, 'host', 'yes');
    assert.strictEqual(hostVote.success, true);
    assert.strictEqual(hostVote.resolved, true);
    assert.strictEqual(hostVote.passed, true);
    assert.strictEqual(hostVote.targetPlayer?.id, 'p3');

    // Target p3 was removed from room
    assert.strictEqual(room.players['p3'], undefined);
  });

  test('Who Knows Me Best: compares predictions to spotlight answer', () => {
    const game = new WhoKnowsMeGame(['p1', 'p2', 'p3'], { p1: 'Spotlight', p2: 'Friend1', p3: 'Friend2' });
    game.submitSpotlightAnswer('p1', 'Pizza Margherita');
    game.submitPrediction('p2', 'Pizza');
    game.submitPrediction('p3', 'Sushi');

    const { scoresGained } = game.calculateReveal({ p1: 'Spotlight', p2: 'Friend1', p3: 'Friend2' });
    assert.strictEqual(scoresGained['p2'], 120); // Matched 'Pizza'
    assert.strictEqual(scoresGained['p3'], 0); // No match
    assert.strictEqual(scoresGained['p1'], 40); // Spotlight bonus
  });

  test('Survival Vote: calculates majority outcome and survivor score adjustments', () => {
    const game = new SurvivalVoteGame(['p1', 'p2']);
    const optId = game.state.scenario.options[0].id;
    game.submitVote('p1', optId);
    game.submitVote('p2', optId);

    const { scoresGained } = game.calculateConsequences({ p1: 'Alice', p2: 'Bob' });
    assert.strictEqual(game.state.winningOption?.id, optId);
    assert.strictEqual(scoresGained['p1'], game.state.scenario.options[0].survivalBonus * 10);
  });

  test('Reaction Battle: penalizes false starts and records milliseconds for GO signal', () => {
    const game = new ReactionBattleGame(['p1', 'p2']);
    // Tap during WAITING -> false start penalty
    const tapEarly = game.recordTap('p1');
    assert.strictEqual(tapEarly.status, 'EARLY_PENALTY');

    // Trigger signal
    game.triggerSignal();
    game.state.signalType = 'GO';
    const tapValid = game.recordTap('p2');
    assert.strictEqual(tapValid.status, 'VALID');
    assert.ok(tapValid.reactionTimeMs! >= 0);
  });
});

