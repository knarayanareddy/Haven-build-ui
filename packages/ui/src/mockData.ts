// ─── HAVEN Mock Data (React Native) ───
// Ported from havenUIvision/src/data/mockData.ts
// Provides demo data when user is unauthenticated or Supabase returns empty results.
//
// AUDIT: see docs/MOCK_DATA_AUDIT.md for classification of each consumer.
// Screens that fetch live data fall back to these fixtures gracefully.
// No consumer pretends success (category C) — all are A (visual fixture) or
// B (live-fetch-with-fallback).

export const ELDER = {
  id: 'elder-001',
  name: 'Margaret van den Berg',
  firstName: 'Margaret',
  age: 78,
  address: 'Rozenlaan 14, Amsterdam',
  pc4: '1017',
  avatar: '👵',
  trustScore: 82,
  wellbeing: 4.1,
  lastSeen: new Date(Date.now() - 12 * 60 * 1000),
};

export const FAMILY_MEMBER = {
  id: 'family-001',
  name: 'Sarah van den Berg',
  firstName: 'Sarah',
  relation: 'Daughter',
  avatar: '👩',
};

export const MEDICATIONS = [
  {
    id: 'med-001',
    name: 'Metformin',
    dose: '500mg',
    times: ['08:00', '20:00'],
    taken: [true, false],
    color: '#4CAF50',
    purpose: 'Blood sugar control',
    prescriber: 'Dr. Hoekstra',
    nextRefill: '2026-07-15',
    stock: 28,
  },
  {
    id: 'med-002',
    name: 'Lisinopril',
    dose: '10mg',
    times: ['08:00'],
    taken: [true],
    color: '#2196F3',
    purpose: 'Blood pressure',
    prescriber: 'Dr. Hoekstra',
    nextRefill: '2026-07-20',
    stock: 14,
  },
  {
    id: 'med-003',
    name: 'Atorvastatin',
    dose: '20mg',
    times: ['21:00'],
    taken: [false],
    color: '#FF9800',
    purpose: 'Cholesterol',
    prescriber: 'Dr. Hoekstra',
    nextRefill: '2026-08-01',
    stock: 30,
  },
  {
    id: 'med-004',
    name: 'Aspirin',
    dose: '100mg',
    times: ['08:00'],
    taken: [true],
    color: '#E91E63',
    purpose: 'Heart health',
    prescriber: 'Dr. Hoekstra',
    nextRefill: '2026-07-28',
    stock: 45,
  },
];

export const SCAM_EVENTS = [
  {
    id: 'scam-001',
    type: 'call' as const,
    title: 'Suspicious bank helpdesk call',
    description: 'Caller claimed to be from ING Bank asking to verify account details. Unknown number +31 20 123 4567.',
    riskLevel: 'amber' as const,
    riskScore: 72,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    resolved: false,
    category: 'SCHILD',
  },
  {
    id: 'scam-002',
    type: 'sms' as const,
    title: 'Phishing SMS detected',
    description: 'SMS claiming parcel delivery failed. Link to suspicious website blocked.',
    riskLevel: 'red' as const,
    riskScore: 91,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    resolved: true,
    category: 'SCHILD',
  },
  {
    id: 'scam-003',
    type: 'email' as const,
    title: 'Lottery scam email',
    description: 'Email claiming prize of €15,000 from Dutch National Lottery. Blocked automatically.',
    riskLevel: 'red' as const,
    riskScore: 97,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    resolved: true,
    category: 'SCHILD',
  },
  {
    id: 'scam-004',
    type: 'call' as const,
    title: 'Microsoft support call',
    description: 'Caller claimed your computer has a virus and asked for remote access.',
    riskLevel: 'amber' as const,
    riskScore: 68,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    resolved: true,
    category: 'SCHILD',
  },
];

export const FAMILY_MESSAGES = [
  {
    id: 'msg-001',
    from: 'Sarah',
    fromId: 'family-001',
    avatar: '👩',
    content: 'Good morning Mum! ☀️ Thinking of you. Call me if you need anything.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    type: 'text' as const,
    read: true,
  },
  {
    id: 'msg-002',
    from: 'Peter',
    fromId: 'family-002',
    avatar: '👨',
    content: 'Hi Grandma! We drew a picture for you 🎨',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    type: 'text' as const,
    read: false,
  },
  {
    id: 'msg-003',
    from: 'Tom',
    fromId: 'family-003',
    avatar: '🧒',
    content: '❤️',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    type: 'heart' as const,
    read: true,
  },
  {
    id: 'msg-004',
    from: 'Sarah',
    fromId: 'family-001',
    avatar: '👩',
    content: "Don't forget your appointment with Dr. Hoekstra on Thursday at 14:00!",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    type: 'text' as const,
    read: true,
  },
  {
    id: 'msg-005',
    from: 'HAVEN',
    fromId: 'system',
    avatar: '⌂',
    content: 'Good morning Margaret! Your morning medications are ready. You slept well — 7h 23min.',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    type: 'system' as const,
    read: true,
  },
];

export const LIFE_STORIES = [
  {
    id: 'story-001',
    title: 'My years in Delft',
    content: 'I studied at the Technical University of Delft from 1968 to 1972. The canals were beautiful in winter...',
    date: '1968-1972',
    tags: ['education', 'youth', 'Delft'],
    emoji: '🎓',
  },
  {
    id: 'story-002',
    title: 'Meeting Hendrik',
    content: 'I met Hendrik at the summer festival in Haarlem, 1974. He brought me tulips every Sunday for a year...',
    date: '1974',
    tags: ['love', 'family', 'memories'],
    emoji: '💐',
  },
  {
    id: 'story-003',
    title: 'Children growing up',
    content: 'Sarah was born in 1976, Peter in 1979. Those were the best years of my life...',
    date: '1976-1985',
    tags: ['family', 'children', 'Amsterdam'],
    emoji: '👶',
  },
];

export const BUURT_MATCHES = [
  {
    id: 'buurt-001',
    alias: 'Neighbor A',
    interests: ['Walking', 'Gardening', 'Reading'],
    distance: '400m',
    pc4: '1017',
    available: true,
    lastActive: 'Yesterday',
    matchScore: 87,
  },
  {
    id: 'buurt-002',
    alias: 'Neighbor B',
    interests: ['Walking', 'Coffee', 'Classical Music'],
    distance: '650m',
    pc4: '1017',
    available: true,
    lastActive: 'Today',
    matchScore: 76,
  },
  {
    id: 'buurt-003',
    alias: 'Neighbor C',
    interests: ['Gardening', 'Baking', 'Card games'],
    distance: '200m',
    pc4: '1017',
    available: false,
    lastActive: '3 days ago',
    matchScore: 71,
  },
];

export const COMMUNITY_EVENTS = [
  {
    id: 'event-001',
    title: 'Wednesday Morning Walk',
    description: 'Gentle 45-min walk through Vondelpark. All paces welcome.',
    date: 'Wednesday 09:30',
    location: 'Vondelpark entrance (Roemer Visscherstraat)',
    attending: 7,
    category: 'Walking',
    emoji: '🚶',
  },
  {
    id: 'event-002',
    title: 'Community Coffee Morning',
    description: 'Weekly catch-up at De Koffiehoek. Free for over-70s.',
    date: 'Friday 10:00',
    location: 'De Koffiehoek, Haarlemmerdijk',
    attending: 12,
    category: 'Social',
    emoji: '☕',
  },
  {
    id: 'event-003',
    title: 'Skill Exchange: Knitting',
    description: 'Share your knitting skills or learn from others.',
    date: 'Thursday 14:00',
    location: 'Wijkcentrum De Balie',
    attending: 5,
    category: 'Skill Exchange',
    emoji: '🧶',
  },
];

export const TODAY_TASKS = [
  { id: 'task-001', title: 'Morning medications', time: '08:00', done: true, emoji: '💊', category: 'health' },
  { id: 'task-002', title: 'Breakfast', time: '08:30', done: true, emoji: '🍳', category: 'nutrition' },
  { id: 'task-003', title: 'Morning walk (20 min)', time: '10:00', done: false, emoji: '🚶', category: 'mobility' },
  { id: 'task-004', title: 'Drink water (glass 2 of 6)', time: '10:30', done: true, emoji: '💧', category: 'hydration' },
  { id: 'task-005', title: 'Video call with Sarah', time: '11:00', done: false, emoji: '📱', category: 'family' },
  { id: 'task-006', title: 'Lunch', time: '12:30', done: false, emoji: '🥗', category: 'nutrition' },
  { id: 'task-007', title: 'Afternoon medications', time: '13:00', done: false, emoji: '💊', category: 'health' },
  { id: 'task-008', title: 'Dr. Hoekstra appointment', time: '14:00', done: false, emoji: '🏥', category: 'medical' },
];

export const VITALS = [
  { label: 'Blood Pressure', value: '128/82', unit: 'mmHg', status: 'normal' as const, trend: 'stable' as const, emoji: '❤️' },
  { label: 'Blood Sugar', value: '6.4', unit: 'mmol/L', status: 'normal' as const, trend: 'down' as const, emoji: '🩸' },
  { label: 'Weight', value: '68.2', unit: 'kg', status: 'normal' as const, trend: 'stable' as const, emoji: '⚖️' },
  { label: 'Steps Today', value: '3,241', unit: 'steps', status: 'low' as const, trend: 'up' as const, emoji: '👣' },
];

export const SAFE_ZONE = {
  center: 'Rozenlaan 14, Amsterdam 1017',
  radius: 1200,
  currentlyInside: true,
  lastCheck: new Date(Date.now() - 8 * 60 * 1000),
  nightMode: {
    enabled: true,
    quietFrom: '21:30',
    quietUntil: '07:30',
  },
};

export const VOICE_MEMORY = [
  {
    id: 'mem-001',
    query: "What is my daughter's phone number?",
    response: "Sarah's number is +31 6 123 456 78. Would you like me to call her?",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: 'mem-002',
    query: 'What did I have for breakfast yesterday?',
    response: 'I noted that you had yoghurt with berries and a slice of whole-grain bread for breakfast yesterday.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'mem-003',
    query: 'Tell me something nice.',
    response: 'You have been wonderfully consistent with your medications this week — 94% adherence! Sarah sent you a lovely message this morning too.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
];

export const CARE_VISITS = [
  {
    id: 'visit-001',
    carer: 'Nurse Eva Jansen',
    carerAvatar: '👩‍⚕️',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    duration: '45 min',
    notes: 'Medication review completed. Mood calm and cooperative. Breakfast eaten well. Rug edge in hallway flagged for removal.',
    handover: {
      appetite: 'Good — ate full breakfast',
      mood: 'Calm, chatty about garden',
      mobility: 'Walking normally, no issues',
      concerns: 'Rug edge in hallway noted',
      administered: 'Metformin 500mg, Lisinopril 10mg given with water',
    },
    marEntries: [
      { medication: 'Metformin 500mg', time: '08:15', status: 'given' as const },
      { medication: 'Lisinopril 10mg', time: '08:15', status: 'given' as const },
    ],
    status: 'completed' as const,
  },
  {
    id: 'visit-002',
    carer: 'Nurse Tom de Vries',
    carerAvatar: '👨‍⚕️',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    duration: '30 min',
    notes: 'Blood pressure check normal. Mood good. Spoke about weekend visit from grandchildren.',
    handover: {
      appetite: 'Good',
      mood: 'Happy, looking forward to family visit',
      mobility: 'Good',
      concerns: 'None',
      administered: 'All medications given as scheduled',
    },
    marEntries: [
      { medication: 'Metformin 500mg', time: '08:00', status: 'given' as const },
      { medication: 'Lisinopril 10mg', time: '08:00', status: 'given' as const },
      { medication: 'Aspirin 100mg', time: '08:00', status: 'given' as const },
    ],
    status: 'completed' as const,
  },
];

export const SAFEGUARDING_ITEMS = [
  {
    id: 'safe-001',
    title: 'Rug edge in hallway',
    description: 'Loose rug edge noted near front door — fall risk',
    severity: 'low' as const,
    meldcodeStep: 1,
    status: 'resolved' as const,
    reportedBy: 'Nurse Eva Jansen',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    resolution: 'Rug removed and replacement ordered',
  },
];

export const WEEKLY_DIGEST = {
  period: 'June 16–22, 2026',
  scamEvents: 0,
  medicationAdherence: 94,
  familyInteractions: 6,
  neighbourhoodConnections: 1,
  wellbeingAvg: 4.1,
  highlightMoment: 'Sarah visited on Sunday for tea',
  carerVisits: 3,
  stepsAvg: 3800,
};

export const DEVICE_HEALTH = {
  lastSeen: new Date(Date.now() - 12 * 60 * 1000),
  batteryLevel: 78,
  permissionsGranted: ['microphone', 'camera', 'location', 'notifications'],
  networkStatus: 'connected' as const,
  appVersion: '1.2.1',
  pendingUpdates: false,
};

export const DAILY_STATUS = {
  status: 'green' as 'green' | 'amber' | 'red',
  summary: 'All is well. Morning routine complete.',
  why: 'Medications taken, morning walk done, no alerts.',
  whatNext: 'Dr. Hoekstra appointment at 14:00 today.',
  checkinTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
};

export const CONSENT_SETTINGS = {
  medicationView: true,
  locationView: true,
  companionMemory: false,
  buurtIdentity: false,
  weeklyDigest: true,
  voiceRecording: true,
  familiarVoice: false,
};

export const FAMILIAR_VOICE_STATUS = {
  enabled: false,
  recorded: false,
  sampleSentences: [
    'Good morning Margaret, how are you feeling today?',
    "Don't forget your morning medications, they are on the kitchen table.",
    'I am thinking of you today. You are loved and safe.',
    'Your appointment with the doctor is this Thursday at two o\'clock.',
    'The weather today is mild and sunny — perfect for a little walk.',
  ],
};

export const MOOD_OPTIONS = [
  { value: 'great' as const, emoji: '😄', label: 'Great', labelNl: 'Uitstekend', color: '#22c55e' },
  { value: 'good' as const, emoji: '🙂', label: 'Good', labelNl: 'Goed', color: '#84cc16' },
  { value: 'okay' as const, emoji: '😐', label: 'Okay', labelNl: 'Gaat wel', color: '#eab308' },
  { value: 'not_great' as const, emoji: '🙁', label: 'Not great', labelNl: 'Niet zo goed', color: '#f97316' },
  { value: 'bad' as const, emoji: '😔', label: 'Difficult', labelNl: 'Moeilijk', color: '#ef4444' },
];

export const NAVIGATION_ITEMS = [
  { id: 'HOME', icon: '⌂', label: 'Home', labelNl: 'Thuis' },
  { id: 'TODAY', icon: '📅', label: 'Today', labelNl: 'Vandaag' },
  { id: 'PILLS', icon: '💊', label: 'My Pills', labelNl: 'Pillen' },
  { id: 'SHIELD', icon: '🛡️', label: 'Shield', labelNl: 'Schild' },
  { id: 'FAMILY', icon: '👨‍👩‍👧', label: 'Family', labelNl: 'Familie' },
];
