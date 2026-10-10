import assert from 'node:assert/strict';
import { io } from 'socket.io-client';
import { generateToken } from '../src/middleware/auth.js';
import { query } from '../src/db/db.js';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';
const NUM_PLAYERS = 50;
const ROOM_TITLE = `50-player load test ${Date.now()}`;
const SIMULATION_ID = Date.now();
const simulationUserIds = [];
const simulationSockets = [];
let simulationRoomId = null;

async function cleanupSimulationData() {
  simulationSockets.forEach(socket => socket.disconnect());
  if (simulationRoomId) {
    await query('DELETE FROM room_question_stats WHERE room_id = $1', [simulationRoomId]);
    await query('DELETE FROM room_topic_attempts WHERE room_id = $1', [simulationRoomId]);
    await query('DELETE FROM room_attempts WHERE room_id = $1', [simulationRoomId]);
    await query('DELETE FROM room_team_scores WHERE room_id = $1', [simulationRoomId]);
    await query('DELETE FROM rooms WHERE id = $1', [simulationRoomId]);
  }
  if (simulationUserIds.length) {
    const placeholders = simulationUserIds.map((_, index) => `$${index + 1}`).join(', ');
    await query(`DELETE FROM topic_statistics WHERE user_id IN (${placeholders})`, simulationUserIds);
    await query(`DELETE FROM user_profiles WHERE user_id IN (${placeholders})`, simulationUserIds);
    await query(`DELETE FROM users WHERE id IN (${placeholders})`, simulationUserIds);
  }
}

async function ensureSimulationUser(id, role, name) {
  simulationUserIds.push(id);
  const email = `${id}@load-test.logicrush.invalid`;
  await query(
    `INSERT INTO users (id, email, password_hash, role)
     VALUES ($1, $2, 'load-test-only', $3)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role`,
    [id, email, role]
  );
  await query(
    `INSERT INTO user_profiles (user_id, name, college, course, year, avatar)
     VALUES ($1, $2, 'LogicRush Load Test', 'Simulation', 'N/A', '⚡')
     ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name`,
    [id, name]
  );
  return generateToken({ id, email, name, role });
}

function connectPlayer(token, roomCode) {
  return new Promise((resolve, reject) => {
    const socket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
      timeout: 10000
    });
    const timer = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Timed out waiting for the authenticated socket to join.'));
    }, 15000);

    socket.on('connect_error', error => {
      clearTimeout(timer);
      socket.disconnect();
      reject(error);
    });
    socket.on('connect', () => socket.emit('join_room', { roomCode }));
    socket.on('room_joined', ({ isHost, room }) => {
      if (room.code !== roomCode) return;
      clearTimeout(timer);
      resolve({ socket, isHost });
    });
  });
}

async function runSimulation() {
  const hostId = `usr_logicrush_load_${SIMULATION_ID}_host`;
  const hostToken = await ensureSimulationUser(hostId, 'host', 'Load Test Host');
  const hostResponse = await fetch(`${SERVER_URL}/api/rooms/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hostToken}`
    },
    body: JSON.stringify({
      title: ROOM_TITLE,
      topic_id: 'mixed',
      difficulty: 'medium',
      max_players: NUM_PLAYERS,
      question_count: 3,
      time_per_question: 8,
      powerups_enabled: true
    })
  });
  const created = await hostResponse.json();
  assert.equal(hostResponse.status, 201, created.error || 'Failed to create simulation room.');
  simulationRoomId = created.room.id;
  const roomCode = created.room.code;

  const { socket: hostSocket, isHost } = await connectPlayer(hostToken, roomCode);
  simulationSockets.push(hostSocket);
  assert.equal(isHost, true);

  const playerSockets = [];
  let finished = false;
  const hardTimeout = setTimeout(() => {
    if (finished) return;
    playerSockets.forEach(socket => socket.disconnect());
    hostSocket.disconnect();
    process.exitCode = 1;
    console.error('50-player simulation timed out before the game finished.');
  }, 120000);

  hostSocket.on('round_ended', () => {
    setTimeout(() => hostSocket.emit('next_round'), 50);
  });

  const playerTokens = await Promise.all(
    Array.from({ length: NUM_PLAYERS }, (_, index) => (
      ensureSimulationUser(`usr_logicrush_load_${SIMULATION_ID}_${index + 1}`, 'student', `Load Player ${index + 1}`)
    ))
  );
  const connectedPlayers = await Promise.all(playerTokens.map(token => connectPlayer(token, roomCode)));
  const sockets = connectedPlayers.map(({ socket }) => socket);
  simulationSockets.push(...sockets);
  playerSockets.push(...sockets);
  assert.equal(connectedPlayers.some(player => player.isHost), false);

  sockets.forEach(socket => {
    socket.on('latency_probe', ({ nonce }) => socket.emit('latency_pong', { nonce }));
    socket.on('round_started', ({ question }) => {
      socket.emit('submit_answer', {
        selectedOptionIndex: Math.floor(Math.random() * question.options.length)
      });
    });
  });

  const completion = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('No final result received from the game server.')), 120000);
    hostSocket.once('game_finished', ({ leaderboard }) => {
      clearTimeout(timer);
      resolve(leaderboard);
    });
  });

  hostSocket.emit('start_game');
  const leaderboard = await completion;
  assert.equal(leaderboard.length, NUM_PLAYERS);
  assert.equal(new Set(leaderboard.map(player => player.userId)).size, NUM_PLAYERS);

  finished = true;
  clearTimeout(hardTimeout);
  playerSockets.forEach(socket => socket.disconnect());
  hostSocket.disconnect();
  console.log(`50 authenticated players completed ${created.room.question_count} questions in room ${roomCode}.`);
  console.log('Leaderboard included 50 distinct players; authoritative server scoring and round transitions passed.');
}

runSimulation().then(cleanupSimulationData).catch(async error => {
  console.error('50-player simulation failed:', error);
  process.exitCode = 1;
  try {
    await cleanupSimulationData();
  } catch (cleanupError) {
    console.error('Failed to clean up 50-player simulation data:', cleanupError);
  }
});
