import { query, queryOne } from '../db/db.js';
import { calculateScore, shuffleOptionsForPlayer } from './scoring.js';
import { seedQuestions } from '../data/seedQuestions.js';
import { performance } from 'node:perf_hooks';
import { v4 as uuidv4 } from 'uuid';

// In-memory active game rooms state
export const activeRooms = new Map();

/**
 * Socket.IO Multiplayer Game Engine with Anti-Cheat & Per-Player Option Jumbling
 */
export function setupGameSocket(io) {
  io.on('connection', (socket) => {
    let currentRoomCode = null;
    let currentUserId = null;
    const latencyProbes = new Map();
    const latencySamples = [];
    const emitLatencyProbe = () => {
      const nonce = `${Date.now()}-${Math.random()}`;
      latencyProbes.set(nonce, performance.now());
      for (const [key, sentAt] of latencyProbes) {
        if (performance.now() - sentAt > 30000) latencyProbes.delete(key);
      }
      socket.emit('latency_probe', { nonce });
    };
    emitLatencyProbe();
    const latencyProbeTimer = setInterval(emitLatencyProbe, 5000);
    latencyProbeTimer.unref?.();

    socket.on('latency_pong', ({ nonce } = {}) => {
      const sentAt = latencyProbes.get(nonce);
      if (sentAt === undefined) return;
      latencyProbes.delete(nonce);
      latencySamples.push(performance.now() - sentAt);
      if (latencySamples.length > 8) latencySamples.shift();
      const room = currentRoomCode && activeRooms.get(currentRoomCode);
      const player = room?.players.get(socket.id);
      if (player) player.latencyCompensationMs = Math.min(500, Math.round(Math.min(...latencySamples) / 2));
    });

    socket.on('leave_room', () => {
      if (!currentRoomCode) return;
      const room = activeRooms.get(currentRoomCode);
      if (room) {
        const player = room.players.get(socket.id);
        if (player) {
          player.connected = false;
          emitRoomPlayers(io, room);
        }
      }
      socket.leave(currentRoomCode);
      currentRoomCode = null;
      currentUserId = null;
    });

    // 1. Join Room
    socket.on('join_room', async ({ roomCode, isSpectator = false } = {}) => {
      try {
        const code = (roomCode || '').toUpperCase().trim();
        const currentUser = socket.data.user;
        if (!code || !currentUser?.id) {
          return socket.emit('error_message', { message: 'A valid room code and login are required.' });
        }

        const dbRoom = await queryOne('SELECT * FROM rooms WHERE code = $1', [code]);
        if (!dbRoom) {
          return socket.emit('error_message', { message: `Room ${code} not found.` });
        }

        let room = activeRooms.get(code);

        // Rebuild the in-memory lobby from its persisted room record.
        if (!room) {
          room = {
            id: dbRoom.id,
            code: code,
            hostId: dbRoom.host_id,
            hostSocketId: null,
            title: dbRoom.title,
            topicId: dbRoom.topic_id || 'mixed',
            difficulty: dbRoom.difficulty || 'medium',
            questionCount: dbRoom.question_count || 10,
            timePerQuestion: dbRoom.time_per_question || 20,
            questionSetId: dbRoom.question_set_id || null,
            teamBattle: dbRoom.team_battle === true || dbRoom.team_battle === 1,
            powerupsEnabled: dbRoom.powerups_enabled !== 0 && dbRoom.powerups_enabled !== false,
            status: dbRoom.status || 'waiting',
            currentQuestionIndex: 0,
            questions: [],
            questionPool: [],
            usedQuestionIds: new Set(),
            players: new Map(), // socketId -> playerData
            answersThisRound: new Map(), // userId -> answerData
            questionStartTime: null,
            roundTimer: null,
            proctorAlerts: []
          };
          activeRooms.set(code, room);
        }

        const isHost = dbRoom.host_id === currentUser.id;
        currentUserId = currentUser.id;
        const existingPlayer = Array.from(room.players.values()).find(p => p.userId === currentUserId);
        const isPlayerSpectator = existingPlayer ? existingPlayer.isSpectator : (!isHost && isSpectator === true);
        if (!existingPlayer && room.status !== 'waiting' && !isPlayerSpectator) {
          return socket.emit('error_message', { message: 'This quiz is already in progress. Ask the host for a room that is waiting.' });
        }
        const activePlayerCount = Array.from(room.players.values()).filter(p => !p.isHost && !p.isSpectator).length;
        if (!existingPlayer && !isPlayerSpectator && activePlayerCount >= (dbRoom.max_players || 50)) {
          return socket.emit('error_message', { message: 'This room has reached its player limit.' });
        }

        if (existingPlayer) {
          const previousSocket = io.sockets.sockets.get(existingPlayer.socketId);
          if (previousSocket && previousSocket.id !== socket.id) {
            previousSocket.leave(code);
          }
          room.players.delete(existingPlayer.socketId);
        }

        currentRoomCode = code;

        socket.join(code);

        if (isHost) {
          room.hostSocketId = socket.id;
        }

        const profile = currentUser.isGuest
          ? null
          : await queryOne('SELECT name, avatar, college FROM user_profiles WHERE user_id = $1', [currentUserId]);
        const teamMembership = !isHost && !isPlayerSpectator
          ? await queryOne(
            `SELECT t.id AS team_id, t.name AS team_name
             FROM team_members tm JOIN teams t ON t.id = tm.team_id
             WHERE tm.user_id = $1`,
            [currentUserId]
          )
          : null;
        const playerData = existingPlayer || {
          socketId: socket.id,
          userId: currentUserId,
          name: profile?.name || currentUser.name || `Player ${socket.id.substring(0, 4)}`,
          avatar: profile?.avatar || '⚡',
          college: profile?.college || 'Campus Arena',
          teamId: teamMembership?.team_id || null,
          teamName: teamMembership?.team_name || null,
          score: 0,
          streak: 0,
          correctCount: 0,
          isReady: isHost,
          isHost,
          isSpectator: isPlayerSpectator,
          isDisqualified: false,
          tabViolations: 0,
          latencyCompensationMs: 0,
          connected: true,
          powerups: { fiftyFifty: 1, doublePoints: 1 }
        };
        playerData.socketId = socket.id;
        playerData.connected = true;
        playerData.isSpectator = existingPlayer ? existingPlayer.isSpectator : isPlayerSpectator;
        const activeQuestion = room.questions[room.currentQuestionIndex];
        if (room.status === 'question' && activeQuestion && !playerData.currentShuffledOptions) {
          const shuffled = shuffleOptionsForPlayer(activeQuestion.options, activeQuestion.correct_option);
          playerData.currentShuffledOptions = shuffled.shuffledOptions;
          playerData.currentCorrectOptionIndex = shuffled.newCorrectIndex;
        }

        room.players.set(socket.id, playerData);

        // Emit room state to joining player
        socket.emit('room_joined', {
          room: serializeRoom(room),
          player: serializePublicPlayer(playerData),
          isHost,
          isSpectator: isPlayerSpectator,
          recovery: getRecoveryState(room, playerData)
        });

        // Broadcast player list update to room
        emitRoomPlayers(io, room);
      } catch (err) {
        console.error('Join room error:', err);
        socket.emit('error_message', { message: 'Failed to join room.' });
      }
    });

    // 2. Player Ready Toggle
    socket.on('toggle_ready', () => {
      if (!currentRoomCode) return;
      const room = activeRooms.get(currentRoomCode);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (player) {
        player.isReady = !player.isReady;
        emitRoomPlayers(io, room);
      }
    });

    // 3. Update Room Settings (Host)
    socket.on('update_room_settings', ({ topicId, difficulty, questionCount, timePerQuestion, powerupsEnabled }) => {
      if (!currentRoomCode) return;
      const room = activeRooms.get(currentRoomCode);
      if (!room || room.hostSocketId !== socket.id) return;

      if (topicId) room.topicId = topicId;
      if (difficulty) room.difficulty = difficulty;
      if (questionCount) room.questionCount = questionCount;
      if (timePerQuestion) room.timePerQuestion = timePerQuestion;
      if (powerupsEnabled !== undefined) room.powerupsEnabled = powerupsEnabled;

      io.to(currentRoomCode).emit('room_settings_updated', {
        topicId: room.topicId,
        difficulty: room.difficulty,
        questionCount: room.questionCount,
        timePerQuestion: room.timePerQuestion,
        powerupsEnabled: room.powerupsEnabled
      });
    });

    // 4. Start Game (Host)
    socket.on('start_game', async () => {
      if (!currentRoomCode) return;
      const room = activeRooms.get(currentRoomCode);
      if (!room) return;

      // Check host authorization
      if (room.hostSocketId !== socket.id && room.hostId !== currentUserId) {
        return socket.emit('error_message', { message: 'Only the room host can start the game.' });
      }
      if (room.status !== 'waiting') {
        return socket.emit('error_message', { message: 'This room is not waiting for a quiz to start.' });
      }
      if (room.teamBattle) {
        const teams = new Map();
        const activePlayers = Array.from(room.players.values()).filter(player =>
          player.connected && !player.isHost && !player.isSpectator
        );
        if (activePlayers.some(player => !player.teamId)) {
          return socket.emit('error_message', { message: 'Every player must join a team before a team battle can start.' });
        }
        for (const player of activePlayers) {
          const members = teams.get(player.teamId) || [];
          members.push(player);
          teams.set(player.teamId, members);
        }
        if (teams.size < 2 || Array.from(teams.values()).some(members => members.length < 3 || members.length > 5)) {
          return socket.emit('error_message', { message: 'A team battle needs at least two teams, each with 3–5 connected players.' });
        }
      }
      room.status = 'starting';

      // Fetch randomized questions for this match
      let dbQuestions = [];
      try {
        if (room.questionSetId) {
          dbQuestions = await query(
            `SELECT q.* FROM question_set_items qsi
             JOIN questions q ON q.id = qsi.question_id
             WHERE qsi.set_id = $1
             ORDER BY qsi.order_index ASC
             LIMIT $2`,
            [room.questionSetId, room.questionCount]
          );
        } else {
          if (room.topicId && room.topicId !== 'all' && room.topicId !== 'mixed') {
            dbQuestions = await query('SELECT * FROM questions WHERE topic_id = $1 ORDER BY RANDOM() LIMIT $2', [room.topicId, Math.min(room.questionCount * 5, 200)]);
          } else {
            dbQuestions = await query('SELECT * FROM questions ORDER BY RANDOM() LIMIT $1', [Math.min(room.questionCount * 5, 200)]);
          }

          if (dbQuestions.length < Math.min(room.questionCount * 5, 200)) {
            const additionalQuestions = await query(
              'SELECT * FROM questions ORDER BY RANDOM() LIMIT $1',
              [Math.max(room.questionCount * 5, 50)]
            );
            const selectedIds = new Set(dbQuestions.map(q => q.id || q.statement));
            for (const question of additionalQuestions) {
              const key = question.id || question.statement;
              if (!selectedIds.has(key)) {
                dbQuestions.push(question);
                selectedIds.add(key);
              }
              if (dbQuestions.length >= Math.min(room.questionCount * 5, 200)) break;
            }
          }
        }
      } catch (dbErr) {
        console.error('Failed to load room question set:', dbErr);
        room.status = 'waiting';
        return socket.emit('error_message', { message: 'Could not load the selected question set.' });
      }

      if (!room.questionSetId && dbQuestions.length < room.questionCount) {
        const selectedIds = new Set(dbQuestions.map(q => q.id || q.statement));
        const shuffledSeeds = [...seedQuestions].sort(() => 0.5 - Math.random());
        for (const question of shuffledSeeds) {
          const key = question.id || question.statement;
          if (!selectedIds.has(key)) {
            dbQuestions.push(question);
            selectedIds.add(key);
          }
          if (dbQuestions.length >= room.questionCount) break;
        }
      }

      const questionPool = dbQuestions.map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }));

      const baseDifficulty = ['easy', 'medium', 'hard'].includes(room.difficulty) ? room.difficulty : 'medium';
      const initialQuestions = (room.questionSetId
        ? questionPool
        : [
          ...questionPool.filter(q => q.difficulty === baseDifficulty),
          ...questionPool.filter(q => q.difficulty !== baseDifficulty)
        ]
      ).slice(0, room.questionCount);
      if (initialQuestions.length < room.questionCount) {
        room.status = 'waiting';
        return socket.emit('error_message', { message: 'Not enough unique questions are available to start this quiz.' });
      }
      room.questionPool = questionPool;
      room.questions = initialQuestions;
      room.usedQuestionIds = new Set(initialQuestions.map(q => q.id || q.statement));
      room.topicStatsByUser = new Map();
      room.adaptiveDifficulty = baseDifficulty;
      room.currentQuestionIndex = 0;

      // Reset players scores & state for new match
      room.players.forEach(p => {
        p.score = 0;
        p.streak = 0;
        p.correctCount = 0;
        p.isDisqualified = false;
        p.tabViolations = 0;
        p.powerups = { fiftyFifty: 1, doublePoints: 1 };
        p.doublePointsActive = false;
      });

      try {
        for (const player of room.players.values()) {
          if (player.isHost || player.isSpectator) continue;
          await query(
            `INSERT INTO room_attempts (room_id, user_id, score, correct_count, total_questions, rank, status, joined_at, completed_at)
             VALUES ($1, $2, 0, 0, $3, 0, 'in_progress', CURRENT_TIMESTAMP, NULL)
             ON CONFLICT (room_id, user_id) DO UPDATE SET
               score = 0, correct_count = 0, total_questions = $4, rank = 0,
               status = 'in_progress', joined_at = CURRENT_TIMESTAMP, completed_at = NULL`,
            [room.id, player.userId, room.questions.length, room.questions.length]
          );
        }
        await query("UPDATE rooms SET status = 'active' WHERE id = $1", [room.id]);
      } catch (err) {
        console.error('Failed to record room attempts:', err);
        room.status = 'waiting';
        socket.emit('error_message', { message: 'Could not start the quiz because attempts could not be recorded.' });
        return;
      }

      room.status = 'starting';
      io.to(currentRoomCode).emit('game_starting', {
        countdownSec: 3,
        totalQuestions: room.questions.length
      });

      room.gameStartTimer = setTimeout(() => {
        if (room.status !== 'starting') return;
        startQuestionRound(io, room);
      }, 3000);
    });

    // 5. Anti-Cheat: Tab Switch Violation Reported by Client
    socket.on('tab_switch_violation', () => {
      if (!currentRoomCode) return;
      const room = activeRooms.get(currentRoomCode);
      if (!room || room.status !== 'question') return;

      const player = room.players.get(socket.id);
      if (!player || player.isDisqualified || player.isSpectator || player.isHost) return;

      player.tabViolations = (player.tabViolations || 0) + 1;
      
      // Deduct penalty points (-200 points)
      player.score = Math.max(0, player.score - 200);

      const penaltyRecord = {
        studentName: player.name,
        socketId: socket.id,
        userId: player.userId,
        violationsCount: player.tabViolations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isDisqualified: player.tabViolations > 2
      };

      room.proctorAlerts.push(penaltyRecord);

      // Notify host in real-time
      if (room.hostSocketId) {
        io.to(room.hostSocketId).emit('host_proctor_alert', penaltyRecord);
      }

      // Check 2-warning limit (3rd violation triggers automatic disqualification)
      if (player.tabViolations > 2) {
        player.isDisqualified = true;
        socket.emit('test_disqualified', {
          reason: 'Exceeded maximum tab-switch limit (2 warnings max). Your test has been terminated by the proctoring engine.'
        });
      } else {
        // Send warning & penalty notification to student
        socket.emit('tab_switch_warning', {
          violationsCount: player.tabViolations,
          maxAllowed: 2,
          penaltyPoints: 200,
          currentScore: player.score
        });
      }

      // Broadcast updated scores
      emitRoomPlayers(io, room);
    });

    // 6. Submit Answer (with Player-Specific Jumbled Option Mapping)
    socket.on('submit_answer', ({ selectedOptionIndex } = {}) => {
      if (!currentRoomCode) return;
      const room = activeRooms.get(currentRoomCode);
      if (!room || room.status !== 'question') return;

      const player = room.players.get(socket.id);
      if (!player || player.isDisqualified || player.isSpectator || player.isHost) return;

      // Reject duplicate answers in same round
      if (room.answersThisRound.has(player.userId)) {
        return;
      }

      const currentQ = room.questions[room.currentQuestionIndex];
      if (!currentQ) return;
      if (!Number.isInteger(selectedOptionIndex) || selectedOptionIndex < 0 || selectedOptionIndex >= player.currentShuffledOptions?.length) {
        return socket.emit('answer_feedback', { isInvalid: true, message: 'Select a valid answer option.' });
      }

      const responseTimeMs = Math.max(0, performance.now() - room.questionStartMonotonic - player.latencyCompensationMs);
      const totalAllowedMs = room.timePerQuestion * 1000 + 1500 + player.latencyCompensationMs;

      // Check if late submission
      if (performance.now() - room.questionStartMonotonic > totalAllowedMs) {
        return socket.emit('answer_feedback', { isLate: true, message: 'Time limit exceeded.' });
      }

      // Validate using player's specific shuffled option correct index
      const targetCorrectIndex = (player.currentCorrectOptionIndex !== undefined)
        ? player.currentCorrectOptionIndex
        : currentQ.correct_option;

      const isCorrect = (selectedOptionIndex === targetCorrectIndex);

      let pointsEarned = 0;
      if (isCorrect) {
        pointsEarned = calculateScore({
          isCorrect: true,
          responseTimeMs,
          totalTimeSec: room.timePerQuestion,
          difficulty: currentQ.difficulty
        });

        if (player.doublePointsActive) {
          pointsEarned *= 2;
          player.doublePointsActive = false;
        }

        player.score += pointsEarned;
        player.correctCount += 1;
        player.streak += 1;
      } else {
        if (!player.streakShieldActive) {
          player.streak = 0;
        } else {
          player.streakShieldActive = false;
        }
      }

      const topicId = currentQ.topic_id || room.topicId || 'mixed';
      const userTopicStats = room.topicStatsByUser.get(player.userId) || new Map();
      const topicStats = userTopicStats.get(topicId) || { attempts: 0, correct: 0, totalTimeMs: 0 };
      topicStats.attempts += 1;
      if (isCorrect) topicStats.correct += 1;
      topicStats.totalTimeMs += Math.round(responseTimeMs);
      userTopicStats.set(topicId, topicStats);
      room.topicStatsByUser.set(player.userId, userTopicStats);

      // Record answer
      const answerRecord = {
        userId: player.userId,
        name: player.name,
        socketId: socket.id,
        selectedOptionIndex,
        isCorrect,
        responseTimeMs,
        pointsEarned,
        currentScore: player.score,
        currentStreak: player.streak
      };

      room.answersThisRound.set(player.userId, answerRecord);

      // Acknowledge to submitting player
      socket.emit('answer_acknowledged', {
        submitted: true,
        pointsEarned,
        responseTimeMs
      });

      // Broadcast answer progress count (DO NOT reveal choices)
      const competitors = Array.from(room.players.values()).filter(p => !p.isSpectator && p.connected && !p.isDisqualified && !p.isHost);
      io.to(currentRoomCode).emit('answer_progress_updated', {
        answeredCount: room.answersThisRound.size,
        totalPlayers: competitors.length
      });

      // If all active competitors answered, complete round early
      if (competitors.length > 0 && room.answersThisRound.size >= competitors.length) {
        if (room.roundTimer) {
          clearTimeout(room.roundTimer);
          room.roundTimer = null;
        }
        endQuestionRound(io, room);
      }
    });

    // 7. Power-Up Trigger
    socket.on('use_powerup', ({ powerUpType } = {}) => {
      if (!currentRoomCode) return;
      const room = activeRooms.get(currentRoomCode);
      if (!room || !room.powerupsEnabled || room.status !== 'question') return;

      const player = room.players.get(socket.id);
      if (!player || player.isDisqualified || player.isSpectator || player.isHost) return;

      const currentQ = room.questions[room.currentQuestionIndex];
      if (!currentQ) return;

      const playerCorrectIdx = player.currentCorrectOptionIndex !== undefined ? player.currentCorrectOptionIndex : currentQ.correct_option;

      if (room.answersThisRound.has(player.userId)) return;

      if (powerUpType === 'fiftyFifty' && player.powerups.fiftyFifty > 0) {
        player.powerups.fiftyFifty -= 1;
        const incorrectIndices = [0, 1, 2, 3].filter(i => i !== playerCorrectIdx);
        const shuffledWrong = incorrectIndices.sort(() => 0.5 - Math.random());
        const eliminated = shuffledWrong.slice(0, 2);

        socket.emit('powerup_result', {
          powerUpType: 'fiftyFifty',
          eliminatedIndices: eliminated
        });
      } else if (powerUpType === 'doublePoints' && player.powerups.doublePoints > 0) {
        player.powerups.doublePoints -= 1;
        player.doublePointsActive = true;
        socket.emit('powerup_result', { powerUpType: 'doublePoints', active: true });
      }
    });

    // 8. Advance to Next Round (Host or auto)
    socket.on('next_round', () => {
      if (!currentRoomCode) return;
      const room = activeRooms.get(currentRoomCode);
      if (!room || room.hostSocketId !== socket.id || room.status !== 'round_review') return;

      room.currentQuestionIndex += 1;
      if (room.currentQuestionIndex < room.questions.length) {
        const adaptiveQuestion = room.questionSetId ? null : chooseAdaptiveQuestion(room);
        if (adaptiveQuestion) room.questions[room.currentQuestionIndex] = adaptiveQuestion;
        startQuestionRound(io, room);
      } else {
        finishGame(io, room);
      }
    });

    // 9. In-Lobby & Live Chat
    socket.on('send_chat', ({ message }) => {
      if (!currentRoomCode || !message) return;
      const room = activeRooms.get(currentRoomCode);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      io.to(currentRoomCode).emit('new_chat_message', {
        sender: player.name,
        avatar: player.avatar,
        message: message.substring(0, 150),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    });

    // 10. Disconnect Handling
    socket.on('disconnect', () => {
      clearInterval(latencyProbeTimer);
      if (currentRoomCode) {
        const room = activeRooms.get(currentRoomCode);
        if (room) {
          const player = room.players.get(socket.id);
          if (player) player.connected = false;
          emitRoomPlayers(io, room);
        }
      }
    });
  });
}

/**
 * Starts a new Question Round with Per-Player Jumbled Options
 */
function startQuestionRound(io, room) {
  room.status = 'question';
  room.answersThisRound.clear();
  room.questionStartTime = Date.now();
  room.questionStartMonotonic = performance.now();

  const currentQ = room.questions[room.currentQuestionIndex];

  // For EACH player socket, jumble the options independently
  room.players.forEach((player, socketId) => {
    if (!player.connected) return;
    const { shuffledOptions, newCorrectIndex } = shuffleOptionsForPlayer(currentQ.options, currentQ.correct_option);
    player.currentShuffledOptions = shuffledOptions;
    player.currentCorrectOptionIndex = newCorrectIndex;

    const playerSpecificQuestion = {
      index: room.currentQuestionIndex + 1,
      total: room.questions.length,
      id: currentQ.id,
      topic_id: currentQ.topic_id,
      statement: currentQ.statement,
      options: shuffledOptions, // Jumbled specifically for this player!
      difficulty: currentQ.difficulty,
      image_url: currentQ.image_url || null,
      table_data: currentQ.table_data || null,
      timeLimitSec: room.timePerQuestion,
      startTime: room.questionStartTime
    };

    io.to(socketId).emit('round_started', {
      question: playerSpecificQuestion,
      timeLimitSec: room.timePerQuestion,
      remainingTimeMs: Math.max(0, room.timePerQuestion * 1000 - (performance.now() - room.questionStartMonotonic))
    });
  });

  // Set authoritative Server Countdown Timer
  room.roundTimer = setTimeout(() => {
    endQuestionRound(io, room);
  }, room.timePerQuestion * 1000 + 2000);
}

/**
 * Ends the question round, reveals correct answer, calculates leaderboard deltas
 */
async function endQuestionRound(io, room) {
  if (room.status !== 'question') return;
  room.status = 'round_review';

  if (room.roundTimer) {
    clearTimeout(room.roundTimer);
    room.roundTimer = null;
  }

  const currentQ = room.questions[room.currentQuestionIndex];

  // Calculate updated leaderboard
  const nonSpectators = Array.from(room.players.values()).filter(p => !p.isSpectator && !p.isHost);
  const sortedLeaderboard = [...nonSpectators].sort((a, b) => b.score - a.score).map((p, rank) => {
    const answerInfo = room.answersThisRound.get(p.userId);
    return {
      rank: rank + 1,
      userId: p.userId,
      socketId: p.socketId,
      name: p.name,
      avatar: p.avatar,
      college: p.college,
      score: p.score,
      streak: p.streak,
      correctCount: p.correctCount,
      lastPoints: answerInfo?.pointsEarned || 0,
      lastResponseTimeMs: answerInfo?.responseTimeMs || 0,
      isCorrectThisRound: answerInfo?.isCorrect || false,
      isDisqualified: p.isDisqualified || false
    };
  });

  const roundAnswers = Array.from(room.answersThisRound.values());
  if (roundAnswers.length > 0) {
    const accuracy = roundAnswers.filter(answer => answer.isCorrect).length / roundAnswers.length;
    const difficultyOrder = ['easy', 'medium', 'hard'];
    const currentDifficultyIndex = difficultyOrder.indexOf(room.adaptiveDifficulty || 'medium');
    if (accuracy >= 0.75 && currentDifficultyIndex < difficultyOrder.length - 1) {
      room.adaptiveDifficulty = difficultyOrder[currentDifficultyIndex + 1];
    } else if (accuracy <= 0.35 && currentDifficultyIndex > 0) {
      room.adaptiveDifficulty = difficultyOrder[currentDifficultyIndex - 1];
    }
  }

  try {
    const correctCount = roundAnswers.filter(answer => answer.isCorrect).length;
    const wrongCount = roundAnswers.length - correctCount;
    await query(
      `INSERT INTO room_question_stats (room_id, question_id, correct_count, wrong_count)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (room_id, question_id) DO UPDATE SET
         correct_count = EXCLUDED.correct_count, wrong_count = EXCLUDED.wrong_count`,
      [room.id, currentQ.id, correctCount, wrongCount]
    );
  } catch (err) {
    console.error('Failed to persist room question statistics:', err);
    if (room.hostSocketId) {
      io.to(room.hostSocketId).emit('error_message', { message: 'Round ended, but question analytics could not be saved.' });
    }
  }

  room.lastRoundReview = {
    questionIndex: room.currentQuestionIndex + 1,
    totalQuestions: room.questions.length,
    correctOptionText: currentQ.options[currentQ.correct_option],
    correctOptionIndex: currentQ.correct_option,
    explanation: currentQ.explanation || 'Solution calculated based on standard aptitude principles.',
    leaderboard: sortedLeaderboard,
    teamLeaderboard: createTeamLeaderboard(room),
    isLastQuestion: room.currentQuestionIndex + 1 >= room.questions.length,
    nextDifficulty: room.adaptiveDifficulty
  };
  io.to(room.code).emit('round_ended', room.lastRoundReview);
}

/**
 * Finishes the match, produces final podium, awards XP to participants
 */
async function finishGame(io, room) {
  if (room.status === 'finished') return;
  room.status = 'finished';

  const nonSpectators = Array.from(room.players.values()).filter(p => !p.isSpectator && !p.isHost);
  const finalLeaderboard = [...nonSpectators].sort((a, b) => b.score - a.score).map((p, rank) => ({
    rank: rank + 1,
    userId: p.userId,
    name: p.name,
    avatar: p.avatar,
    college: p.college,
    score: p.score,
    streak: p.streak,
    correctCount: p.correctCount,
    isDisqualified: p.isDisqualified || false,
    accuracy: room.questions.length > 0 ? Math.round((p.correctCount / room.questions.length) * 100) : 0,
    xpEarned: Math.round(p.score / 4) + (rank === 0 ? 300 : rank === 1 ? 200 : rank === 2 ? 100 : 50)
  }));

  const podium = finalLeaderboard.slice(0, 3);
  const teamLeaderboard = createTeamLeaderboard(room);
  room.finalLeaderboard = finalLeaderboard;
  room.finalPodium = podium;
  room.teamLeaderboard = teamLeaderboard;

  try {
    await query(
      `UPDATE room_attempts SET status = 'incomplete' WHERE room_id = $1 AND status = 'in_progress'`,
      [room.id]
    );
    await query("UPDATE rooms SET status = 'finished' WHERE id = $1", [room.id]);
    for (const entry of finalLeaderboard) {
      await query(
        `UPDATE room_attempts
         SET score = $1, correct_count = $2, total_questions = $3, rank = $4,
             status = 'completed', completed_at = CURRENT_TIMESTAMP
         WHERE room_id = $5 AND user_id = $6`,
        [entry.score, entry.correctCount, room.questions.length, entry.rank, room.id, entry.userId]
      );
      await query(
        `UPDATE user_profiles
         SET xp = COALESCE(xp, 0) + $1,
             total_games = COALESCE(total_games, 0) + 1,
             total_correct = COALESCE(total_correct, 0) + $2,
             total_questions = COALESCE(total_questions, 0) + $3,
             accuracy = CASE
               WHEN COALESCE(total_questions, 0) + $3 > 0
               THEN 100.0 * (COALESCE(total_correct, 0) + $2) / (COALESCE(total_questions, 0) + $3)
               ELSE accuracy
             END
         WHERE user_id = $4`,
        [entry.xpEarned, entry.correctCount, room.questions.length, entry.userId]
      );
      const topicStats = room.topicStatsByUser?.get(entry.userId) || new Map();
      for (const [topicId, stat] of topicStats) {
        await query(
          `INSERT INTO room_topic_attempts (room_id, user_id, topic_id, attempts, correct, total_time_ms)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (room_id, user_id, topic_id) DO UPDATE SET
             attempts = EXCLUDED.attempts, correct = EXCLUDED.correct, total_time_ms = EXCLUDED.total_time_ms`,
          [room.id, entry.userId, topicId, stat.attempts, stat.correct, stat.totalTimeMs]
        );
        await query(
          `INSERT INTO topic_statistics (id, user_id, topic_id, attempts, correct, total_time_ms)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id, topic_id) DO UPDATE SET
             attempts = topic_statistics.attempts + EXCLUDED.attempts,
             correct = topic_statistics.correct + EXCLUDED.correct,
             total_time_ms = topic_statistics.total_time_ms + EXCLUDED.total_time_ms,
             updated_at = CURRENT_TIMESTAMP`,
          [`ts_${uuidv4().substring(0, 12)}`, entry.userId, topicId, stat.attempts, stat.correct, stat.totalTimeMs]
        );
      }
    }
    for (const team of teamLeaderboard) {
      await query(
        `INSERT INTO room_team_scores (room_id, team_id, score, rank)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (room_id, team_id) DO UPDATE SET score = EXCLUDED.score, rank = EXCLUDED.rank`,
        [room.id, team.teamId, team.score, team.rank]
      );
      await query('UPDATE teams SET total_score = total_score + $1 WHERE id = $2', [team.score, team.teamId]);
    }
  } catch (err) {
    console.error('Failed to persist final room results:', err);
    if (room.hostSocketId) {
      io.to(room.hostSocketId).emit('error_message', { message: 'Quiz finished, but student results could not be saved.' });
    }
  }

  io.to(room.code).emit('game_finished', {
    podium,
    leaderboard: finalLeaderboard,
    totalQuestions: room.questions.length,
    topic: room.topicId,
    roomTitle: room.title,
    teamLeaderboard
  });
}

function createTeamLeaderboard(room) {
  if (!room.teamBattle) return [];
  const totals = new Map();
  for (const player of room.players.values()) {
    if (!player.teamId || player.isHost || player.isSpectator) continue;
    const current = totals.get(player.teamId) || {
      teamId: player.teamId,
      name: player.teamName || 'Team',
      score: 0,
      memberCount: 0
    };
    current.score += player.score;
    current.memberCount += 1;
    totals.set(player.teamId, current);
  }
  return Array.from(totals.values())
    .sort((first, second) => second.score - first.score || first.name.localeCompare(second.name))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

function serializeRoom(room) {
  return {
    id: room.id,
    code: room.code,
    hostId: room.hostId,
    title: room.title,
    topicId: room.topicId,
    difficulty: room.difficulty,
    questionCount: room.questionCount,
    questionSetId: room.questionSetId || null,
    teamBattle: room.teamBattle,
    timePerQuestion: room.timePerQuestion,
    powerupsEnabled: room.powerupsEnabled,
    status: room.status,
    totalPlayers: room.players.size
  };
}

function getRecoveryState(room, player) {
  if (room.status === 'question') {
    const currentQuestion = room.questions[room.currentQuestionIndex];
    if (currentQuestion && player.currentShuffledOptions) {
      return {
        status: 'question',
        answered: room.answersThisRound.has(player.userId),
        question: {
          index: room.currentQuestionIndex + 1,
          total: room.questions.length,
          id: currentQuestion.id,
          topic_id: currentQuestion.topic_id,
          statement: currentQuestion.statement,
          options: player.currentShuffledOptions,
          difficulty: currentQuestion.difficulty,
          image_url: currentQuestion.image_url || null,
          table_data: currentQuestion.table_data || null,
          timeLimitSec: room.timePerQuestion,
          startTime: room.questionStartTime,
          remainingTimeMs: Math.max(0, room.timePerQuestion * 1000 - (performance.now() - room.questionStartMonotonic))
        }
      };
    }
  }
  if (room.status === 'round_review' && room.lastRoundReview) {
    return { status: 'round_review', result: room.lastRoundReview };
  }
  if (room.status === 'finished') {
    return {
      status: 'finished',
      leaderboard: room.finalLeaderboard || [],
      podium: room.finalPodium || [],
      teamLeaderboard: room.teamLeaderboard || [],
      totalQuestions: room.questions.length
    };
  }
  return { status: room.status };
}

function serializePublicPlayer(player) {
  return {
    socketId: player.socketId,
    userId: player.userId,
    name: player.name,
    avatar: player.avatar,
    college: player.college,
    teamId: player.teamId || null,
    teamName: player.teamName || null,
    score: player.score,
    streak: player.streak,
    correctCount: player.correctCount,
    isReady: player.isReady,
    isHost: player.isHost,
    isSpectator: player.isSpectator,
    isDisqualified: player.isDisqualified,
    connected: player.connected,
    powerups: player.powerups
  };
}

function emitRoomPlayers(io, room) {
  const players = Array.from(room.players.values()).filter(p => !p.isSpectator && p.connected);
  const spectatorsCount = Array.from(room.players.values()).filter(p => p.isSpectator && p.connected).length;
  io.to(room.code).emit('room_players_updated', {
    players: players.map(serializePublicPlayer),
    totalPlayers: players.length,
    spectatorsCount
  });
}

function chooseAdaptiveQuestion(room) {
  const available = room.questionPool.filter(q => !room.usedQuestionIds.has(q.id || q.statement));
  const order = ['easy', 'medium', 'hard'];
  const targetIndex = order.indexOf(room.adaptiveDifficulty || 'medium');
  available.sort((a, b) => Math.abs(order.indexOf(a.difficulty) - targetIndex) - Math.abs(order.indexOf(b.difficulty) - targetIndex));
  const question = available[0];
  if (!question) return null;
  room.usedQuestionIds.add(question.id || question.statement);
  return question;
}
