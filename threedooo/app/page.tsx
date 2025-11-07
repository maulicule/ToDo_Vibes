'use client';

import React, { useState, useEffect, useRef } from 'react';
import { id } from '@instantdb/react';
import db from '../lib/db';
import confetti from 'canvas-confetti';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Utility functions
const MOTIVATIONAL_EMOJIS = ['🚀', '🌟', '⚡', '💪', '🎯', '✨', '🔥', '⭐'];
const ENCOURAGING_MESSAGES = [
  "Let's do this!",
  "You've got this!",
  "One step closer!",
  "Let's crush it!",
  "Time to shine!",
  "You're awesome!",
  "On fire! 🔥",
  "Beast mode!",
];

// Helper function to get local date string (YYYY-MM-DD)
function getLocalDateString(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
}

// Helper function to get days elapsed since a timestamp
function getDaysElapsed(timestamp: number) {
  const taskDate = getLocalDateString(timestamp);
  const today = getLocalDateString(Date.now());

  const taskDateTime = new Date(taskDate).getTime();
  const todayTime = new Date(today).getTime();

  const daysDiff = Math.floor((todayTime - taskDateTime) / (1000 * 60 * 60 * 24));
  return daysDiff;
}

// Check if we need to run daily reset
function shouldRunDailyReset() {
  const lastReset = localStorage.getItem('lastResetDate');
  const today = getLocalDateString(Date.now());

  if (!lastReset || lastReset !== today) {
    localStorage.setItem('lastResetDate', today);
    return lastReset !== null && lastReset !== today; // Only return true if this is a new day, not first load
  }
  return false;
}

// Cleanup tasks based on daily reset rules
function cleanupTasks(tasks: Task[]) {
  const tasksToDelete: string[] = [];

  tasks.forEach((task) => {
    const daysOld = getDaysElapsed(task.createdAt);

    // Delete completed tasks that are from previous days
    if (task.completed && daysOld > 0) {
      tasksToDelete.push(task.id);
    }

    // Delete incomplete tasks that are 3+ days old (appeared for 2 cycles after creation)
    if (!task.completed && daysOld >= 3) {
      tasksToDelete.push(task.id);
    }
  });

  // Delete all tasks that need cleanup
  if (tasksToDelete.length > 0) {
    db.transact(
      tasksToDelete.map(taskId => db.tx.tasks[taskId].update({ deleted: true, updatedAt: Date.now() }))
    );
  }
}

const CELEBRATION_EMOJIS = ['🏆', '⚡️', '🚀', '🙌', '🥳', '🤩', '🦄'];

const CELEBRATION_MESSAGES = {
  '🏆': [
    "CHAMPION STATUS!",
    "YOU'RE THE BEST!",
    "LEGEND MODE!",
    "UNSTOPPABLE!",
  ],
  '⚡️': [
    "LIGHTNING FAST!",
    "SUPERCHARGED!",
    "ELECTRIC ENERGY!",
    "POWER MOVES!",
  ],
  '🚀': [
    "TO THE MOON!",
    "BLAST OFF!",
    "ROCKET FUEL!",
    "SKY'S THE LIMIT!",
  ],
  '🙌': [
    "NAILED IT!",
    "HIGH FIVE!",
    "YOU DID IT!",
    "CRUSHING IT!",
  ],
  '🥳': [
    "PARTY TIME!",
    "CELEBRATE GOOD TIMES!",
    "LET'S GO!",
    "BOOM!",
  ],
  '🤩': [
    "ABSOLUTELY STELLAR!",
    "MIND BLOWN!",
    "WOW FACTOR!",
    "AMAZING!",
  ],
  '🦄': [
    "MAGICAL!",
    "UNICORN STATUS!",
    "LEGENDARY!",
    "ONE OF A KIND!",
  ],
};

const EDIT_MESSAGES = [
  "Getting specific, nice! ✏️",
  "Love the detail! ✨",
  "Clarity is key! 🎯",
  "Tweaking to perfection! 💎",
];

const DELETE_MESSAGES = [
  "No worries, plans change!",
  "All good, stay flexible!",
  "Sometimes less is more!",
  "Adapting like a pro!",
];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getTimeBasedGradient() {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) {
    // Morning: Warm gradients
    return 'from-orange-200 via-pink-200 to-yellow-200';
  } else if (hour >= 12 && hour < 18) {
    // Afternoon: Bright, energetic
    return 'from-purple-200 via-pink-200 to-blue-200';
  } else if (hour >= 18 && hour < 24) {
    // Evening: Cooler, calming
    return 'from-blue-300 via-indigo-300 to-purple-300';
  } else {
    // Night: Deep, restful
    return 'from-indigo-300 via-purple-300 to-pink-300';
  }
}

function getThemeColors() {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) {
    // Morning: Warm colors
    return {
      border: 'border-orange-400',
      hoverBorder: 'hover:border-pink-500',
      bg: 'group-hover:bg-orange-100',
      text: 'group-hover:text-orange-600',
      completed: 'border-orange-200 bg-orange-50',
      completedCheckbox: 'border-orange-400 bg-orange-400',
      trashIcon: 'text-orange-400',
      completedText: 'text-orange-600',
      sectionHeader: 'text-orange-600'
    };
  } else if (hour >= 12 && hour < 18) {
    // Afternoon: Bright, energetic
    return {
      border: 'border-purple-400',
      hoverBorder: 'hover:border-pink-500',
      bg: 'group-hover:bg-purple-100',
      text: 'group-hover:text-purple-600',
      completed: 'border-purple-200 bg-purple-50',
      completedCheckbox: 'border-purple-400 bg-purple-400',
      trashIcon: 'text-purple-400',
      completedText: 'text-purple-600',
      sectionHeader: 'text-purple-600'
    };
  } else if (hour >= 18 && hour < 24) {
    // Evening: Cooler, calming
    return {
      border: 'border-blue-400',
      hoverBorder: 'hover:border-indigo-500',
      bg: 'group-hover:bg-blue-100',
      text: 'group-hover:text-blue-600',
      completed: 'border-blue-200 bg-blue-50',
      completedCheckbox: 'border-blue-400 bg-blue-400',
      trashIcon: 'text-blue-400',
      completedText: 'text-blue-600',
      sectionHeader: 'text-blue-600'
    };
  } else {
    // Night: Deep, restful
    return {
      border: 'border-indigo-400',
      hoverBorder: 'hover:border-purple-500',
      bg: 'group-hover:bg-indigo-100',
      text: 'group-hover:text-indigo-600',
      completed: 'border-indigo-200 bg-indigo-50',
      completedCheckbox: 'border-indigo-400 bg-indigo-400',
      trashIcon: 'text-indigo-400',
      completedText: 'text-indigo-600',
      sectionHeader: 'text-indigo-600'
    };
  }
}

// Confetti functions
function fireSmallConfetti() {
  confetti({
    particleCount: 30,
    spread: 45,
    origin: { y: 0.6 },
    colors: ['#9333ea', '#ec4899', '#3b82f6', '#f59e0b'],
  });
}

function fireMediumConfetti() {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#9333ea', '#ec4899', '#3b82f6', '#f59e0b', '#10b981'],
    shapes: ['circle', 'square'],
    scalar: 1.2,
  });
}

function fireMassiveConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 7,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#9333ea', '#ec4899', '#3b82f6', '#f59e0b', '#10b981'],
    });
    confetti({
      particleCount: 7,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#9333ea', '#ec4899', '#3b82f6', '#f59e0b', '#10b981'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

// Auth Components
function Login() {
  const [sentEmail, setSentEmail] = useState('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200">
      <div className="w-full max-w-md p-8">
        {!sentEmail ? (
          <EmailStep onSendEmail={setSentEmail} />
        ) : (
          <CodeStep sentEmail={sentEmail} />
        )}
      </div>
    </div>
  );
}

function EmailStep({ onSendEmail }: { onSendEmail: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await db.auth.sendMagicCode({ email });
      onSendEmail(email);
    } catch (err: any) {
      alert('Uh oh: ' + err.body?.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-scale-in rounded-3xl bg-white p-8 shadow-xl">
      <h1 className="mb-2 text-4xl font-bold text-gray-800">threedooo</h1>
      <p className="mb-6 text-lg text-gray-600">The fun way to hyper-focus!</p>
      <p className="mb-6 text-gray-700">
        Enter your email to get started. We'll send you a magic code to sign in.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border-2 border-gray-200 px-6 py-4 text-lg transition-all focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
          placeholder="Enter your email"
          required
          autoFocus
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 text-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send Magic Code'}
        </button>
      </form>
    </div>
  );
}

function CodeStep({ sentEmail }: { sentEmail: string }) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setIsLoading(true);
    try {
      await db.auth.signInWithMagicCode({ email: sentEmail, code });
    } catch (err: any) {
      alert('Uh oh: ' + err.body?.message);
      setCode('');
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-scale-in rounded-3xl bg-white p-8 shadow-xl">
      <h2 className="mb-4 text-3xl font-bold text-gray-800">Check your email</h2>
      <p className="mb-6 text-gray-700">
        We sent a code to <strong>{sentEmail}</strong>. Enter it below to sign in.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded-2xl border-2 border-gray-200 px-6 py-4 text-center text-2xl tracking-widest transition-all focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
          placeholder="123456"
          required
          autoFocus
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 text-lg font-bold text-white transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </button>
      </form>
    </div>
  );
}

// Task Management Components
function useTasks() {
  const user = db.useUser();
  const { data, isLoading, error } = db.useQuery({
    tasks: {
      $: {
        where: {
          'user.id': user.id,
          deleted: false,
        },
        order: {
          position: 'asc',
        },
      },
    },
  });

  return { tasks: data?.tasks || [], isLoading, error };
}

function addTask(title: string, userId: string, position: number) {
  db.transact([
    db.tx.tasks[id()]
      .update({
        title,
        position,
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deleted: false,
      })
      .link({ user: userId }),
  ]);
}

function toggleTaskComplete(taskId: string, completed: boolean, completedAt: number | null) {
  db.transact([
    db.tx.tasks[taskId].update({
      completed,
      completedAt: completed ? Date.now() : completedAt,
      updatedAt: Date.now(),
    }),
  ]);
}

function deleteTask(taskId: string) {
  db.transact([
    db.tx.tasks[taskId].update({
      deleted: true,
      updatedAt: Date.now(),
    }),
  ]);
}

function Header() {
  const user = db.useUser();
  const [showMenu, setShowMenu] = useState(false);
  const { tasks } = useTasks();

  const getInitials = (email: string) => {
    const name = email.split('@')[0];
    const parts = name.split(/[._-]/);

    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="flex items-center justify-between p-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-800" style={{ letterSpacing: '-0.05em' }}>threedooo</h1>
        <p className="text-sm text-gray-600">{today}</p>
      </div>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-sm font-bold text-white transition-all hover:scale-110 hover:shadow-lg active:scale-95"
        >
          {getInitials(user.email || '')}
        </button>
        {showMenu && (
          <div className="animate-scale-in absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl z-50">
            <div className="overflow-hidden px-4 py-2 text-sm text-gray-600 truncate">{user.email}</div>
            <button
              onClick={() => db.auth.signOut()}
              className="w-full rounded-xl px-4 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function DottedAddCard({ onAddClick, isEmpty = false, compact = false, showPrioritySpacing = false }: { onAddClick: () => void; isEmpty?: boolean; compact?: boolean; showPrioritySpacing?: boolean }) {
  const themeColors = getThemeColors();

  const card = (
    <button
      onClick={onAddClick}
      className={`group w-full rounded-3xl border-4 border-dotted ${themeColors.border} ${themeColors.hoverBorder} bg-transparent transition-all hover:bg-white hover:shadow-lg active:scale-95 flex items-center justify-center ${
        compact ? 'p-4 aspect-square max-w-[120px]' : 'p-6'
      }`}
    >
      <div className={`${compact ? 'text-4xl' : 'text-5xl'} font-normal ${themeColors.border.replace('border-', 'text-')} transition-all`}>
        +
      </div>
    </button>
  );

  if (showPrioritySpacing) {
    return (
      <div className="flex items-start gap-3">
        {/* Empty space for alignment with priority number */}
        <div className="flex-shrink-0 w-0" />
        <div className="flex-1">{card}</div>
      </div>
    );
  }

  return card;
}

function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  const emptyMessages = [
    { heading: "Ready to focus?", subtext: "Add your top 3 tasks and let's do this! 🎯" },
    { heading: "Fresh start!", subtext: "What are your 3 most important things today? ⭐" },
    { heading: "Time to shine!", subtext: "Pick your top 3 priorities and crush them! 💪" },
    { heading: "Let's go!", subtext: "Add 3 tasks that matter most right now! 🚀" },
  ];
  const message = getRandomItem(emptyMessages);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="animate-bobble mb-6 text-8xl">📝</div>
      <h2 className="mb-2 text-3xl font-bold text-gray-800">{message.heading}</h2>
      <p className="mb-6 text-lg text-gray-600">{message.subtext}</p>

      <div className="w-full max-w-2xl">
        <DottedAddCard onAddClick={onAddClick} isEmpty={true} />
      </div>
    </div>
  );
}

function AllCompleteMessage({ onAddClick }: { onAddClick: () => void }) {
  const celebrationEmoji = getRandomItem(CELEBRATION_EMOJIS);
  const messages = [
    "All done! You're crushing it today! 🎉",
    "Completed everything! What a legend! ⭐",
    "All tasks complete! Feeling productive? 💪",
    "Everything done! Time for more? 🚀",
    "Finished! You're on fire! 🔥",
  ];
  const message = getRandomItem(messages);

  return (
    <div className="mb-8 flex items-center gap-6 rounded-3xl bg-white/60 p-6 shadow-lg backdrop-blur-sm">
      <div className="animate-trophy-tilt text-6xl">{celebrationEmoji}</div>
      <div className="flex-1">
        <h3 className="text-2xl font-bold text-gray-800">{message}</h3>
        <p className="text-sm text-gray-600">Want to add more tasks?</p>
      </div>
      <DottedAddCard onAddClick={onAddClick} compact={true} />
    </div>
  );
}

function AllCompleteState({ onClose, taskCount }: { onClose?: () => void; taskCount: number }) {
  const [show, setShow] = useState(true);
  const [celebrationEmoji] = useState(() => getRandomItem(CELEBRATION_EMOJIS));
  const [message] = useState(() => getRandomItem(CELEBRATION_MESSAGES[celebrationEmoji as keyof typeof CELEBRATION_MESSAGES]));

  useEffect(() => {
    fireMassiveConfetti();
  }, []);

  if (!show) return null;

  const getSubMessage = () => {
    if (taskCount === 1) {
      return getRandomItem([
        "One task crushed! Great start! 🔥",
        "First one done! You're rolling! ⭐",
        "Task complete! Keep the momentum! 💪",
        "One down! Winning already! 🎯",
      ]);
    } else if (taskCount === 2) {
      return getRandomItem([
        "Two tasks done! Double win! 🔥",
        "Both complete! You're unstoppable! ⭐",
        "Two for two! On fire! 💪",
        "Double victory! Amazing work! 🎯",
      ]);
    } else if (taskCount === 3) {
      return getRandomItem([
        "All 3 done! You're on fire today! 🔥",
        "Triple threat complete! What a legend! ⭐",
        "Three for three! Absolutely crushing it! 💪",
        "Mission accomplished! You're unstoppable! 🎯",
        "Boom! All three knocked out! 💥",
      ]);
    } else {
      return getRandomItem([
        `All ${taskCount} tasks done! Incredible! 🔥`,
        `${taskCount} tasks complete! Superhuman! ⭐`,
        `All ${taskCount} crushed! Legendary! 💪`,
        `${taskCount} for ${taskCount}! Perfect score! 🎯`,
      ]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="animate-scale-in rounded-3xl bg-white p-12 text-center shadow-2xl">
        <div className="animate-trophy-tilt mb-6 text-9xl">{celebrationEmoji}</div>
        <h2 className="mb-4 text-4xl font-bold text-gray-800">{message}</h2>
        <p className="mb-6 text-lg text-gray-600">{getSubMessage()}</p>
        <button
          onClick={() => setShow(false)}
          className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 font-bold text-white transition-all hover:scale-105 hover:shadow-lg active:scale-95"
        >
          Let's Go! 🚀
        </button>
      </div>
    </div>
  );
}

interface Task {
  id: string;
  title: string;
  position: number;
  completed: boolean;
  completedAt?: number | null;
  createdAt: number;
}

function SortableTaskCard({ task, index, completedCount, totalInSection, wasDragged }: { task: Task; index: number; completedCount: number; totalInSection: number; wasDragged: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring easing for smooth animation
  };

  const showPriorityNumber = !task.completed && totalInSection > 1;

  return (
    <div className="flex items-start gap-3">
      {/* Priority Number - Only show for incomplete tasks when there are multiple */}
      {showPriorityNumber && (
        <div
          className={`flex-shrink-0 pt-6 font-bold text-gray-800 transition-all ${
            index === 0
              ? 'text-2xl'
              : index === 1
              ? 'text-xl'
              : 'text-lg'
          }`}
        >
          {index + 1}
        </div>
      )}

      <div ref={setNodeRef} style={style} className="flex-1">
        <TaskCard
          task={task}
          index={index}
          completedCount={completedCount}
          isDragging={isDragging}
          dragListeners={listeners}
          dragAttributes={attributes}
          justSettled={wasDragged}
        />
      </div>
    </div>
  );
}

function TaskCard({
  task,
  index,
  completedCount,
  isDragging = false,
  dragListeners,
  dragAttributes,
  justSettled = false
}: {
  task: Task;
  index: number;
  completedCount: number;
  isDragging?: boolean;
  dragListeners?: any;
  dragAttributes?: any;
  justSettled?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [showDelete, setShowDelete] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [editMessage] = useState(() => getRandomItem(EDIT_MESSAGES));
  const themeColors = getThemeColors();

  const daysOld = getDaysElapsed(task.createdAt);
  const isOverdue = !task.completed && daysOld > 0;

  const getBadgeInfo = () => {
    if (task.completed || daysOld === 0) return null;

    if (daysOld === 1) {
      return { text: 'Due yesterday', color: 'bg-yellow-500', textColor: 'text-yellow-950', emoji: '⚠️' };
    } else if (daysOld === 2) {
      return { text: 'Self-destructs at midnight', color: 'bg-red-500', textColor: 'text-white', emoji: '💥' };
    }
    return null;
  };

  const badgeInfo = getBadgeInfo();

  const handleSave = () => {
    if (editValue.trim() && editValue !== task.title) {
      db.transact([
        db.tx.tasks[task.id].update({
          title: editValue.trim(),
          updatedAt: Date.now(),
        }),
      ]);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 2000);
    }
    setIsEditing(false);
  };

  const handleToggleComplete = () => {
    const newCompleted = !task.completed;
    toggleTaskComplete(task.id, newCompleted, task.completedAt || null);

    if (newCompleted) {
      // Always trigger confetti when completing a task
      // Calculate what the new count will be after this completion
      const newCount = completedCount + 1;

      if (newCount === 1) {
        fireSmallConfetti();
      } else if (newCount === 2) {
        fireMediumConfetti();
      } else {
        // For 3 or more, fire small confetti for each additional completion
        fireSmallConfetti();
      }
    }
  };

  const handleDelete = () => {
    deleteTask(task.id);
    setShowDelete(false);
  };

  // Determine border color based on overdue status
  const getBorderColor = () => {
    if (task.completed) return themeColors.completed;
    if (daysOld === 2) return 'border-red-300 bg-red-50';
    if (daysOld === 1) return 'border-yellow-300 bg-yellow-50';
    if (index === 0) return 'border-purple-300 bg-white';
    if (index === 1) return 'border-pink-300 bg-white';
    return 'border-blue-300 bg-white';
  };

  return (
    <div
      className={`group relative rounded-3xl border-4 p-6 shadow-lg transition-all hover:shadow-xl ${getBorderColor()} ${
        task.completed ? 'opacity-60' : ''
      } ${justSettled ? 'animate-settle' : ''} ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Overdue Badge - Positioned at top edge */}
      {badgeInfo && (
        <div className="absolute -top-3 left-20 animate-fade-in">
          <div className={`inline-flex items-center gap-2 rounded-full ${badgeInfo.color} ${badgeInfo.textColor} px-3 py-1 text-xs font-bold shadow-lg`}>
            <span>{badgeInfo.emoji}</span>
            <span>{badgeInfo.text}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Drag Handle - Always visible on mobile, visible on hover for desktop */}
        <div
          {...dragListeners}
          {...dragAttributes}
          className={`flex h-10 w-10 flex-shrink-0 cursor-grab items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing ${
            isDragging ? 'opacity-0' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
          }`}
          style={{ touchAction: 'none' }}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </div>

        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-4 transition-all hover:scale-110 active:scale-90 ${
            task.completed
              ? themeColors.completedCheckbox
              : 'border-gray-300 hover:border-purple-400'
          }`}
        >
          {task.completed && <span className="text-2xl text-white">✓</span>}
        </button>

        {/* Task Title */}
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') {
                  setEditValue(task.title);
                  setIsEditing(false);
                }
              }}
              className="w-full rounded-xl border-2 border-purple-300 px-3 py-2 text-lg transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              maxLength={100}
              autoFocus
            />
          ) : (
            <p
              onClick={() => !task.completed && setIsEditing(true)}
              className={`text-lg font-medium transition-all ${
                task.completed ? `${themeColors.completedText} line-through` : 'cursor-pointer text-gray-800'
              }`}
            >
              {task.title}
            </p>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={() => setShowDelete(true)}
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${themeColors.trashIcon} opacity-0 transition-all hover:scale-110 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 active:scale-90`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>

      {/* Edit Message */}
      {showMessage && (
        <div className="animate-fade-in absolute -top-10 left-1/2 -translate-x-1/2 rounded-xl bg-purple-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {editMessage}
        </div>
      )}

      {/* Delete Confirmation */}
      {showDelete && (
        <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/95 backdrop-blur-sm">
          <div className="animate-scale-in flex w-full gap-3 px-6">
            <button
              onClick={() => setShowDelete(false)}
              className="flex-1 rounded-xl bg-gray-200 px-6 py-2 font-medium text-gray-700 transition-all hover:scale-105 hover:bg-gray-300 active:scale-95"
            >
              Keep
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 rounded-xl bg-red-500 px-6 py-2 font-medium text-white transition-all hover:scale-105 hover:bg-red-600 active:scale-95"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddTaskButton({ taskCount, onAddClick }: { taskCount: number; onAddClick: () => void }) {
  if (taskCount >= 3) {
    const fullMessages = [
      "You're all set! Focus on your 3 🎯",
      "That's the magic number! Go crush them! 💪",
      "Three's the charm! Time to execute! ⚡",
      "Perfect! Now let's make it happen! 🚀",
      "Locked and loaded! You got this! 🔥",
    ];

    return (
      <div className="fixed bottom-8 right-8 animate-scale-in rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-white shadow-xl">
        <p className="font-bold">{getRandomItem(fullMessages)}</p>
      </div>
    );
  }

  return (
    <button
      onClick={onAddClick}
      className="animate-breathe fixed bottom-8 right-8 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-4xl text-white shadow-2xl transition-all hover:scale-110 hover:shadow-purple-300 active:scale-95"
    >
      +
    </button>
  );
}

function AddTaskModal({ onClose, taskCount }: { onClose: () => void; taskCount: number }) {
  const [taskTitle, setTaskTitle] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const user = db.useUser();

  const handleAdd = () => {
    if (taskTitle.trim() && taskCount < 3) {
      addTask(taskTitle.trim(), user.id, taskCount);
      setTaskTitle('');
      onClose();
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 2000);
    }
  };

  return (
    <>
      {showMessage && (
        <div className="animate-fade-in fixed bottom-28 right-8 z-50 rounded-xl bg-purple-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {getRandomItem(ENCOURAGING_MESSAGES)}
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="animate-scale-in w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
          <h3 className="mb-4 text-2xl font-bold text-gray-800">Add a task</h3>
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="mb-2 w-full rounded-2xl border-2 border-gray-200 px-6 py-4 text-lg transition-all focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
            placeholder="What's important today?"
            maxLength={100}
            autoFocus
          />
          <p className="mb-6 text-sm text-gray-500">{taskTitle.length}/100 characters</p>
          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              disabled={!taskTitle.trim()}
              className="flex-1 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 py-3 font-bold text-white transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => {
                onClose();
                setTaskTitle('');
              }}
              className="flex-1 rounded-2xl bg-gray-200 py-3 font-bold text-gray-700 transition-all hover:scale-105 hover:bg-gray-300 active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Main() {
  const { tasks, isLoading, error } = useTasks();
  const [gradientClass, setGradientClass] = useState(getTimeBasedGradient());
  const [showAllComplete, setShowAllComplete] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const prevIncompleteCountRef = useRef<number | null>(null);
  const themeColors = getThemeColors();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lastDraggedId, setLastDraggedId] = useState<string | null>(null);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 180, // Long-press for mobile
        tolerance: 8, // Allow slight movement before canceling
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Daily reset check - run on mount and when tasks change
  useEffect(() => {
    if (tasks.length > 0 && shouldRunDailyReset()) {
      cleanupTasks(tasks);
    }
  }, [tasks]);

  // Check for midnight crossing every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientClass(getTimeBasedGradient());
      // Check if we've crossed midnight
      if (tasks.length > 0 && shouldRunDailyReset()) {
        cleanupTasks(tasks);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [tasks]);

  const incompleteTasks = tasks.filter((t: Task) => !t.completed);
  const completedTasks = tasks.filter((t: Task) => t.completed);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const draggedId = active.id as string;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Determine which list we're working with
    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);

    if (!activeTask || !overTask) return;

    // Only allow reordering within the same completion status
    if (activeTask.completed !== overTask.completed) return;

    // Get the appropriate task list
    const taskList = activeTask.completed ? completedTasks : incompleteTasks;
    const oldIndex = taskList.findIndex((t) => t.id === active.id);
    const newIndex = taskList.findIndex((t) => t.id === over.id);

    if (oldIndex === newIndex) return;

    // Set the last dragged ID for animation
    setLastDraggedId(draggedId);
    setTimeout(() => setLastDraggedId(null), 400);

    // Reorder the tasks
    const reorderedTasks = arrayMove(taskList, oldIndex, newIndex);

    // Update positions in database
    db.transact(
      reorderedTasks.map((task, index) =>
        db.tx.tasks[task.id].update({
          position: index,
          updatedAt: Date.now(),
        })
      )
    );
  };

  // Only show completion modal when user completes the final task (not on reload)
  useEffect(() => {
    if (prevIncompleteCountRef.current === 1 && incompleteTasks.length === 0 && tasks.length > 0) {
      setShowAllComplete(true);
    } else if (incompleteTasks.length > 0) {
      setShowAllComplete(false);
    }
    prevIncompleteCountRef.current = incompleteTasks.length;
  }, [incompleteTasks.length, tasks.length]);

  if (isLoading) {
    return (
      <div className={`flex min-h-screen items-center justify-center bg-gradient-to-br transition-colors duration-[30000ms] animate-gradient ${gradientClass}`}>
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex min-h-screen items-center justify-center bg-gradient-to-br transition-colors duration-[30000ms] animate-gradient ${gradientClass}`}>
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`min-h-screen bg-gradient-to-br transition-colors duration-[30000ms] animate-gradient ${gradientClass}`}>
        <div className="mx-auto max-w-3xl">
          <Header />

          <main className="p-6">
            {tasks.length === 0 && <EmptyState onAddClick={() => setShowAddModal(true)} />}

            {/* Show celebration message if all tasks are completed */}
            {incompleteTasks.length === 0 && completedTasks.length > 0 && (
              <AllCompleteMessage onAddClick={() => setShowAddModal(true)} />
            )}

            {/* Incomplete Tasks */}
            {incompleteTasks.length > 0 && (
              <SortableContext
                items={incompleteTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {incompleteTasks.map((task: Task, index: number) => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      completedCount={completedTasks.length}
                      totalInSection={incompleteTasks.length}
                      wasDragged={lastDraggedId === task.id}
                    />
                  ))}

                  {/* Show dotted add card if less than 3 tasks */}
                  {incompleteTasks.length < 3 && (
                    <DottedAddCard
                      onAddClick={() => setShowAddModal(true)}
                      isEmpty={false}
                      showPrioritySpacing={incompleteTasks.length > 1}
                    />
                  )}
                </div>
              </SortableContext>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="mt-8">
                <h3 className={`mb-4 text-sm font-bold uppercase tracking-wide ${themeColors.sectionHeader}`}>
                  Done ✓
                </h3>
                <SortableContext
                  items={completedTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {completedTasks.map((task: Task, index: number) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        completedCount={completedTasks.length}
                        totalInSection={completedTasks.length}
                        wasDragged={lastDraggedId === task.id}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            )}
          </main>

          <AddTaskButton taskCount={incompleteTasks.length} onAddClick={() => setShowAddModal(true)} />
        </div>

        {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} taskCount={incompleteTasks.length} />}
        {showAllComplete && <AllCompleteState taskCount={completedTasks.length} />}
      </div>
    </DndContext>
  );
}

// Main App Component
export default function App() {
  return (
    <>
      <db.SignedIn>
        <Main />
      </db.SignedIn>
      <db.SignedOut>
        <Login />
      </db.SignedOut>
    </>
  );
}
