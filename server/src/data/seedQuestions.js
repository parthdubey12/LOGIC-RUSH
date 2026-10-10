export const defaultTopics = [
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

export const seedQuestions = [
  // ================= 1. PERCENTAGES, RATIOS & AVERAGES =================
  {
    id: 'q1',
    topic_id: 'percentages',
    statement: 'If the price of sugar increases by 25%, by what percentage must a household reduce its consumption so that the expenditure remains constant?',
    options: JSON.stringify(['15%', '20%', '25%', '30%']),
    correct_option: 1, // 20%
    explanation: 'Formula: Percentage reduction = [r / (100 + r)] * 100% = [25 / 125] * 100% = (1/5) * 100% = 20%.',
    difficulty: 'medium',
    solving_time_sec: 30,
    tags: 'percentages,placement,shortcut'
  },
  {
    id: 'q2',
    topic_id: 'percentages',
    statement: 'A student has to secure 40% marks to pass an exam. If he gets 178 marks and fails by 22 marks, what is the maximum marks for the examination?',
    options: JSON.stringify(['400', '500', '520', '600']),
    correct_option: 1, // 500
    explanation: 'Passing marks required = 178 + 22 = 200. Since 40% of Maximum Marks = 200, Total Marks = 200 / 0.40 = 500.',
    difficulty: 'easy',
    solving_time_sec: 25,
    tags: 'percentages,basic'
  },
  {
    id: 'q3',
    topic_id: 'percentages',
    statement: 'The ratio of boys to girls in a college is 4:5. If 20% of boys and 25% of girls are scholarship holders, what percentage of students do NOT get scholarships?',
    options: JSON.stringify(['72.2%', '77.2%', '80.0%', '82.5%']),
    correct_option: 1, // 77.2%
    explanation: 'Let boys = 400, girls = 500 (total = 900). Non-scholarship boys = 80% of 400 = 320. Non-scholarship girls = 75% of 500 = 375. Total non-scholarship = 695. Percentage = (695/900) * 100% = 77.2%.',
    difficulty: 'hard',
    solving_time_sec: 35,
    tags: 'percentages,ratios,placement'
  },
  {
    id: 'q3b',
    topic_id: 'percentages',
    statement: 'The average of 5 consecutive odd numbers is 61. What is the difference between the highest and lowest numbers?',
    options: JSON.stringify(['4', '6', '8', '10']),
    correct_option: 2, // 8
    explanation: 'Numbers are 57, 59, 61, 63, 65. Difference = 65 - 57 = 8 (Formula: 2*(n-1) = 2*4 = 8).',
    difficulty: 'easy',
    solving_time_sec: 20,
    tags: 'averages,shortcut'
  },
  {
    id: 'q3c',
    topic_id: 'percentages',
    statement: 'A salary is first increased by 30% and then decreased by 30%. What is the net percentage change in salary?',
    options: JSON.stringify(['0% No change', '6% decrease', '9% decrease', '9% increase']),
    correct_option: 2, // 9% decrease
    explanation: 'Successive percentage formula: +30 - 30 - (30*30)/100 = -9% (net 9% decrease).',
    difficulty: 'easy',
    solving_time_sec: 20,
    tags: 'percentages,successive'
  },
  {
    id: 'q3d',
    topic_id: 'percentages',
    statement: 'If A:B = 2:3, B:C = 4:5, and C:D = 6:7, find the ratio A:D.',
    options: JSON.stringify(['16:35', '8:15', '12:35', '24:35']),
    correct_option: 0, // 16:35
    explanation: 'A/D = (A/B) * (B/C) * (C/D) = (2/3) * (4/5) * (6/7) = 48 / 105 = 16 / 35.',
    difficulty: 'medium',
    solving_time_sec: 25,
    tags: 'ratios,shortcut'
  },

  // ================= 2. TIME, SPEED AND DISTANCE =================
  {
    id: 'q4',
    topic_id: 'tsd',
    statement: 'A train 150 meters long passes a pole in 15 seconds. What is the speed of the train in km/h?',
    options: JSON.stringify(['30 km/h', '36 km/h', '45 km/h', '54 km/h']),
    correct_option: 1, // 36 km/h
    explanation: 'Speed in m/s = Distance / Time = 150 / 15 = 10 m/s. Convert to km/h by multiplying by 18/5: 10 * (18 / 5) = 36 km/h.',
    difficulty: 'easy',
    solving_time_sec: 25,
    tags: 'tsd,trains'
  },
  {
    id: 'q5',
    topic_id: 'tsd',
    statement: 'Walking at 3/4th of his usual speed, a man reaches his office 20 minutes late. What is his usual time to reach the office?',
    options: JSON.stringify(['40 mins', '50 mins', '60 mins', '80 mins']),
    correct_option: 2, // 60 mins
    explanation: 'Since speed ratio is 3:4, time ratio is 4:3. The difference in time is 1 unit = 20 minutes. Usual time = 3 units = 3 * 20 = 60 minutes.',
    difficulty: 'medium',
    solving_time_sec: 30,
    tags: 'tsd,ratio,shortcut'
  },
  {
    id: 'q6',
    topic_id: 'tsd',
    statement: 'A boat travels 24 km upstream in 6 hours and 28 km downstream in 4 hours. What is the speed of the stream?',
    options: JSON.stringify(['1.5 km/h', '2.0 km/h', '2.5 km/h', '3.0 km/h']),
    correct_option: 0, // 1.5 km/h
    explanation: 'Upstream speed (U) = 24/6 = 4 km/h. Downstream speed (D) = 28/4 = 7 km/h. Stream Speed = (D - U) / 2 = (7 - 4) / 2 = 1.5 km/h.',
    difficulty: 'medium',
    solving_time_sec: 30,
    tags: 'tsd,boats'
  },
  {
    id: 'q6b',
    topic_id: 'tsd',
    statement: 'Two trains of length 140m and 160m are running in opposite directions at 60 km/h and 48 km/h. In how many seconds will they cross each other?',
    options: JSON.stringify(['8 seconds', '10 seconds', '12 seconds', '15 seconds']),
    correct_option: 1, // 10 seconds
    explanation: 'Total distance = 140 + 160 = 300m. Relative speed = 60 + 48 = 108 km/h = 108 * (5/18) = 30 m/s. Time = 300 / 30 = 10 seconds.',
    difficulty: 'hard',
    solving_time_sec: 30,
    tags: 'tsd,trains,relative_velocity'
  },
  {
    id: 'q6c',
    topic_id: 'tsd',
    statement: 'A car covers a distance at 60 km/h and returns along the same route at 40 km/h. What is the average speed for the whole journey?',
    options: JSON.stringify(['48 km/h', '50 km/h', '52 km/h', '55 km/h']),
    correct_option: 0, // 48 km/h
    explanation: 'Average speed for equal distances = 2xy / (x + y) = 2(60)(40) / (60 + 40) = 4800 / 100 = 48 km/h.',
    difficulty: 'medium',
    solving_time_sec: 25,
    tags: 'tsd,averages'
  },

  // ================= 3. NUMBER SERIES =================
  {
    id: 'q7',
    topic_id: 'num_series',
    statement: 'Find the next number in the series: 7, 10, 16, 28, 52, ?',
    options: JSON.stringify(['88', '96', '100', '104']),
    correct_option: 2, // 100
    explanation: 'Differences between consecutive terms: 10-7=3, 16-10=6, 28-16=12, 52-28=24. Differences double each time. Next difference is 48. So 52 + 48 = 100.',
    difficulty: 'medium',
    solving_time_sec: 30,
    tags: 'series,patterns'
  },
  {
    id: 'q8',
    topic_id: 'num_series',
    statement: 'Identify the missing term: 2, 6, 12, 20, 30, 42, ?',
    options: JSON.stringify(['52', '54', '56', '60']),
    correct_option: 2, // 56
    explanation: 'Pattern is n*(n+1): 1*2=2, 2*3=6, 3*4=12, 4*5=20, 5*6=30, 6*7=42. Next term is 7*8 = 56.',
    difficulty: 'easy',
    solving_time_sec: 20,
    tags: 'series'
  },
  {
    id: 'q9',
    topic_id: 'num_series',
    statement: 'Find the odd one out in the series: 3, 5, 11, 14, 17, 21',
    options: JSON.stringify(['11', '14', '17', '21']),
    correct_option: 1, // 14
    explanation: 'All numbers in the sequence are odd numbers except 14, which is the only even number.',
    difficulty: 'easy',
    solving_time_sec: 15,
    tags: 'series,odd_one_out'
  },
  {
    id: 'q9b',
    topic_id: 'num_series',
    statement: 'Find the missing number: 1, 8, 27, 64, 125, ?',
    options: JSON.stringify(['196', '216', '256', '343']),
    correct_option: 1, // 216
    explanation: 'Cubes of natural numbers: 1³=1, 2³=8, 3³=27, 4³=64, 5³=125. Next is 6³ = 216.',
    difficulty: 'easy',
    solving_time_sec: 15,
    tags: 'series,cubes'
  },
  {
    id: 'q9c',
    topic_id: 'num_series',
    statement: 'What comes next in the sequence: 4, 18, 48, 100, 180, ?',
    options: JSON.stringify(['244', '280', '294', '312']),
    correct_option: 2, // 294
    explanation: 'Pattern is n²*(n+1) or (n³ - n²): 2³-2²=4, 3³-3²=18, 4³-4²=48, 5³-5²=100, 6³-6²=180. Next is 7³-7² = 343-49 = 294.',
    difficulty: 'hard',
    solving_time_sec: 35,
    tags: 'series,patterns'
  },

  // ================= 4. PROBABILITY & PERMUTATIONS =================
  {
    id: 'q10',
    topic_id: 'probability',
    statement: 'Two dice are rolled simultaneously. What is the probability that the sum of the numbers appearing on top is 8?',
    options: JSON.stringify(['1/6', '5/36', '1/9', '7/36']),
    correct_option: 1, // 5/36
    explanation: 'Favorable outcomes for sum = 8: (2,6), (3,5), (4,4), (5,3), (6,2) -> 5 outcomes out of 36 total. Probability = 5/36.',
    difficulty: 'medium',
    solving_time_sec: 30,
    tags: 'probability,dice'
  },
  {
    id: 'q11',
    topic_id: 'probability',
    statement: 'In how many different ways can the letters of the word "LOGIC" be arranged?',
    options: JSON.stringify(['24', '60', '120', '720']),
    correct_option: 2, // 120
    explanation: 'The word "LOGIC" contains 5 unique letters. Number of permutations = 5! = 5 * 4 * 3 * 2 * 1 = 120 ways.',
    difficulty: 'easy',
    solving_time_sec: 20,
    tags: 'permutations'
  },
  {
    id: 'q12',
    topic_id: 'probability',
    statement: 'A bag contains 4 red balls and 6 blue balls. If 2 balls are drawn at random without replacement, what is the probability that both are red?',
    options: JSON.stringify(['2/15', '4/25', '1/5', '6/45']),
    correct_option: 0, // 2/15
    explanation: 'P(1st Red) = 4/10. P(2nd Red | 1st Red) = 3/9. Total P = (4/10) * (3/9) = 12/90 = 2/15.',
    difficulty: 'medium',
    solving_time_sec: 30,
    tags: 'probability,combinations'
  },
  {
    id: 'q12b',
    topic_id: 'probability',
    statement: 'A card is drawn from a well-shuffled pack of 52 playing cards. What is the probability of getting a King or a Spade?',
    options: JSON.stringify(['4/13', '1/4', '17/52', '16/52']),
    correct_option: 3, // 16/52 = 4/13
    explanation: 'There are 4 Kings and 13 Spades (with 1 King of Spades counted in both). Total favorable = 4 + 13 - 1 = 16. P = 16/52 = 4/13.',
    difficulty: 'medium',
    solving_time_sec: 25,
    tags: 'probability,cards'
  },

  // ================= 5. PROFIT, LOSS AND INTEREST =================
  {
    id: 'q13',
    topic_id: 'profit_loss',
    statement: 'A shopkeeper sells an item for $240, incurring a loss of 20%. At what price should he sell it to gain 20% profit?',
    options: JSON.stringify(['$300', '$320', '$360', '$400']),
    correct_option: 2, // $360
    explanation: 'Cost Price (CP) = Selling Price / (1 - Loss) = 240 / 0.80 = $300. Required SP for 20% gain = CP * (1 + Profit) = 300 * 1.20 = $360.',
    difficulty: 'medium',
    solving_time_sec: 30,
    tags: 'profit_loss'
  },
  {
    id: 'q14',
    topic_id: 'profit_loss',
    statement: 'The simple interest on a sum of money for 3 years at 8% per annum is $480. What is the principal sum?',
    options: JSON.stringify(['$1,800', '$2,000', '$2,400', '$2,500']),
    correct_option: 1, // $2,000
    explanation: 'SI = (P * R * T) / 100 => 480 = (P * 8 * 3) / 100 => 480 = 24P / 100 => P = (480 * 100) / 24 = $2,000.',
    difficulty: 'easy',
    solving_time_sec: 25,
    tags: 'interest,simple'
  },
  {
    id: 'q14b',
    topic_id: 'profit_loss',
    statement: 'A dishonest trader claims to sell his goods at Cost Price but uses a false weight of 900 grams for 1 kg. What is his percentage profit?',
    options: JSON.stringify(['10%', '11.11%', '12.5%', '15%']),
    correct_option: 1, // 11.11%
    explanation: 'Profit% = [Error / (True Value - Error)] * 100% = [100 / 900] * 100% = 11.11%.',
    difficulty: 'medium',
    solving_time_sec: 25,
    tags: 'profit_loss,false_weight'
  },

  // ================= 6. CODING DECODING =================
  {
    id: 'q15',
    topic_id: 'coding_decoding',
    statement: 'If "PYTHON" is coded as "QZUIPO", how is "RUST" coded in that same language?',
    options: JSON.stringify(['SVTU', 'TVTU', 'SUTV', 'SVTV']),
    correct_option: 0, // SVTU
    explanation: 'Each letter is shifted by +1 in alphabetical position: R->S, U->V, S->T, T->U -> SVTU.',
    difficulty: 'easy',
    solving_time_sec: 20,
    tags: 'coding,logic'
  },
  {
    id: 'q16',
    topic_id: 'coding_decoding',
    statement: 'In a certain code, "FIRE" is written as "6-9-18-5" and "SNOW" is written as "19-14-15-23". What is the code for "RAIN"?',
    options: JSON.stringify(['18-1-9-14', '17-1-8-13', '18-2-10-15', '19-1-9-14']),
    correct_option: 0, // 18-1-9-14
    explanation: 'The code assigns the direct alphabetical position of each letter: R=18, A=1, I=9, N=14 -> 18-1-9-14.',
    difficulty: 'easy',
    solving_time_sec: 15,
    tags: 'coding_decoding'
  },
  {
    id: 'q16b',
    topic_id: 'coding_decoding',
    statement: 'If "MONKEY" is written as "XDJMNL", how is "TIGER" written in that code?',
    options: JSON.stringify(['SHFDQ', 'QDFHS', 'SDFHS', 'QDFHT']),
    correct_option: 1, // QDFHS
    explanation: 'Reverse the word and subtract 1 from each letter: TIGER -> REGIT -> R-1=Q, E-1=D, G-1=F, I-1=H, T-1=S -> QDFHS.',
    difficulty: 'hard',
    solving_time_sec: 30,
    tags: 'coding_decoding,reverse_shift'
  },

  // ================= 7. BLOOD RELATIONS & DIRECTIONS =================
  {
    id: 'q17',
    topic_id: 'blood_relations',
    statement: 'Pointing to a photograph, Rohit said, "She is the daughter of my grandfather\'s only son." How is the woman in the photograph related to Rohit?',
    options: JSON.stringify(['Mother', 'Aunt', 'Sister', 'Cousin']),
    correct_option: 2, // Sister
    explanation: 'Rohit\'s grandfather\'s only son = Rohit\'s father. The daughter of Rohit\'s father is Rohit\'s Sister.',
    difficulty: 'easy',
    solving_time_sec: 20,
    tags: 'blood_relations'
  },
  {
    id: 'q18',
    topic_id: 'blood_relations',
    statement: 'A person walks 10 meters North, turns right and walks 15 meters, then turns right again and walks 10 meters. How far and in which direction is he from his starting point?',
    options: JSON.stringify(['15 meters East', '15 meters West', '10 meters North', '25 meters East']),
    correct_option: 0, // 15 meters East
    explanation: 'North 10m and South 10m cancel each other out on the vertical axis. The remaining displacement is 15 meters towards the East.',
    difficulty: 'easy',
    solving_time_sec: 20,
    tags: 'direction_sense'
  },
  {
    id: 'q18b',
    topic_id: 'blood_relations',
    statement: 'A is B\'s sister. C is B\'s mother. D is C\'s father. E is D\'s mother. Then, how is A related to D?',
    options: JSON.stringify(['Granddaughter', 'Daughter', 'Grandmother', 'Grandson']),
    correct_option: 0, // Granddaughter
    explanation: 'A is female and child of C. Since D is father of C, A is the Granddaughter of D.',
    difficulty: 'medium',
    solving_time_sec: 25,
    tags: 'blood_relations'
  },

  // ================= 8. SYLLOGISMS & PUZZLES =================
  {
    id: 'q19',
    topic_id: 'syllogisms',
    statement: 'Statements: (1) All cats are dogs. (2) All dogs are birds.\nConclusions: I. All cats are birds. II. Some birds are cats.',
    options: JSON.stringify(['Only I follows', 'Only II follows', 'Neither follows', 'Both I and II follow']),
    correct_option: 3, // Both I and II follow
    explanation: 'Cats ⊆ Dogs ⊆ Birds. Therefore, All cats are birds (Conclusion I) and Some birds are cats (Conclusion II) both strictly follow.',
    difficulty: 'medium',
    solving_time_sec: 25,
    tags: 'syllogism,logic'
  },
  {
    id: 'q20',
    topic_id: 'syllogisms',
    statement: 'Statements: (1) Some pens are books. (2) All books are papers.\nConclusions: I. Some papers are pens. II. All papers are pens.',
    options: JSON.stringify(['Only I follows', 'Only II follows', 'Both follow', 'Neither follows']),
    correct_option: 0, // Only I follows
    explanation: 'Since Pens intersect with Books, and all Books are within Papers, the overlap between Pens and Papers is guaranteed (Some papers are pens). But not all papers are pens.',
    difficulty: 'medium',
    solving_time_sec: 25,
    tags: 'syllogisms'
  },

  // ================= 9. SEATING ARRANGEMENTS =================
  {
    id: 'q21',
    topic_id: 'seating',
    statement: 'Five friends A, B, C, D, E are sitting in a row facing North. C is sitting in the middle. A is at the extreme left end and B is adjacent to C on the right. Who is sitting immediately to the left of C?',
    options: JSON.stringify(['A', 'D or E', 'B', 'E only']),
    correct_option: 1, // D or E
    explanation: '5 seats: [1, 2, 3, 4, 5]. A is at 1. C is at 3 (middle). B is at 4 (right of C). Seat 2 (left of C) must be occupied by either D or E.',
    difficulty: 'medium',
    solving_time_sec: 30,
    tags: 'seating_arrangements'
  },
  {
    id: 'q21b',
    topic_id: 'seating',
    statement: 'Six people P, Q, R, S, T, U sit in a circle facing the center. P is opposite S. Q is to the immediate right of P. R is opposite Q. Who is to the immediate left of S?',
    options: JSON.stringify(['R', 'T', 'Q', 'U']),
    correct_option: 0, // R
    explanation: 'Since Q is right of P and R is opposite Q, R sits adjacent to S on S\'s left in circular orientation.',
    difficulty: 'hard',
    solving_time_sec: 35,
    tags: 'seating_circular'
  },

  // ================= 10. DATA STRUCTURES & TECH =================
  {
    id: 'q22',
    topic_id: 'dsa',
    statement: 'What is the worst-case time complexity of the QuickSort algorithm?',
    options: JSON.stringify(['O(N log N)', 'O(N)', 'O(N²)', 'O(log N)']),
    correct_option: 2, // O(N²)
    explanation: 'QuickSort has a worst-case time complexity of O(N²) when poorly chosen pivots cause highly unbalanced partitions (such as already sorted arrays with first element pivot).',
    difficulty: 'medium',
    solving_time_sec: 20,
    tags: 'dsa,sorting,algorithms'
  },
  {
    id: 'q23',
    topic_id: 'dsa',
    statement: 'Which data structure is primarily used to implement Breadth-First Search (BFS) on a graph?',
    options: JSON.stringify(['Stack', 'Queue', 'Heap', 'Binary Search Tree']),
    correct_option: 1, // Queue
    explanation: 'BFS explores neighbors level-by-level using a FIFO (First-In, First-Out) Queue data structure. DFS uses a Stack.',
    difficulty: 'easy',
    solving_time_sec: 15,
    tags: 'dsa,graphs'
  },
  {
    id: 'q23b',
    topic_id: 'dsa',
    statement: 'What is the minimum number of queues needed to implement a Priority Queue with N distinct priorities?',
    options: JSON.stringify(['1 queue', '2 queues', 'N queues', 'log N queues']),
    correct_option: 2, // N queues (or multi-level FIFO queues)
    explanation: 'A multi-level priority queue bucket array allocates 1 FIFO queue per distinct priority level (N queues total).',
    difficulty: 'hard',
    solving_time_sec: 25,
    tags: 'dsa,priority_queue'
  },

  // ================= 11. BASIC PROGRAMMING =================
  {
    id: 'q24',
    topic_id: 'programming',
    statement: 'What will be the output of the expression `[1, 2, 3] + [4, 5]` in Python?',
    options: JSON.stringify(['[5, 7, 3]', '[1, 2, 3, 4, 5]', 'TypeError: unsupported operand', '[9]']),
    correct_option: 1, // [1, 2, 3, 4, 5]
    explanation: 'In Python, the `+` operator on lists concatenates the two list objects into a new list `[1, 2, 3, 4, 5]`.',
    difficulty: 'easy',
    solving_time_sec: 15,
    tags: 'python,programming'
  },
  {
    id: 'q25',
    topic_id: 'programming',
    statement: 'In JavaScript, what is the value of `typeof null`?',
    options: JSON.stringify(['"null"', '"undefined"', '"object"', '"boolean"']),
    correct_option: 2, // "object"
    explanation: 'In JavaScript, `typeof null` returns `"object"` due to a legacy bug in the original implementation where the type tag for objects was 0 and null was represented as a NULL pointer (0x00).',
    difficulty: 'easy',
    solving_time_sec: 15,
    tags: 'javascript,programming'
  },

  // ================= 12. PLACEMENT & COMPANY-SPECIFIC =================
  {
    id: 'q26',
    topic_id: 'placement',
    statement: 'Company X hires 40 engineers who can complete a software module in 15 days working 8 hours/day. How many days will 30 engineers take working 10 hours/day?',
    options: JSON.stringify(['12 days', '16 days', '18 days', '20 days']),
    correct_option: 1, // 16 days
    explanation: 'Total Man-Hours = 40 engineers * 15 days * 8 hours = 4,800 hours. For 30 engineers working 10 hours/day: Days = 4,800 / (30 * 10) = 4,800 / 300 = 16 days.',
    difficulty: 'hard',
    solving_time_sec: 35,
    tags: 'placement,work_time,tcs'
  },
  {
    id: 'q27',
    topic_id: 'placement',
    statement: 'A clock shows 4:20. What is the angle between the hour hand and the minute hand?',
    options: JSON.stringify(['0°', '10°', '20°', '25°']),
    correct_option: 1, // 10°
    explanation: 'Angle Formula: |30*H - 5.5*M| = |30(4) - 5.5(20)| = |120 - 110| = 10 degrees.',
    difficulty: 'medium',
    solving_time_sec: 25,
    tags: 'placement,clocks,shortcut'
  },
  {
    id: 'q27b',
    topic_id: 'placement',
    statement: 'Two pipes A and B can fill a cistern in 20 and 30 minutes respectively. If both pipes are opened together, how much time will they take to fill the cistern?',
    options: JSON.stringify(['10 minutes', '12 minutes', '15 minutes', '18 minutes']),
    correct_option: 1, // 12 minutes
    explanation: 'Combined rate = (1/20) + (1/30) = (3+2)/60 = 5/60 = 1/12 per minute. Time = 12 minutes (Formula: xy/(x+y) = 600/50 = 12).',
    difficulty: 'easy',
    solving_time_sec: 20,
    tags: 'placement,pipes_cisterns'
  },

  // ================= 13. CRITICAL REASONING =================
  {
    id: 'q28',
    topic_id: 'critical',
    statement: 'Statement: "The government has decided to launch free coding bootcamps to reduce youth unemployment." Which assumption is implicit?',
    options: JSON.stringify([
      'Youth are willing to learn coding skills to gain employment.',
      'All unemployed youth have high-end computers.',
      'Coding is the only profession with high demand.',
      'Traditional college degrees are completely useless.'
    ]),
    correct_option: 0, // Youth are willing to learn
    explanation: 'The initiative implicitly assumes that youth will participate in and benefit from the training (Assumption 1). The other options make extreme ungrounded assumptions.',
    difficulty: 'medium',
    solving_time_sec: 30,
    tags: 'critical_reasoning,assumptions'
  },

  // ================= 14. DATA INTERPRETATION =================
  {
    id: 'q29',
    topic_id: 'di',
    statement: 'A company reports sales of $120k in Q1, $150k in Q2, $180k in Q3, and $210k in Q4. What is the percentage growth from Q1 to Q4?',
    options: JSON.stringify(['50%', '60%', '75%', '85%']),
    correct_option: 2, // 75%
    explanation: 'Growth = ((Q4 - Q1) / Q1) * 100% = ((210 - 120) / 120) * 100% = (90 / 120) * 100% = 75%.',
    difficulty: 'easy',
    solving_time_sec: 20,
    tags: 'di,growth,analytics'
  },

  // ================= 15. QUANTITATIVE APTITUDE =================
  {
    id: 'q30',
    topic_id: 'quant',
    statement: 'Find the greatest number which divides 148, 246, and 623 leaving remainder 4, 6, and 11 respectively.',
    options: JSON.stringify(['12', '16', '18', '24']),
    correct_option: 0, // 12
    explanation: 'Required number is HCF of (148-4=144), (246-6=240), and (623-11=612). HCF(144, 240, 612) = 12.',
    difficulty: 'hard',
    solving_time_sec: 35,
    tags: 'quant,hcf_lcm'
  }
];

export const defaultAchievements = [
  { id: 'ach_speed_demon', title: 'Speed Demon', description: 'Answer 5 consecutive questions in under 5 seconds correctly.', badge_icon: 'Zap', xp_reward: 200, category: 'Speed' },
  { id: 'ach_logic_legend', title: 'Logic Legend', description: 'Score 100% accuracy in a Logical Reasoning match.', badge_icon: 'Brain', xp_reward: 300, category: 'Mastery' },
  { id: 'ach_accuracy_assassin', title: 'Accuracy Assassin', description: 'Reach an overall accuracy milestone of 90%+ across 10 matches.', badge_icon: 'Target', xp_reward: 500, category: 'Accuracy' },
  { id: 'ach_streak_titan', title: 'Streak Titan', description: 'Maintain a 7-day daily quiz streak.', badge_icon: 'Flame', xp_reward: 400, category: 'Consistency' },
  { id: 'ach_arena_champion', title: 'Arena Champion', description: 'Win 1st place in a live multiplayer match with 5+ players.', badge_icon: 'Trophy', xp_reward: 350, category: 'Multiplayer' },
  { id: 'ach_practice_scholar', title: 'Practice Scholar', description: 'Complete 3 targeted weakness improvement sessions.', badge_icon: 'Brain', xp_reward: 250, category: 'Learning' }
];

export const defaultLeagues = [
  { id: 'league_season_1', title: 'National Campus Placement League - Season 1', season: 'Autumn 2026', status: 'active' },
  { id: 'league_tech_cup', title: 'Inter-College Engineering Logic Cup', season: '2026', status: 'active' }
];
