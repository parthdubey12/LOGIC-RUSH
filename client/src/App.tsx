import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { getSocket } from './services/socket';
import { api } from './services/api';
import { sound } from './services/audio';
import { Room, RoomParticipant, PublicQuestion, LeaderboardEntry, Question, TeamLeaderboardEntry } from './types';

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
    const roomCode = new URLSearchParams(window.location.search).get('room') || sessionStorage.getItem('logicrush_room_code');
    return roomCode?.trim().toUpperCase() || null;
  });
  const [pendingSpectator, setPendingSpectator] = useState(() => (
    new URLSearchParams(window.location.search).get('watch') === '1' || sessionStorage.getItem('logicrush_room_spectator') === 'true'
  ));

  // Student Custom Quiz Modal State
  const [customQuizModalOpen, setCustomQuizModalOpen] = useState<boolean>(false);
  const [customQuizInitialTopic, setCustomQuizInitialTopic] = useState<string | undefined>(undefined);

  // Multiplayer Game State
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<RoomParticipant[]>([]);
  const [isRoomHost, setIsRoomHost] = useState<boolean>(false);
  const [isRoomSpectator, setIsRoomSpectator] = useState<boolean>(false);
  const [spectatorsCount, setSpectatorsCount] = useState<number>(0);
  const [questionAlreadyAnswered, setQuestionAlreadyAnswered] = useState(false);
  const [currentPublicQuestion, setCurrentPublicQuestion] = useState<PublicQuestion | null>(null);
  const [roundState, setRoundState] = useState<'question' | 'round_review'>('question');
  const [roundResult, setRoundResult] = useState<any>(null);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [finalPodium, setFinalPodium] = useState<LeaderboardEntry[]>([]);
  const [finalLeaderboard, setFinalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [finalTeamLeaderboard, setFinalTeamLeaderboard] = useState<TeamLeaderboardEntry[]>([]);
  const [finalTotalQuestions, setFinalTotalQuestions] = useState<number>(10);

  // Solo Practice Modal State
  const [soloModalOpen, setSoloModalOpen] = useState<boolean>(false);
  const [soloQuestions, setSoloQuestions] = useState<Question[]>([]);
  const [dailyChallengeId, setDailyChallengeId] = useState<string | null>(null);
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
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
    socket.emit('join_room', { roomCode: pendingRoomCode, isSpectator: pendingSpectator });
  }, [pendingRoomCode, pendingSpectator, isAuthenticated, isHost, isLoading, inviteAuthPrompted, socket]);

  // Socket.IO Multiplayer Lifecycle Listeners
  useEffect(() => {
    socket.on('latency_probe', ({ nonce }) => {
      socket.emit('latency_pong', { nonce });
    });

    socket.on('room_joined', ({ room, isHost, isSpectator, recovery }) => {
      setActiveRoom(room);
      setIsRoomHost(isHost);
      setIsRoomSpectator(isSpectator);
      sessionStorage.setItem('logicrush_room_code', room.code);
      sessionStorage.setItem('logicrush_room_spectator', String(isSpectator));
      if (recovery?.status === 'question' && recovery.question) {
        setCurrentPublicQuestion({
          ...recovery.question,
          receivedAt: performance.now()
        });
        setQuestionAlreadyAnswered(recovery.answered === true);
        setRoundState('question');
        setCurrentView('game');
      } else if (recovery?.status === 'round_review' && recovery.result) {
        setRoundResult(recovery.result);
        setRoundState('round_review');
        setCurrentView('game');
      } else if (recovery?.status === 'finished') {
        setFinalPodium(recovery.podium || []);
        setFinalLeaderboard(recovery.leaderboard || []);
        setFinalTeamLeaderboard(recovery.teamLeaderboard || []);
        setFinalTotalQuestions(recovery.totalQuestions || 10);
        setCurrentView('podium');
      } else {
        setCurrentView('lobby');
      }
    });

    socket.on('room_players_updated', ({ players, spectatorsCount: nextSpectatorsCount }) => {
      setRoomPlayers(players || []);
      setSpectatorsCount(nextSpectatorsCount || 0);
    });

    socket.on('game_starting', ({ countdownSec, totalQuestions }) => {
      sound.playTick();
    });

    socket.on('round_started', ({ question, remainingTimeMs }) => {
      setCurrentPublicQuestion({ ...question, remainingTimeMs, receivedAt: performance.now() });
      setQuestionAlreadyAnswered(false);
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

    socket.on('game_finished', ({ podium, leaderboard, teamLeaderboard, totalQuestions }) => {
      setFinalPodium(podium || []);
      setFinalLeaderboard(leaderboard || []);
      setFinalTeamLeaderboard(teamLeaderboard || []);
      setFinalTotalQuestions(totalQuestions || 10);
      setCurrentView('podium');
    });

    socket.on('error_message', ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off('room_joined');
      socket.off('latency_probe');
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
      setDailyChallengeId(null);
      const selectedTopics = config.selectedTopics.includes('mixed')
        ? []
        : config.selectedTopics;
      const difficulty = ['easy', 'medium', 'hard', 'mixed'].includes(config.difficulty) ? config.difficulty : 'mixed';
      const session = await api.startPracticeSession({
        topics: selectedTopics,
        difficulty,
        question_count: Math.max(1, Math.floor(config.questionCount))
      });
      const questionsToUse = (session.questions as Question[]).map((q) => ({
        ...q,
        solving_time_sec: config.timePerQuestion
      }));
      setPracticeSessionId(session.session_id);
      setSoloQuestions(questionsToUse);
      const topicLabel = config.selectedTopics.includes('mixed') || config.selectedTopics.length === 0
        ? 'MIXED'
        : config.selectedTopics.join(', ').toUpperCase();
      setSoloTitle(`Custom Sprint: ${topicLabel} (${difficulty.toUpperCase()})`);
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
    socket.emit('leave_room');
    sessionStorage.removeItem('logicrush_room_code');
    sessionStorage.removeItem('logicrush_room_spectator');
    setActiveRoom(null);
    setIsRoomSpectator(false);
    setIsRoomHost(false);
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
            isSpectator={isRoomSpectator}
            spectatorsCount={spectatorsCount}
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
            isSpectator={isRoomSpectator}
            hasSubmittedInitially={questionAlreadyAnswered}
            onNextRound={handleNextRound}
          />
        )}

        {/* Podium Final Results */}
        {currentView === 'podium' && (
          <PodiumResultsScreen
            podium={finalPodium}
            leaderboard={finalLeaderboard}
            teamLeaderboard={finalTeamLeaderboard}
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
              if (!isAuthenticated) {
                handleOpenAuth('student');
                return;
              }
              const res = await api.getDailyChallenge();
              if (res.challenge?.questions) {
                setDailyChallengeId(res.challenge.id);
                setPracticeSessionId(null);
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
        questions={soloQuestions}
        title={soloTitle}
        dailyChallengeId={dailyChallengeId}
        practiceSessionId={practiceSessionId}
        onClose={() => {
          setSoloModalOpen(false);
          setDailyChallengeId(null);
          setPracticeSessionId(null);
        }}
      />

    </div>
  );
};
