import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { getSocket } from './services/socket';
import { api } from './services/api';
import { sound } from './services/audio';
import { Room, RoomParticipant, PublicQuestion, LeaderboardEntry, Question } from './types';

// Components
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { StudentDashboard } from './components/StudentDashboard';
import { StudentCustomQuizModal } from './components/StudentCustomQuizModal';
import { TopicSelectionStudio } from './components/TopicSelectionStudio';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { LiveQuizArena } from './components/LiveQuizArena';
import { PodiumResultsScreen } from './components/PodiumResultsScreen';
import { AnalyticsView } from './components/AnalyticsView';
import { HostPortal } from './components/HostPortal';
import { SocialLeaguesView } from './components/SocialLeaguesView';
import { SoloPracticeModal } from './components/SoloPracticeModal';

export const App: React.FC = () => {
  const { user, profile, isAuthenticated, isHost, isLoading } = useAuth();
  const socket = getSocket();

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('landing');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<'student' | 'host'>('student');
  const [inviteAuthPrompted, setInviteAuthPrompted] = useState(false);
  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(() => {
    const roomCode = new URLSearchParams(window.location.search).get('room');
    return roomCode?.trim().toUpperCase() || null;
  });

  // Student Custom Quiz Modal State
  const [customQuizModalOpen, setCustomQuizModalOpen] = useState<boolean>(false);
  const [customQuizInitialTopic, setCustomQuizInitialTopic] = useState<string | undefined>(undefined);

  // Multiplayer Game State
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<RoomParticipant[]>([]);
  const [isRoomHost, setIsRoomHost] = useState<boolean>(false);
  const [currentPublicQuestion, setCurrentPublicQuestion] = useState<PublicQuestion | null>(null);
  const [roundState, setRoundState] = useState<'question' | 'round_review'>('question');
  const [roundResult, setRoundResult] = useState<any>(null);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [finalPodium, setFinalPodium] = useState<LeaderboardEntry[]>([]);
  const [finalLeaderboard, setFinalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [finalTotalQuestions, setFinalTotalQuestions] = useState<number>(10);

  // Solo Practice Modal State
  const [soloModalOpen, setSoloModalOpen] = useState<boolean>(false);
  const [soloQuestions, setSoloQuestions] = useState<Question[]>([]);
  const [soloTitle, setSoloTitle] = useState<string>('Solo Practice Drill');

  // Initial redirect on auth change
  useEffect(() => {
    if (isAuthenticated && currentView === 'landing') {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!pendingRoomCode) return;
    if (!isAuthenticated) {
      if (!isLoading && !inviteAuthPrompted) {
        setAuthDefaultRole('student');
        setAuthModalOpen(true);
        setInviteAuthPrompted(true);
      }
      return;
    }

    window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    setPendingRoomCode(null);
    if (isHost) {
      setCurrentView('host_portal');
      return;
    }
    socket.emit('join_room', { roomCode: pendingRoomCode, isSpectator: false });
  }, [pendingRoomCode, isAuthenticated, isHost, isLoading, inviteAuthPrompted, socket]);

  // Socket.IO Multiplayer Lifecycle Listeners
  useEffect(() => {
    socket.on('room_joined', ({ room, isHost }) => {
      setActiveRoom(room);
      setIsRoomHost(isHost);
      setCurrentView('lobby');
    });

    socket.on('room_players_updated', ({ players }) => {
      setRoomPlayers(players || []);
    });

    socket.on('game_starting', ({ countdownSec, totalQuestions }) => {
      sound.playTick();
    });

    socket.on('round_started', ({ question, timeLimitSec }) => {
      setCurrentPublicQuestion(question);
      setRoundState('question');
      setRoundResult(null);
      setAnsweredCount(0);
      setCurrentView('game');
    });

    socket.on('answer_progress_updated', ({ answeredCount }) => {
      setAnsweredCount(answeredCount || 0);
    });

    socket.on('round_ended', (data) => {
      setRoundState('round_review');
      setRoundResult(data);
      sound.playTick();
    });

    socket.on('game_finished', ({ podium, leaderboard, totalQuestions }) => {
      setFinalPodium(podium || []);
      setFinalLeaderboard(leaderboard || []);
      setFinalTotalQuestions(totalQuestions || 10);
      setCurrentView('podium');
    });

    socket.on('error_message', ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off('room_joined');
      socket.off('room_players_updated');
      socket.off('game_starting');
      socket.off('round_started');
      socket.off('answer_progress_updated');
      socket.off('round_ended');
      socket.off('game_finished');
      socket.off('error_message');
    };
  }, [socket]);

  // Handler: Open Auth Modal
  const handleOpenAuth = (role: 'student' | 'host' = 'student') => {
    setAuthDefaultRole(role);
    setAuthModalOpen(true);
  };

  // Handler: Open Custom Quiz Wizard for Student
  const handleOpenCustomQuizWizard = (initialTopicId?: string) => {
    setCustomQuizInitialTopic(initialTopicId);
    setCustomQuizModalOpen(true);
  };

  // Handler: Start Configured Custom Quiz
  const handleStartCustomQuiz = async (config: {
    selectedTopics: string[];
    difficulty: string;
    questionCount: number;
    timePerQuestion: number;
    modeStyle?: string;
  }) => {
    try {
      const difficulty = ['easy', 'medium', 'hard', 'mixed'].includes(config.difficulty)
        ? config.difficulty
        : 'mixed';
      const targetCount = Math.max(1, Math.floor(config.questionCount));
      const selectedTopics = config.selectedTopics.includes('mixed')
        ? []
        : config.selectedTopics;
      const questionsByKey = new Map<string, Question>();
      let usedExpandedPool = false;
      const addQuestions = (questions: Question[] = []) => {
        for (const question of questions) {
          const key = question.id || question.statement;
          if (!questionsByKey.has(key)) questionsByKey.set(key, question);
        }
      };
      const loadQuestions = async (topics?: string[], filterDifficulty?: string) => {
        const topicId = topics?.length === 1 ? topics[0] : undefined;
        const topicFilters = topics && topics.length > 1 ? topics : undefined;
        const response = await api.getQuestions(topicId, filterDifficulty, 50, topicFilters);
        addQuestions(response.questions || []);
      };

      const selectedDifficulty = difficulty === 'mixed' ? undefined : difficulty;
      await loadQuestions(selectedTopics, selectedDifficulty);
      if (questionsByKey.size < targetCount && selectedDifficulty) {
        await loadQuestions(selectedTopics);
      }
      if (questionsByKey.size < targetCount) {
        usedExpandedPool = true;
        await loadQuestions(undefined, selectedDifficulty);
      }
      if (questionsByKey.size < targetCount) {
        await loadQuestions();
      }

      const questionsToUse = [...questionsByKey.values()].slice(0, targetCount).map((q) => ({
        ...q,
        solving_time_sec: config.timePerQuestion
      }));

      if (questionsToUse.length < targetCount) {
        alert(`Only ${questionsToUse.length} unique questions are available right now. Please choose a smaller question count.`);
        return;
      }

      setSoloQuestions(questionsToUse);
      const topicLabel = config.selectedTopics.includes('mixed') || config.selectedTopics.length === 0
        ? 'MIXED'
        : config.selectedTopics.join(', ').toUpperCase();
      const poolLabel = usedExpandedPool ? ' • Expanded question pool' : '';
      setSoloTitle(`Custom Sprint: ${topicLabel} (${difficulty.toUpperCase()})${poolLabel}`);
      setSoloModalOpen(true);
    } catch (err) {
      console.error('Failed to load custom quiz questions:', err);
      alert('Failed to launch custom quiz drill.');
    }
  };

  // Handler: Join Room by Code
  const handleJoinRoom = async (code: string) => {
    if (!isAuthenticated) {
      handleOpenAuth('student');
      return;
    }

    socket.emit('join_room', {
      roomCode: code,
      isSpectator: false
    });
  };

  // Handler: Create & Launch Multiplayer Room (Host)
  const handleCreateMultiplayerRoom = async (config: any) => {
    if (!isAuthenticated) {
      handleOpenAuth('host');
      return;
    }

    try {
      const res = await api.createRoom(config);
      if (res.room) {
        socket.emit('join_room', {
          roomCode: res.room.code,
          isSpectator: false
        });
      }
    } catch (err) {
      alert('Failed to create room.');
    }
  };

  // Handler: Quick Play Matchmaking
  const handleQuickPlay = async () => {
    try {
      const publicRooms = await api.getPublicRooms();
      if (publicRooms.rooms && publicRooms.rooms.length > 0) {
        handleJoinRoom(publicRooms.rooms[0].code);
      } else {
        handleCreateMultiplayerRoom({
          title: 'Quick Play Public Arena',
          topic_id: 'mixed',
          difficulty: 'medium',
          question_count: 5,
          time_per_question: 20
        });
      }
    } catch (err) {
      handleCreateMultiplayerRoom({
        title: 'Quick Play Arena',
        topic_id: 'mixed',
        difficulty: 'medium',
        question_count: 5,
        time_per_question: 20
      });
    }
  };

  // Handler: Host Starts Match
  const handleHostStartGame = () => {
    socket.emit('start_game');
  };

  // Handler: Advance to next round
  const handleNextRound = () => {
    socket.emit('next_round');
  };

  // Handler: Leave Current Room
  const handleLeaveRoom = () => {
    setActiveRoom(null);
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenAuth={(role) => handleOpenAuth(role)}
      />

      {/* Main Viewport Router */}
      <main className="flex-1">
        
        {/* Landing Page */}
        {currentView === 'landing' && (
          <LandingPage
            onPlayNow={() => {
              if (isAuthenticated) setCurrentView('dashboard');
              else handleOpenAuth('student');
            }}
            onHostQuiz={() => {
              if (isAuthenticated) setCurrentView('host_portal');
              else handleOpenAuth('host');
            }}
            onExploreFeatures={() => setCurrentView('topics')}
            onSelectTopic={(topicId) => {
              if (isAuthenticated) handleOpenCustomQuizWizard(topicId);
              else handleOpenAuth('student');
            }}
          />
        )}

        {/* Student Dashboard */}
        {currentView === 'dashboard' && !isHost && (
          <StudentDashboard
            onQuickPlay={handleQuickPlay}
            onJoinRoom={(code) => handleJoinRoom(code)}
            onOpenCustomQuizCreator={(topicId) => handleOpenCustomQuizWizard(topicId)}
            onOpenTopics={() => setCurrentView('topics')}
            onOpenAnalytics={() => setCurrentView('analytics')}
            onOpenLeagues={() => setCurrentView('leagues')}
          />
        )}

        {/* Topic Selection Studio */}
        {currentView === 'topics' && (
          <TopicSelectionStudio
            onStartSoloPractice={(config) => handleStartCustomQuiz({ ...config, modeStyle: 'standard' })}
            onCreateMultiplayerRoom={(config) => handleCreateMultiplayerRoom(config)}
            isHost={isHost}
          />
        )}

        {/* Multiplayer Lobby */}
        {currentView === 'lobby' && activeRoom && (
          <MultiplayerLobby
            room={activeRoom}
            players={roomPlayers}
            isHost={isRoomHost}
            onStartGame={handleHostStartGame}
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {/* Live Quiz Arena Gameplay */}
        {currentView === 'game' && currentPublicQuestion && (
          <LiveQuizArena
            question={currentPublicQuestion}
            roundState={roundState}
            roundResult={roundResult}
            answeredCount={answeredCount}
            totalPlayers={roomPlayers.length}
            isHost={isRoomHost}
            onNextRound={handleNextRound}
          />
        )}

        {/* Podium Final Results */}
        {currentView === 'podium' && (
          <PodiumResultsScreen
            podium={finalPodium}
            leaderboard={finalLeaderboard}
            totalQuestions={finalTotalQuestions}
            topic={activeRoom?.topicId}
            roomTitle={activeRoom?.title}
            onPlayAgain={() => handleQuickPlay()}
            onGoDashboard={() => setCurrentView('dashboard')}
            onFixWeakness={() => handleOpenCustomQuizWizard(activeRoom?.topicId || 'percentages')}
          />
        )}

        {/* Analytics & Weakness Intelligence */}
        {currentView === 'analytics' && (
          <AnalyticsView
            onFixWeakness={(topicId) => handleOpenCustomQuizWizard(topicId)}
          />
        )}

        {/* Host Portal */}
        {(currentView === 'host_portal' || (currentView === 'dashboard' && isHost)) && (
          <HostPortal
            onCreateLiveRoom={(config) => handleCreateMultiplayerRoom(config)}
          />
        )}

        {/* Social & Leagues View */}
        {currentView === 'leagues' && (
          <SocialLeaguesView
            onStartDailyChallenge={async () => {
              const res = await api.getDailyChallenge();
              if (res.challenge?.questions) {
                setSoloQuestions(res.challenge.questions);
                setSoloTitle(res.challenge.title);
                setSoloModalOpen(true);
              }
            }}
          />
        )}

      </main>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultRole={authDefaultRole}
        onSuccess={() => {
          setCurrentView('dashboard');
        }}
      />

      {/* Student Custom Quiz Setup Modal */}
      <StudentCustomQuizModal
        isOpen={customQuizModalOpen}
        onClose={() => setCustomQuizModalOpen(false)}
        initialTopicId={customQuizInitialTopic}
        onStartQuiz={handleStartCustomQuiz}
      />

      <SoloPracticeModal
        isOpen={soloModalOpen}
        onClose={() => setSoloModalOpen(false)}
        questions={soloQuestions}
        title={soloTitle}
      />

    </div>
  );
};
