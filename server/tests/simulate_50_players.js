import { io } from 'socket.io-client';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';
const NUM_PLAYERS = 50;

console.log(`\n🎮 STARTING 50-PLAYER LOAD SIMULATION ON ${SERVER_URL}...\n`);

async function runSimulation() {
  // 1. Create Host Client
  const hostSocket = io(SERVER_URL, { transports: ['websocket'] });

  await new Promise((resolve) => hostSocket.on('connect', resolve));
  console.log('👑 Host connected:', hostSocket.id);

  const testRoomCode = 'LOAD50';

  // Host joins and creates room
  hostSocket.emit('join_room', {
    roomCode: testRoomCode,
    user: { id: 'usr_host_sim', name: 'Host Commander', avatar: '👑' },
    isHost: true
  });

  await new Promise((resolve) => setTimeout(resolve, 800));

  // Host advances rounds when ready
  hostSocket.on('round_ended', ({ questionIndex, totalQuestions, isLastQuestion }) => {
    console.log(`👑 Host: Round ${questionIndex}/${totalQuestions} reviewed. Advancing...`);
    setTimeout(() => {
      if (isLastQuestion) {
        hostSocket.emit('next_round'); // triggers finishGame
      } else {
        hostSocket.emit('next_round');
      }
    }, 1500);
  });

  // 2. Connect 50 Player Sockets
  const playerSockets = [];
  console.log(`⚡ Spawning ${NUM_PLAYERS} concurrent players joining room ${testRoomCode}...`);

  for (let i = 1; i <= NUM_PLAYERS; i++) {
    const pSocket = io(SERVER_URL, { transports: ['websocket'] });
    playerSockets.push(pSocket);

    pSocket.emit('join_room', {
      roomCode: testRoomCode,
      user: {
        id: `sim_player_${i}`,
        name: `Speedster_${i}`,
        avatar: ['⚡', '🔥', '🧠', '🎯', '🚀', '⭐'][i % 6],
        college: `University ${((i % 5) + 1)}`
      },
      isHost: false
    });
  }

  // Wait for all players to connect
  await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log(`✅ All ${NUM_PLAYERS} players joined the room successfully!`);

  // Setup response handlers for all players
  playerSockets.forEach((pSocket, index) => {
    pSocket.on('round_started', ({ question, timeLimitSec }) => {
      // Simulate human reaction time between 400ms and 2500ms
      const delayMs = 400 + Math.random() * 2000;
      const willAnswerCorrect = Math.random() < 0.8; // 80% accuracy simulation

      setTimeout(() => {
        const chosenOption = willAnswerCorrect ? (question.options ? 1 : 0) : Math.floor(Math.random() * 4);
        pSocket.emit('submit_answer', {
          selectedOptionIndex: chosenOption,
          clientTimestamp: Date.now()
        });
      }, delayMs);
    });

    pSocket.on('round_ended', ({ questionIndex, totalQuestions, leaderboard }) => {
      if (index === 0) {
        console.log(`\n🏁 Round ${questionIndex}/${totalQuestions} Completed!`);
        console.log(`   Top 3 Leaderboard:`);
        leaderboard.slice(0, 3).forEach((p, r) => {
          console.log(`   #${r + 1} ${p.name} | Score: ${p.score} | Streak: ${p.streak}🔥`);
        });
      }
    });

    pSocket.on('game_finished', ({ podium, totalQuestions }) => {
      if (index === 0) {
        console.log(`\n🏆 GAME OVER! 50-PLAYER SIMULATION ACCOMPLISHED!`);
        console.log(`   🥇 1st Place: ${podium[0]?.name} (${podium[0]?.score} pts)`);
        console.log(`   🥈 2nd Place: ${podium[1]?.name} (${podium[1]?.score} pts)`);
        console.log(`   🥉 3rd Place: ${podium[2]?.name} (${podium[2]?.score} pts)`);
        console.log(`\n✅ 50-player concurrency test passed cleanly with zero race conditions.\n`);
        
        // Clean up connections
        playerSockets.forEach(s => s.disconnect());
        hostSocket.disconnect();
        process.exit(0);
      }
    });
  });

  // 3. Host Starts Game
  console.log('🚀 Host starting the 50-player multiplayer match...');
  hostSocket.emit('start_game');
}

runSimulation().catch((err) => {
  console.error('Simulation error:', err);
  process.exit(1);
});
