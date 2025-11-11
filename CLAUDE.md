You are an expert developer who writes full-stack apps in InstantDB, Next.js, and Tailwind developer. However InstantDB is not in your training set and you are not familiar with it.

Before generating a new next app you check to see if a next project already exists in the current directory. If it does you do not generate a new next app.

If the Instant MCP is available use the tools to create apps and manage schema.

Before you write ANY code you read ALL of instant-rules.md to understand how to use InstantDB in your code.

---

# threedooo - Product Requirements Document (PRD)

## 1. Product Overview

**Product Name:** threedooo
**Tagline:** The fun way to hyper-focus!
**Core Concept:** A web-based todo app that limits users to 3 tasks per day, emphasizing mindful prioritization with delightful visual feedback.

### 1.1 Purpose
Deliver a fun, hyper-focused, distraction-free web application that helps users manage their top 3 most important daily tasks. The app promotes mindful prioritization through playful design and provides positive reinforcement upon task completion.

### 1.2 Target User Persona
**The Overwhelmed Achiever**
- Creates long to-do lists but feels demotivated by volume
- Seeks forced focus and constraint
- Values small, consistent wins over ambitious goal-setting
- Responds well to positive reinforcement and visual feedback

## 2. Technical Stack

- **Frontend:** HTML/CSS/JavaScript (React for state management and animations)
- **Backend/Database:** InstantDB
- **Hosting:** Vercel
- **Authentication:** InstantDB magic code (email-based, passwordless)

## 3. Core Features (MVP)

### 3.1 Authentication

**User Story:** As a user, I need to securely access my personal tasks.

**Requirements:**
- Landing page with email input field
- Magic code authentication flow via InstantDB
- Email validation (basic format check)
- "Send magic code" button triggers email
- Code input screen (6-digit code entry)
- Auto-redirect to task list upon successful authentication
- Persistent session (user stays logged in)
- Sign out button accessible from main screen

**Data Privacy:**
- All task data scoped per authenticated user
- No shared or global task visibility
- User ID from InstantDB used as data partition key

**UI Notes:**
- Friendly, welcoming tone in copy
- Bright, playful loading states during auth
- Clear error messages if code is invalid/expired

### 3.2 Task Management Interface

#### 3.2.1 Main View ("Top 3" Screen)

**User Story:** As a user, I want to see my 3 most important tasks at a glance.

**Layout:**
- Single-page view (no navigation required)
- Bright, vibrant color palette
- Rounded corners and organic shapes throughout
- Ample white space
- Mobile-first responsive design

**Header:**
- App logo/name "threedooo"
- Current date display
- User profile icon (opens menu with Sign Out)

**Task List Area:**
- Vertically stacked task cards
- Maximum 3 visible tasks
- Empty state when no tasks exist (see 3.2.6)

#### 3.2.2 Task Display Elements

Each task card must include:

**Priority Indicator:**
- Large, prominent number (1, 2, 3) or icon
- Position: Left side of card
- Visual hierarchy: 1 is most prominent

**Task Title:**
- Text truncation if exceeds card width
- Font: Large, readable (18-20px)
- Click/tap to edit (inline editing)

**Completion Checkbox:**
- Large touch target (minimum 44x44px)
- Custom styled (not default browser checkbox)
- Position: Right side of card
- Unchecked state: Empty circle/rounded square
- Checked state: Filled with checkmark + animation

**Drag Handle:**
- Visual indicator (icon like ≡ or ⋮⋮)
- Position: Far left or integrated with priority number
- Cursor changes to grab on hover

#### 3.2.3 Adding Tasks

**User Story:** As a user, I want to quickly add a task when I have space available.

**Add Button (Floating Action Button - FAB):**
- Position: Fixed bottom-right corner
- Icon: "+" symbol
- Size: 56x56px (mobile), 64x64px (desktop)
- Style: Bright, contrasting color with shadow

**Behavior:**
- If < 3 tasks: Button is enabled and vibrant
  - Click opens add modal/input
- If = 3 tasks: Button is disabled
  - Replaced with encouraging message overlay or tooltip
  - Message: "You're all set! Focus on your 3 🎯" (or similar playful copy)

**Add Task Modal/Input:**
- Opens on FAB click (when enabled)
- Input field with placeholder: "What's important today?"
- Character limit: 100 characters (display counter)
- Actions:
  - "Add" button (primary, enabled when text exists)
  - "Cancel" button or close icon
- Enter key submits (if input has text)
- Auto-focus input field on open
- Modal closes after successful add
- New task appears at bottom (position 3)

#### 3.2.4 Task Prioritization (Drag and Drop)

**User Story:** As a user, I want to reorder my tasks to reflect changing priorities.

**Requirements:**
- Tasks must be drag-and-drop reorderable
- Library recommendation: react-beautiful-dnd or @dnd-kit/core
- Visual feedback during drag:
  - Task card lifts (elevation/shadow)
  - Other tasks shift to show drop position
- Drop updates priority numbers immediately
- Order persists in database (use position field or array index)
- Smooth animations (200-300ms duration)

**Mobile Considerations:**
- Long-press (500ms) initiates drag on mobile
- Visual indicator when drag mode is active
- Haptic feedback if supported

#### 3.2.5 Task Editing and Deletion

**Editing:**
- Click/tap task title text to enable inline editing
- Text becomes input field with current value
- Actions: Save (checkmark icon), Cancel (X icon) or click outside to save
- Enter key saves, Escape key cancels
- Update syncs to database immediately

**Deletion:**
- Mobile: Swipe left on task card reveals delete button
- Desktop: Hover shows delete icon (trash can) or three-dot menu
- Confirmation dialog (lightweight):
  - Message: "Delete this task?"
  - Actions: "Yes, delete" (destructive style), "Keep it"
- Deleted task animates out (fade + slide)
- Database record updated (mark as deleted or remove)

#### 3.2.6 Empty States

**User Story:** As a user, I want encouragement when starting fresh or after completing all tasks.

**No Tasks State:**
- Icon: Friendly illustration (e.g., open notepad, zen circle)
- Heading: "Ready to focus?"
- Subtext: "Add your top 3 tasks for today"
- Call-to-action: Animated arrow or pulse on FAB

**All Tasks Complete State:**
- Icon: Celebration graphic (e.g., trophy, star burst)
- Heading: "You did it! 🎉"
- Subtext: "All tasks complete. Take a moment to celebrate!"
- No FAB displayed (user has completed their 3)

### 3.3 Task Completion & Positive Reinforcement

**User Story:** As a user, I want to feel rewarded when I complete a task.

#### 3.3.1 Completion Flow

1. User clicks/taps checkbox
2. Checkbox animates to checked state
3. Micro-interaction triggers immediately:
   - Confetti burst animation (canvas-based, 1-2 seconds)
   - OR celebratory icon animation (e.g., stars, sparkles)
   - Optional: Brief positive sound effect (toggle in settings for stretch)
4. Task card visually updates:
   - Text: Strikethrough style
   - Opacity: Reduced to 60%
   - Optional: Green checkmark or badge overlay
5. Task remains in list but moves to bottom (below incomplete tasks)

**Library Recommendations:**
- Confetti: canvas-confetti or react-confetti
- Sound: Web Audio API or use-sound hook

#### 3.3.2 Completed Tasks Display

- Completed tasks appear at bottom of list
- Section header: "Done ✓" (subtle, smaller text)
- Visual separation: Light border or background color
- Completed tasks still show priority number (faded)
- Can be unchecked (toggle back to incomplete)
- Remain visible until midnight or daily reset

## 4. Data Schema (InstantDB)

### 4.1 Collections

**tasks Collection:**
```typescript
{
  id: string,              // Auto-generated UUID
  userId: string,          // From InstantDB auth
  title: string,           // Max 100 characters
  position: number,        // 0, 1, or 2 (for ordering)
  completed: boolean,      // Default: false
  completedAt: timestamp,  // Null if not completed
  createdAt: timestamp,    // Auto-generated
  updatedAt: timestamp,    // Auto-updated
  deleted: boolean         // Soft delete flag (default: false)
}
```

### 4.2 Queries

**Fetch User's Active Tasks:**
```javascript
// Get all non-deleted tasks for current user, ordered by position
db.useQuery({
  tasks: {
    $: {
      where: {
        userId: currentUser.id,
        deleted: false
      },
      order: {
        completed: 'asc',   // Incomplete first
        position: 'asc'     // Then by position
      }
    }
  }
})
```

**Add Task:**
```javascript
db.transact([
  db.tx.tasks[newTaskId].update({
    userId: currentUser.id,
    title: inputValue,
    position: currentTaskCount, // 0, 1, or 2
    completed: false,
    createdAt: Date.now(),
    deleted: false
  })
])
```

**Update Task Position (after drag):**
```javascript
// Update all affected tasks' positions in a single transaction
db.transact(
  updatedTasks.map(task =>
    db.tx.tasks[task.id].update({ position: task.newPosition })
  )
)
```

## 5. UI/UX Specifications

### 5.1 Visual Design Principles

- **Bright & Vibrant:** Use a cheerful color palette (e.g., pastels, neon accents)
- **Rounded & Organic:** Border-radius on all cards/buttons (12-20px)
- **Ample Spacing:** Generous padding and margins for breathing room
- **Typography:** Friendly, modern sans-serif (e.g., Inter, DM Sans, Poppins)
- **Micro-interactions:** Hover states, button presses, smooth transitions

### 5.2 Animation Guidelines

- **Duration:** 200-400ms for most transitions
- **Easing:** Ease-in-out for natural feel
- **Purpose:** Every animation should have a functional purpose (feedback, state change, delight)
- **Performance:** Use CSS transforms (translate, scale) over position/dimensions

### 5.3 Responsive Breakpoints

- **Mobile:** < 768px (single column, touch-optimized)
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px (centered content, max-width ~800px)

### 5.4 Accessibility

- Minimum touch target size: 44x44px
- Color contrast: WCAG AA compliant (4.5:1 for text)
- Keyboard navigation: All interactions accessible via keyboard
- Screen reader labels: Meaningful aria-labels on interactive elements
- Focus indicators: Visible outline on focused elements

## 6. Stretch Goals (Post-MVP)

### 6.1 Daily Reset
- Automatically archive completed tasks at midnight (user's local timezone)
- Move incomplete tasks to an "Yesterday's carryover" section
- Fresh slate for new Top 3
- Implementation: Scheduled function or client-side check on app open

### 6.2 Streak System
- Track consecutive days with at least 1 task created
- Display streak count on main screen (e.g., "🔥 7 day streak!")
- Celebratory animation on milestone streaks (7, 30, 100 days)
- Data: New userStats collection with currentStreak, lastActiveDate

### 6.3 Completion Badges
- Award badges for achievements:
  - "First Win" (complete first task)
  - "Hat Trick" (complete all 3 tasks in a day)
  - "Week Warrior" (7 days of completing all tasks)
  - "Century Club" (100 total completions)
- Display badges in profile/settings area
- Badge notification modal on earning

### 6.4 Theme Customization
- 3-5 pre-made color themes (e.g., Ocean, Sunset, Forest, Neon)
- Theme picker in settings
- Persist preference in user profile
- Smooth color transitions when switching (CSS variables)

### 6.5 Completion Metrics Dashboard
- Total tasks completed (all-time)
- Average completion rate
- Most productive day of week
- Simple, visual charts (e.g., bar chart, calendar heatmap)
- Accessible via profile icon menu

### 6.6 Playful Blank States (Enhanced)
- Multiple variations of empty state messages (rotate randomly)
- Animated illustrations using Lottie or CSS animations
- Seasonal or time-based messages (e.g., "Good morning!" before noon)

### 6.7 Offline Mode
- Cache tasks using LocalStorage or IndexedDB
- Sync changes when connection restored (InstantDB handles this partially)
- Visual indicator when offline
- Optimistic UI updates (show changes immediately, sync in background)

## 8. Success Metrics

**Engagement:**
- Daily active users (DAU)
- Average tasks completed per user per day
- Retention rate (7-day, 30-day)

**Behavior:**
- % of users who complete all 3 tasks in a day
- Average time between task creation and completion
- Task reorder frequency

**Delight:**
- User feedback/testimonials mentioning "fun" or "satisfying"
- Low churn rate
- High completion rates (vs. traditional todo apps)

## 9. Technical Considerations

### 9.1 InstantDB Setup
- Sign up at instantdb.com
- Create app and get app ID
- Install @instantdb/react package
- Initialize InstantDB in your app with auth enabled
- Set up data permissions (ensure users can only access their own tasks)

### 9.2 Performance
- Lazy load animations (bundle-split confetti library)
- Optimize re-renders (React.memo, useMemo for expensive operations)
- Debounce text input updates to database (300ms)
- Use optimistic updates for instant UI feedback

### 9.3 Security
- InstantDB handles auth security
- Validate input client-side (character limits, required fields)
- Use InstantDB permissions to enforce user data isolation
- Sanitize user input to prevent XSS (use React's built-in escaping)

## 10. Open Questions / Decisions Needed

- **Sound Effects:** Should completion trigger a sound? (Make toggleable in settings?)
- **Task Character Limit:** 100 characters sufficient, or allow more?
- **Undo Deletion:** Should we support "undo" for accidental deletions?
- **Daily Reset Time:** Midnight in user's timezone, or fixed UTC time?
- **Completed Task Retention:** Keep completed tasks visible for how long? (Current day only, or persist?)

---

## 11. Development Changelog

### Experimental Features Branch Merge (November 2025)

**Branch:** `experimental-features` merged into `main`

**Summary of Changes:**

1. **Major UI/UX Refactor** (`threedooo/app/page.tsx`)
   - Significant component restructuring (~400 line additions, ~120 deletions)
   - Enhanced task management interface implementation
   - Improved state management and user interactions

2. **Styling Enhancements** (`threedooo/app/globals.css`)
   - Added 20 lines of custom CSS styles
   - Enhanced visual design to align with bright, vibrant design principles

3. **Dependency Updates** (`package.json` & `package-lock.json`)
   - Added 3 new package dependencies for enhanced functionality
   - Updated lock file with 57 new lines

4. **Documentation Updates**
   - Minor refinements to `instant-rules.md`
   - Added empty `index.html` placeholder file

**Implementation Status:**
- Core UI components refactored and enhanced
- Foundation laid for full MVP feature implementation
- Ready for further feature development per PRD specifications