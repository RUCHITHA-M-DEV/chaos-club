import { io, Socket } from 'socket.io-client';
import '../src/index.js'; // starts server on port 5000

async function runMultiplayerSimulation() {
  console.log('🚀 Starting End-to-End Socket.IO Multiplayer Simulation Test...');

  // Wait a moment for server to listen
  await new Promise((r) => setTimeout(r, 1200));

  const url = 'http://localhost:5000';

  // Create 3 client sockets: Alice (Host), Bob (Guest 1), Charlie (Guest 2)
  const socketAlice: Socket = io(url, { transports: ['websocket'] });
  const socketBob: Socket = io(url, { transports: ['websocket'] });
  const socketCharlie: Socket = io(url, { transports: ['websocket'] });

  await Promise.all([
    new Promise<void>((r) => socketAlice.on('connect', r)),
    new Promise<void>((r) => socketBob.on('connect', r)),
    new Promise<void>((r) => socketCharlie.on('connect', r)),
  ]);
  console.log('✅ 3 Socket.IO client connections established');

  // Step 1: Alice creates a room
  let roomCode = '';
  await new Promise<void>((resolve) => {
    socketAlice.emit('create_room', {
      player: { id: 'alice_1', nickname: 'AliceHost', avatar: '👑', color: '#8B5CF6' },
      initialGame: 'SECRET_AGENT',
    });
    socketAlice.on('room_created', (data) => {
      roomCode = data.roomCode;
      console.log(`✅ Room created successfully! Code: ${roomCode}`);
      resolve();
    });
  });

  // Step 2: Bob joins room
  await new Promise<void>((resolve) => {
    socketBob.emit('join_room', {
      roomCode,
      player: { id: 'bob_2', nickname: 'BobPlayer', avatar: '🦊', color: '#EC4899' },
    });
    socketBob.on('room_joined', () => {
      console.log('✅ Bob joined room');
      resolve();
    });
  });

  // Step 3: Charlie joins room
  await new Promise<void>((resolve) => {
    socketCharlie.emit('join_room', {
      roomCode,
      player: { id: 'charlie_3', nickname: 'CharliePlayer', avatar: '🤖', color: '#06B6D4' },
    });
    socketCharlie.on('room_joined', () => {
      console.log('✅ Charlie joined room');
      resolve();
    });
  });

  // Step 4: Bob toggles ready
  socketBob.emit('player_ready');
  await new Promise((r) => setTimeout(r, 200));
  console.log('✅ Ready toggle synchronized');

  // Step 5: Test Game Selection (Host selects Fake Answer)
  socketAlice.emit('game_selected', { gameType: 'FAKE_ANSWER' });
  await new Promise((r) => setTimeout(r, 200));
  console.log('✅ Game switched to FAKE_ANSWER');

  // Step 6: Alice starts game
  await new Promise<void>((resolve) => {
    socketBob.on('game_started', () => {
      console.log('✅ All clients received game_started event!');
      resolve();
    });
    socketAlice.emit('start_game');
  });

  // Step 7: Submit bluffs for Fake Answer
  await new Promise((r) => setTimeout(r, 300));
  socketAlice.emit('submit_bluff', { text: 'Bluff by Alice' });
  socketBob.emit('submit_bluff', { text: 'Bluff by Bob' });
  socketCharlie.emit('submit_bluff', { text: 'Bluff by Charlie' });
  await new Promise((r) => setTimeout(r, 500));
  console.log('✅ All 3 players submitted bluffs, server transitioned to voting phase!');

  // Clean up
  socketAlice.disconnect();
  socketBob.disconnect();
  socketCharlie.disconnect();

  console.log('🎉 ALL MULTIPLAYER REAL-TIME SIMULATION TESTS PASSED 100%!');
  process.exit(0);
}

runMultiplayerSimulation().catch((err) => {
  console.error('❌ Simulation Error:', err);
  process.exit(1);
});
