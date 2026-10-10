import React, { useState } from 'react';
import { Topic } from '../types';
import {
  Brain,
  Calculator,
  Code,
  Compass,
  Layers,
  Users,
  Briefcase,
  Flame,
  Check,
  Play,
  Sliders,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  HelpCircle,
  Hash,
  Dices,
  Percent,
  Terminal,
  Cpu,
  BookOpen,
  PieChart,
  Target
} from 'lucide-react';

interface TopicSelectionStudioProps {
  onStartSoloPractice: (config: {
    selectedTopics: string[];
    difficulty: string;
    questionCount: number;
    timePerQuestion: number;
  }) => void;
  onCreateMultiplayerRoom?: (config: {
    topicId: string;
    difficulty: string;
    questionCount: number;
    timePerQuestion: number;
  }) => void;
  isHost?: boolean;
}

const ALL_TOPICS: Topic[] = [
  { id: 'quant', name: 'Quantitative Aptitude', description: 'Mathematical problem solving, algebra, geometry & numbers', category: 'Math', icon: 'Calculator' },
  { id: 'reasoning', name: 'Logical Reasoning', description: 'Deductive logic, patterns, and analytical reasoning', category: 'Logic', icon: 'Brain' },
  { id: 'verbal', name: 'Verbal Ability', description: 'Vocabulary, grammar, reading comprehension & sentence completion', category: 'Verbal', icon: 'BookOpen' },
  { id: 'di', name: 'Data Interpretation', description: 'Charts, tables, graphs & data analysis', category: 'Analytics', icon: 'PieChart' },
  { id: 'num_series', name: 'Number Series', description: 'Sequence completion, missing number puzzles', category: 'Logic', icon: 'Hash' },
  { id: 'probability', name: 'Probability and Permutations', description: 'Combinatorics, chance calculations & arrangements', category: 'Math', icon: 'Dices' },
  { id: 'percentages', name: 'Percentages, Ratios and Averages', description: 'Ratio proportion, average calculations & percentages', category: 'Math', icon: 'Percent' },
  { id: 'tsd', name: 'Time, Speed and Distance', description: 'Relative velocity, trains, boats & streams', category: 'Math', icon: 'Zap' },
  { id: 'profit_loss', name: 'Profit, Loss and Interest', description: 'Simple & compound interest, markups & discounts', category: 'Math', icon: 'TrendingUp' },
  { id: 'coding_decoding', name: 'Coding-Decoding', description: 'Cipher puzzles, letter shifters & symbol codes', category: 'Logic', icon: 'Code' },
  { id: 'blood_relations', name: 'Blood Relations and Direction Sense', description: 'Family tree puzzles and compass directions', category: 'Logic', icon: 'Compass' },
  { id: 'syllogisms', name: 'Syllogisms and Puzzles', description: 'Venn diagrams, statement conclusions & analytical logic', category: 'Logic', icon: 'Layers' },
  { id: 'seating', name: 'Seating Arrangements', description: 'Linear, circular & complex seating puzzles', category: 'Logic', icon: 'Users' },
  { id: 'critical', name: 'Critical Reasoning', description: 'Strengthening/weakening arguments, assumptions', category: 'Verbal', icon: 'Target' },
  { id: 'dsa', name: 'Data Structures and Algorithms', description: 'Arrays, trees, graphs, sorting & algorithmic complexity', category: 'Tech', icon: 'Cpu' },
  { id: 'programming', name: 'Basic Programming', description: 'Loops, recursion, OOP concepts & code output predictions', category: 'Tech', icon: 'Terminal' },
  { id: 'placement', name: 'Placement and Company-Specific Aptitude', description: 'Real placement questions from TCS, Infosys, Wipro, Amazon', category: 'Placement', icon: 'Briefcase' },
  { id: 'mixed', name: 'Mixed Challenge', description: 'Randomized high-speed mix of all aptitude topics', category: 'Special', icon: 'Flame' }
];

const CATEGORIES = ['All', 'Math', 'Logic', 'Tech', 'Placement', 'Analytics', 'Verbal'];

export const TopicSelectionStudio: React.FC<TopicSelectionStudioProps> = ({
  onStartSoloPractice,
  onCreateMultiplayerRoom,
  isHost
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(['percentages', 'tsd', 'placement']);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(25);

  const toggleTopic = (id: string) => {
    if (id === 'mixed') {
      setSelectedTopicIds(['mixed']);
      return;
    }

    if (selectedTopicIds.includes('mixed')) {
      setSelectedTopicIds([id]);
      return;
    }

    if (selectedTopicIds.includes(id)) {
      if (selectedTopicIds.length > 1) {
        setSelectedTopicIds(selectedTopicIds.filter(t => t !== id));
      }
    } else {
      setSelectedTopicIds([...selectedTopicIds, id]);
    }
  };

  const filteredTopics = selectedCategory === 'All'
    ? ALL_TOPICS
    : ALL_TOPICS.filter(t => t.category === selectedCategory || t.category === 'Special');

  const handleLaunchSolo = () => {
    onStartSoloPractice({
      selectedTopics: selectedTopicIds,
      difficulty,
      questionCount,
      timePerQuestion
    });
  };

  const handleLaunchRoom = () => {
    if (onCreateMultiplayerRoom) {
      onCreateMultiplayerRoom({
        topicId: selectedTopicIds[0] || 'mixed',
        difficulty,
        questionCount,
        timePerQuestion
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Studio Header */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-purple-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-brand-cyan text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                Curriculum & Topic Studio
              </span>
              <span className="text-xs text-slate-400 font-semibold">• 18 Comprehensive Tracks</span>
            </div>
            <h2 className="text-3xl font-black text-white font-['Outfit']">
              CUSTOMIZE YOUR <span className="text-gradient">APTITUDE SPRINT</span>
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Select one or multiple topics, adjust the countdown intensity, and jump into solo training or launch a multiplayer room.
            </p>
          </div>

          {/* Quick Config Pill */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 text-xs font-bold text-slate-300">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Selected</span>
              <span className="text-white text-sm font-extrabold">{selectedTopicIds.length} Topics</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Questions</span>
              <span className="text-cyan-400 text-sm font-extrabold">{questionCount} Qs</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Per Question</span>
              <span className="text-amber-400 text-sm font-extrabold">{timePerQuestion}s</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left 3 Columns: Topic Cards Grid & Category Filters */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredTopics.map((topic) => {
              const isSelected = selectedTopicIds.includes(topic.id);

              return (
                <div
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between select-none ${
                    isSelected
                      ? 'bg-purple-950/50 border-purple-500 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700">
                        {topic.category}
                      </span>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-purple-500 text-white' : 'bg-slate-800 text-transparent border border-slate-700'
                      }`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <h4 className="font-bold text-base text-white mb-1 leading-snug">
                      {topic.name}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {topic.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <span>Est. 20-30s / Q</span>
                    <span className="text-cyan-400">High Placement Yield</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right 1 Column: Sprint Configuration Sidebar */}
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/90 border border-slate-800 space-y-6 self-start">
          
          <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-brand-violet" />
            Sprint Parameters
          </div>

          {/* Difficulty Setting */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">Difficulty Tier</label>
            <div className="grid grid-cols-2 gap-2">
              {(['easy', 'medium', 'hard', 'mixed'] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                    difficulty === d
                      ? 'bg-purple-600 text-white border-purple-400 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
              <span>Question Count</span>
              <span className="text-cyan-400 font-mono font-extrabold">{questionCount} Questions</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    questionCount === cnt
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Time Limit per Question */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
              <span>Timer per Round</span>
              <span className="text-amber-400 font-mono font-extrabold">{timePerQuestion} Seconds</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[15, 20, 30, 45].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimePerQuestion(t)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    timePerQuestion === t
                      ? 'bg-amber-600 text-white border-amber-400 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {t}s
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <button
              onClick={handleLaunchSolo}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm shadow-lg shadow-purple-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              Launch Solo Sprint
            </button>

            {isHost && onCreateMultiplayerRoom && (
              <button
                onClick={handleLaunchRoom}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Create Multiplayer Room
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
