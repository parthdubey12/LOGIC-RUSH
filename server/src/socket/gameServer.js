import { query, queryOne } from '../db/db.js';
import { calculateScore, shuffleOptionsForPlayer } from './scoring.js';
import { seedQuestions } from '../data/seedQuestions.js';

// In-memory active game rooms state
export const activeRooms = new Map();

/**
 * Socket.IO Multiplayer Game Engine with Anti-Cheat & Per-Player Option Jumbling
 */
export function setupGameSocket(io) {
  io.on('connection', (socket) => {
    let currentRoomCode = null;
    let currentUserId = null;

    // 1. Join Room
    socket.on('join_room', async ({ roomCode, user, isHost = false, isSpectator = false }) => {
      try {
        const code = (roomCode || '').toUpperCase().trim();
        let room = activeRooms.get(code);

        // If room not in memory, check DB or create if host
        if (!room) {
          const dbRoom = await queryOne('SELECT * FROM rooms WHERE code = $1', [code]);
          if (!dbRoom && !isHost) {
            return socket.emit('error_message', { message: `Room ${code} not found.` });
          }

          room = {
            id: dbRoom ? dbRoom.id : ('room_' + code),
            code: code,
            hostId: dbRoom ? dbRoom.host_id : (user?.id || 'host_user'),
            hostSocketId: isHost ? socket.id : null,
            title: dbRoom ? dbRoom.title : 'LogicRush Live Match',
            topicId: dbRoom ? (dbRoom.topic_id || 'mixed') : 'mixed',
            difficulty: dbRoom ? (dbRoom.difficulty || 'medium') : 'medium',
            questionCount: dbRoom ? (dbRoom.question_count || 10) : 10,
            timePerQuestion: dbRoom ? (dbRoom.time_per_question || 20) : 20,
            powerupsEnabled: dbRoom ? (dbRoom.powerups_enabled !== 0) : true,
            status: dbRoom ? (dbRoom.status || 'waiting') : 'waiting',
            currentQuestionIndex: 0,
            questions: [],
            players: new Map(), // socketId -> playerData
            answersThisRound: new Map(), // userId -> answerData
            questionStartTime: null,
            roundTimer: null,
            proctorAlerts: []
          };
          activeRooms.set(code, room);
        }

        currentRoomCode = code;
        currentUserId = user?.id || socket.id;

        socket.join(code);

        if (isHost) {
          room.hostSocketId = socket.id;
        }

        // Add / Update player
        const existingPlayer = Array.from(room.players.values()).find(p => p.userId === currentUserId);
        const playerData = existingPlayer || {
          socketId: socket.id,
          userId: currentUserId,
          name: user?.name || user?.profile?.name || (isSpectator ? 'Spectator' : 'Player ' + socket.id.substring(0, 4)),
          avatar: user?.avatar || user?.profile?.avatar || '⚡',
          college: user?.college || user?.profile?.college || 'Campus Arena',
          score: 0,
          streak: 0,
          correctCount: 0,
          isReady: isHost ? true : false,
          isHost,
          isSpectator,
          isDisqualified: false,
          tabViolations: 0,
          powerups: { fiftyFifty: 1, doublePoints: 1, extraTime: 1, hintCard: 1, streakShield: 1 }
        };

        playerData.socketId = socket.id;
        room.players.set(socket.id, playerData);

        // Emit room state to joining player
        socket.emit('room_joined', {
          room: serializeRoom(room),
          player: playerData,
          isHost: room.hostId === currentUserId || isHost
        });

        // Broadcast player list update to room
        io.to(code).emit('room_players_updated', {
          players: Array.from(room.players.values()).filter(p => !p.isSpectator),
          totalPlayers: Array.from(room.players.values()).filter(p => !p.isSpectator).length
        });
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
        io.to(currentRoomCode).emit('room_players_updated', {
          players: Array.from(room.players.values()).filter(p => !p.isSpectator),
          totalPlayers: Array.from(room.players.values()).filter(p => !p.isSpectator).length
        });
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

      // Fetch randomized questions for this match
      let matchQuestions = [];
      let dbQuestions = [];
      try {
        if (room.topicId && room.topicId !== 'all' && room.topicId !== 'mixed') {
          dbQuestions = await query('SELECT * FROM questions WHERE topic_id = $1 ORDER BY RANDOM() LIMIT $2', [room.topicId, room.questionCount]);
        } else {
          dbQuestions = await query('SELECT * FROM questions ORDER BY RANDOM() LIMIT $1', [room.questionCount]);
        }

        if (dbQuestions.length < room.questionCount) {
          const additionalQuestions = await query(
            'SELECT * FROM questions ORDER BY RANDOM() LIMIT $1',
            [Math.max(room.questionCount, 50)]
          );
          const selectedIds = new Set(dbQuestions.map(q => q.id || q.statement));
          for (const question of additionalQuestions) {
            const key = question.id || question.statement;
            if (!selectedIds.has(key)) {
              dbQuestions.push(question);
              selectedIds.add(key);
            }
            if (dbQuestions.length >= room.questionCount) break;
          }
        }
      } catch (dbErr) {
        console.warn('Falling back to seed questions for room:', dbErr.message);
      }

      if (dbQuestions.length < room.questionCount) {
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

      matchQuestions = dbQuestions.slice(0, room.questionCount).map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }));

      room.questions = matchQuestions;
      room.currentQuestionIndex = 0;
      room.status = 'active';

      // Reset players scores & state for new match
      room.players.forEach(p => {
        p.score = 0;
        p.streak = 0;
        p.correctCount = 0;
        p.isDisqualified = false;
        p.tabViolations = 0;
        p.powerups = { fiftyFifty: 1, doublePoints: 1, extraTime: 1, hintCard: 1, streakShield: 1 };
      });

      io.to(currentRoomCode).emit('game_starting', {
        countdownSec: 3,
        totalQuestions: room.questions.length
      });

      setTimeout(() => {
        startQuestionRound(io, room);
      }, 3000);
    });

    // 5. Anti-Cheat: Tab Switch Violation Reported by Client
    socket.on('tab_switch_violation', () => {
      if (!currentRoomCode) return;
      const room = activeRooms.get(currentRoomCode);
      if (!room || room.status !== 'question') return;

      const player = room.players.get(socket.id);
      if (!player || player.isDisqualified) return;

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
      io.to(currentRoomCode).emit('room_players_updated', {
        players: Array.from(room.players.values()).filter(p => !p.isSpectator),
        totalPlayers: Array.from(room.players.values()).filter(p => !p.isSpectator).length
      });
    });

    // 6. Submit Answer (with Player-Specific Jumbled Option Mapping)
    socket.on('submit_answer', ({ selectedOptionIndex, clientTimestamp }) => {
      if (!currentRoomCode) return;
      const room = activeRooms.get(currentRoomCode);
      if (!room || room.status !== 'question') return;

      const player = room.players.get(socket.id);
      if (!player || player.isDisqualified) return;

      // Reject duplicate answers in same round
      if (room.answersThisRound.has(player.userId)) {
        return;
      }

      const currentQ = room.questions[room.currentQuestionIndex];
      if (!currentQ) return;

      const now = Date.now();
      const responseTimeMs = Math.max(100, now - room.questionStartTime);
      const totalAllowedMs = (room.timePerQuestion + (player.extraTimeApplied ? 5 : 0) + 1.5) * 1000;

      // Check if late submission
      if (responseTimeMs > totalAllowedMs) {
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
      const competitors = Array.from(room.players.values()).filter(p => !p.isSpectator && !p.isDisqualified && (!p.isHost || room.players.size === 1));
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
    socket.on('use_powerup', ({ powerUpType }) => {
      if (!currentRoomCode) return;
      const room = activeRooms.get(currentRoomCode);
      if (!room || !room.powerupsEnabled || room.status !== 'question') return;

      const player = room.players.get(socket.id);
      if (!player || player.isDisqualified) return;

      const currentQ = room.questions[room.currentQuestionIndex];
      if (!currentQ) return;

      const playerCorrectIdx = player.currentCorrectOptionIndex !== undefined ? player.currentCorrectOptionIndex : currentQ.correct_option;

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
      } else if (powerUpType === 'extraTime' && player.powerups.extraTime > 0) {
        player.powerups.extraTime -= 1;
        player.extraTimeApplied = true;
        socket.emit('powerup_result', { powerUpType: 'extraTime', addedSec: 5 });
      } else if (powerUpType === 'hintCard' && player.powerups.hintCard > 0) {
        player.powerups.hintCard -= 1;
        const hintText = currentQ.explanation ? currentQ.explanation.split('.')[0] : 'Focus on standard ratio units.';
        socket.emit('powerup_result', { powerUpType: 'hintCard', hint: hintText });
      } else if (powerUpType === 'streakShield' && player.powerups.streakShield > 0) {
        player.powerups.streakShield -= 1;
        player.streakShieldActive = true;
        socket.emit('powerup_result', { powerUpType: 'streakShield', active: true });
      }
    });

    // 8. Advance to Next Round (Host or auto)
    socket.on('next_round', () => {
      if (!currentRoomCode) return;
      const room = activeRooms.get(currentRoomCode);
      if (!room || room.status !== 'round_review') return;

      room.currentQuestionIndex += 1;
      if (room.currentQuestionIndex < room.questions.length) {
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
      if (currentRoomCode) {
        const room = activeRooms.get(currentRoomCode);
        if (room) {
          room.players.delete(socket.id);
          io.to(currentRoomCode).emit('room_players_updated', {
            players: Array.from(room.players.values()).filter(p => !p.isSpectator),
            totalPlayers: Array.from(room.players.values()).filter(p => !p.isSpectator).length
          });
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

  const currentQ = room.questions[room.currentQuestionIndex];

  // For EACH player socket, jumble the options independently
  room.players.forEach((player, socketId) => {
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
      timeLimitSec: room.timePerQuestion,
      startTime: room.questionStartTime
    };

    io.to(socketId).emit('round_started', {
      question: playerSpecificQuestion,
      timeLimitSec: room.timePerQuestion
    });
  });

  // Set authoritative Server Countdown Timer
  room.roundTimer = setTimeout(() => {
    endQuestionRound(io, room);
  }, room.timePerQuestion * 1000);
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
  const nonSpectators = Array.from(room.players.values()).filter(p => !p.isSpectator);
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

  // Emit full round review with correct answer and explanations
  io.to(room.code).emit('round_ended', {
    questionIndex: room.currentQuestionIndex + 1,
    totalQuestions: room.questions.length,
    correctOptionText: currentQ.options[currentQ.correct_option],
    correctOptionIndex: currentQ.correct_option,
    explanation: currentQ.explanation || 'Solution calculated based on standard aptitude principles.',
    leaderboard: sortedLeaderboard,
    isLastQuestion: room.currentQuestionIndex + 1 >= room.questions.length
  });
}

/**
 * Finishes the match, produces final podium, awards XP to participants
 */
async function finishGame(io, room) {
  room.status = 'finished';

  const nonSpectators = Array.from(room.players.values()).filter(p => !p.isSpectator);
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

  io.to(room.code).emit('game_finished', {
    podium,
    leaderboard: finalLeaderboard,
    totalQuestions: room.questions.length,
    topic: room.topicId,
    roomTitle: room.title
  });
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
    timePerQuestion: room.timePerQuestion,
    powerupsEnabled: room.powerupsEnabled,
    status: room.status,
    totalPlayers: room.players.size
  };
}
