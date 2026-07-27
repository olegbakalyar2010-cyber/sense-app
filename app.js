/* SENSE Telegram Mini App — Client Logic */

// Telegram WebApp Initialization
const tg = window.Telegram?.WebApp || null;

if (tg) {
  tg.ready();
  tg.expand();
  if (tg.enableClosingConfirmation) {
    tg.enableClosingConfirmation();
  }
}

// Helper: Haptic Feedback
function triggerHaptic(type = 'light') {
  if (tg && tg.HapticFeedback) {
    if (type === 'light') tg.HapticFeedback.impactOccurred('light');
    else if (type === 'medium') tg.HapticFeedback.impactOccurred('medium');
    else if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
  }
}

// Initial State Data
const DEFAULT_STATE = {
  streak: 1,
  waterGoal: 2.9, // Liters
  waterCurrent: 0.0,
  calorieGoal: 2661,
  macrosGoal: { p: 140, f: 80, c: 300, fib: 30 },
  meals: {
    'Завтрак': [],
    'Обед': [],
    'Ужин': [],
    'Перекус': []
  },
  habits: [
    { id: 1, title: 'Утренняя зарядка / Разминка', completed: false, streak: 3 },
    { id: 2, title: 'Выпить 2.5л+ воды', completed: false, streak: 5 },
    { id: 3, title: 'Чтение книги (20+ мин)', completed: false, streak: 2 },
    { id: 4, title: 'Соблюдение КБЖУ', completed: false, streak: 1 }
  ],
  notes: [],
  sleepTime: '23:00',
  workouts: [],
  books: [],
  bodyStats: { weight: 75.0, targetWeight: 70.0 }
};

// Load State from LocalStorage
let appState = JSON.parse(localStorage.getItem('SENSE_APP_DATA')) || DEFAULT_STATE;

function saveState() {
  localStorage.setItem('SENSE_APP_DATA', JSON.stringify(appState));
  renderAll();
}

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  initTelegramUser();
  setupNavigation();
  setupSubTabs();
  renderAll();
});

// Setup Telegram User Info
function initTelegramUser() {
  const username = tg?.initDataUnsafe?.user?.username || tg?.initDataUnsafe?.user?.first_name || 'ProtocolUser';
  const firstLetter = username.charAt(0).toUpperCase();

  const userAvatarChar = document.getElementById('user-avatar-char');
  const profileAvatarCharLg = document.getElementById('profile-avatar-char-lg');
  const profileUsernameDisplay = document.getElementById('profile-username-display');

  if (userAvatarChar) userAvatarChar.textContent = firstLetter;
  if (profileAvatarCharLg) profileAvatarCharLg.textContent = firstLetter;
  if (profileUsernameDisplay) profileUsernameDisplay.textContent = `@${username}`;

  // Current Date display
  const dateBadge = document.getElementById('current-date-badge');
  if (dateBadge) {
    const now = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'long' };
    dateBadge.textContent = now.toLocaleDateString('ru-RU', options);
  }
}

// Navigation between 5 main tabs
function setupNavigation() {
  const navButtons = document.querySelectorAll('.bottom-nav .nav-item');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
      triggerHaptic('light');
    });
  });
}

function switchTab(tabId) {
  // Update nav buttons active state
  document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  // Update tab screens
  document.querySelectorAll('.tab-screen').forEach(screen => {
    screen.classList.remove('active');
  });

  const activeScreen = document.getElementById(`tab-${tabId}`);
  if (activeScreen) {
    activeScreen.classList.add('active');
  }
}

// Setup Sub-tabs (Personal / Today)
function setupSubTabs() {
  // Personal Subtabs
  const personalBtns = document.querySelectorAll('#tab-personal .sub-nav-pills .pill-btn');
  personalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      personalBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.getAttribute('data-personaltab');
      document.querySelectorAll('.personal-subscreen').forEach(sub => sub.classList.remove('active'));
      const activeSub = document.getElementById(`personal-subtab-${target}`);
      if (activeSub) activeSub.classList.add('active');
      triggerHaptic('light');
    });
  });
}

// RENDER FUNCTIONS
function renderAll() {
  renderTodaySummary();
  renderNutrition();
  renderHabits();
  renderPersonal();
}

// 1. TODAY DASHBOARD SUMMARY
function renderTodaySummary() {
  // Calculate Habits %
  const totalHabits = appState.habits.length;
  const completedHabits = appState.habits.filter(h => h.completed).length;
  const habitsPercent = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  // Calculate KBJU %
  const totalLoggedCalories = getLoggedCalories();
  const kbjuPercent = Math.min(100, Math.round((totalLoggedCalories / appState.calorieGoal) * 100));

  // Calculate Water %
  const waterPercent = Math.min(100, Math.round((appState.waterCurrent / appState.waterGoal) * 100));

  // Workout %
  const workoutPercent = appState.workouts.length > 0 ? 100 : 0;

  // Overall Average
  const overall = Math.round((habitsPercent + kbjuPercent + waterPercent + workoutPercent) / 4);

  // Update UI Text
  document.getElementById('val-tasks-percent').textContent = `${habitsPercent}%`;
  document.getElementById('val-kbju-percent').textContent = `${kbjuPercent}%`;
  document.getElementById('val-water-percent').textContent = `${waterPercent}%`;
  document.getElementById('val-workout-percent').textContent = `${workoutPercent}%`;
  document.getElementById('overall-percentage').textContent = `${overall}%`;

  // Update SVG Ring offset (circumference = 2 * PI * 42 = 263.89)
  const ringBar = document.getElementById('overall-ring-bar');
  if (ringBar) {
    const strokeDashoffset = 264 - (264 * overall) / 100;
    ringBar.style.strokeDashoffset = strokeDashoffset;
  }

  // Quick Notes display
  const notesCount = document.getElementById('notes-count-display');
  const notesSub = document.getElementById('notes-sub-display');
  if (notesCount && notesSub) {
    notesCount.textContent = appState.notes.length;
    notesSub.textContent = appState.notes.length > 0 ? appState.notes[appState.notes.length - 1] : 'Пока пусто';
  }

  // Sleep time display
  const sleepTimeDisplay = document.getElementById('sleep-time-display');
  if (sleepTimeDisplay) {
    sleepTimeDisplay.textContent = appState.sleepTime || '23:00';
  }
}

// 2. NUTRITION TAB
function getLoggedCalories() {
  let total = 0;
  Object.values(appState.meals).forEach(mealArray => {
    mealArray.forEach(item => { total += Number(item.calories || 0); });
  });
  return total;
}

function getLoggedMacros() {
  let p = 0, f = 0, c = 0, fib = 0;
  Object.values(appState.meals).forEach(mealArray => {
    mealArray.forEach(item => {
      p += Number(item.p || 0);
      f += Number(item.f || 0);
      c += Number(item.c || 0);
      fib += Number(item.fib || 0);
    });
  });
  return { p, f, c, fib };
}

function renderNutrition() {
  const loggedCal = getLoggedCalories();
  document.getElementById('calories-logged-val').textContent = loggedCal;
  document.getElementById('calories-goal-val').textContent = `из ${appState.calorieGoal}`;

  // Calorie Ring (circumference = 2 * PI * 40 = 251.2)
  const calBar = document.getElementById('calorie-ring-bar');
  if (calBar) {
    const pct = Math.min(100, (loggedCal / appState.calorieGoal) * 100);
    calBar.style.strokeDashoffset = 251.2 - (251.2 * pct) / 100;
  }

  // Macros
  const macros = getLoggedMacros();
  const updateMacro = (type, val, goal) => {
    const pct = Math.min(100, Math.round((val / goal) * 100));
    document.getElementById(`macro-${type}-percent`).textContent = `${pct}%`;
    document.getElementById(`macro-${type}-gram`).textContent = `${val}г`;
    document.getElementById(`macro-${type}-bar`).style.width = `${pct}%`;
  };

  updateMacro('p', macros.p, appState.macrosGoal.p);
  updateMacro('f', macros.f, appState.macrosGoal.f);
  updateMacro('c', macros.c, appState.macrosGoal.c);
  updateMacro('fib', macros.fib, appState.macrosGoal.fib);

  // Water
  document.getElementById('water-logged-val').textContent = appState.waterCurrent.toFixed(1);
  document.getElementById('water-goal-val').textContent = appState.waterGoal.toFixed(1);
  document.getElementById('water-logged-total').textContent = appState.waterCurrent.toFixed(1);

  // Meals List Rendering
  const renderMealSection = (mealName, containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const items = appState.meals[mealName] || [];

    if (items.length === 0) {
      container.innerHTML = `<span class="empty-hint">Нажми + чтобы добавить ${mealName.toLowerCase()}</span>`;
    } else {
      container.innerHTML = items.map((item, idx) => `
        <div class="food-item-row">
          <div>
            <div class="food-name">${item.name}</div>
            <div class="food-meta">${item.calories} ккал • Б:${item.p}г Ж:${item.f}г У:${item.c}г</div>
          </div>
          <button class="btn-text-ghost" onclick="removeFoodItem('${mealName}', ${idx})">✕</button>
        </div>
      `).join('');
    }
  };

  renderMealSection('Завтрак', 'meal-items-breakfast');
  renderMealSection('Обед', 'meal-items-lunch');
  renderMealSection('Ужин', 'meal-items-dinner');
  renderMealSection('Перекус', 'meal-items-snack');
}

function addWater(amount) {
  appState.waterCurrent += amount;
  triggerHaptic('medium');
  saveState();
}

function resetNutritionToday() {
  appState.meals = { 'Завтрак': [], 'Обед': [], 'Ужин': [], 'Перекус': [] };
  appState.waterCurrent = 0.0;
  triggerHaptic('success');
  saveState();
}

// 3. HABITS / PATH TAB
function renderHabits() {
  const container = document.getElementById('habits-list-container');
  if (!container) return;

  if (appState.habits.length === 0) {
    container.innerHTML = `<div class="empty-box">Нет привычек. Нажмите "+ Новая привычка" выше.</div>`;
    return;
  }

  container.innerHTML = appState.habits.map(habit => `
    <div class="habit-card-item ${habit.completed ? 'completed' : ''}" onclick="toggleHabit(${habit.id})">
      <div class="habit-left">
        <div class="habit-checkbox">${habit.completed ? '✓' : ''}</div>
        <div class="habit-title">${habit.title}</div>
      </div>
      <div class="habit-streak-badge">⚡ ${habit.streak}дн</div>
    </div>
  `).join('');
}

function toggleHabit(id) {
  const habit = appState.habits.find(h => h.id === id);
  if (habit) {
    habit.completed = !habit.completed;
    if (habit.completed) habit.streak += 1;
    else habit.streak = Math.max(1, habit.streak - 1);
    triggerHaptic('medium');
    saveState();
  }
}

// 4. PERSONAL TAB
function renderPersonal() {
  // Workouts
  const workoutsEmpty = document.getElementById('workouts-empty-state');
  if (workoutsEmpty) {
    if (appState.workouts.length > 0) {
      workoutsEmpty.innerHTML = appState.workouts.map(w => `
        <div class="food-item-row">
          <div><strong>${w.title}</strong> — ${w.duration} мин</div>
          <div class="food-meta">${w.date}</div>
        </div>
      `).join('');
    } else {
      workoutsEmpty.innerHTML = `<p>Нет тренировок. Добавь первую ниже.</p>`;
    }
  }
}

// MODAL CONTROLS
function closeModal() {
  const modal = document.getElementById('app-modal');
  if (modal) modal.classList.remove('active');
}

function openNoteModal() {
  document.getElementById('modal-title').textContent = 'Новая заметка';
  document.getElementById('modal-body').innerHTML = `
    <input type="text" id="input-modal-note" class="modal-input" placeholder="Введите текст заметки..." autofocus />
    <button class="btn-primary-sm" style="margin-top: 10px; width: 100%" onclick="saveNoteFromModal()">Сохранить</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveNoteFromModal() {
  const text = document.getElementById('input-modal-note').value.trim();
  if (text) {
    appState.notes.push(text);
    triggerHaptic('success');
    saveState();
    closeModal();
  }
}

function openSleepModal() {
  document.getElementById('modal-title').textContent = 'Время отхода ко сну';
  document.getElementById('modal-body').innerHTML = `
    <input type="time" id="input-modal-sleep" class="modal-input" value="${appState.sleepTime || '23:00'}" />
    <button class="btn-primary-sm" style="margin-top: 10px; width: 100%" onclick="saveSleepFromModal()">Сохранить</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveSleepFromModal() {
  const val = document.getElementById('input-modal-sleep').value;
  if (val) {
    appState.sleepTime = val;
    triggerHaptic('success');
    saveState();
    closeModal();
  }
}

function openAddFoodModal(mealName) {
  document.getElementById('modal-title').textContent = `Добавить в ${mealName}`;
  document.getElementById('modal-body').innerHTML = `
    <input type="text" id="food-input-name" class="modal-input" placeholder="Название блюда (напр., Овсянка)" />
    <input type="number" id="food-input-cal" class="modal-input" placeholder="Калории (ккал)" />
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
      <input type="number" id="food-input-p" class="modal-input" placeholder="Белки (г)" />
      <input type="number" id="food-input-f" class="modal-input" placeholder="Жиры (г)" />
      <input type="number" id="food-input-c" class="modal-input" placeholder="Угл (г)" />
    </div>
    <button class="btn-primary-sm" style="margin-top: 10px; width: 100%" onclick="saveFoodFromModal('${mealName}')">Добавить</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveFoodFromModal(mealName) {
  const name = document.getElementById('food-input-name').value.trim() || 'Блюдо';
  const calories = Number(document.getElementById('food-input-cal').value) || 0;
  const p = Number(document.getElementById('food-input-p').value) || 0;
  const f = Number(document.getElementById('food-input-f').value) || 0;
  const c = Number(document.getElementById('food-input-c').value) || 0;

  appState.meals[mealName].push({ name, calories, p, f, c, fib: 0 });
  triggerHaptic('success');
  saveState();
  closeModal();
}

function removeFoodItem(mealName, index) {
  appState.meals[mealName].splice(index, 1);
  triggerHaptic('light');
  saveState();
}

function openAddHabitModal() {
  document.getElementById('modal-title').textContent = 'Новая привычка';
  document.getElementById('modal-body').innerHTML = `
    <input type="text" id="habit-input-title" class="modal-input" placeholder="Название (напр., Медитация)" />
    <button class="btn-primary-sm" style="margin-top: 10px; width: 100%" onclick="saveHabitFromModal()">Создать</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveHabitFromModal() {
  const title = document.getElementById('habit-input-title').value.trim();
  if (title) {
    appState.habits.push({ id: Date.now(), title, completed: false, streak: 1 });
    triggerHaptic('success');
    saveState();
    closeModal();
  }
}

function openAddWorkoutModal() {
  document.getElementById('modal-title').textContent = 'Записать тренировку';
  document.getElementById('modal-body').innerHTML = `
    <input type="text" id="workout-input-title" class="modal-input" placeholder="Вид (напр., Силовая / Бег)" />
    <input type="number" id="workout-input-dur" class="modal-input" placeholder="Длительность (минуты)" />
    <button class="btn-primary-sm" style="margin-top: 10px; width: 100%" onclick="saveWorkoutFromModal()">Записать</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveWorkoutFromModal() {
  const title = document.getElementById('workout-input-title').value.trim() || 'Тренировка';
  const duration = Number(document.getElementById('workout-input-dur').value) || 45;
  const date = new Date().toLocaleDateString('ru-RU');

  appState.workouts.push({ title, duration, date });
  triggerHaptic('success');
  saveState();
  closeModal();
}

function resetAllAppData() {
  if (confirm('Сбросить все сохраненные данные SENSE?')) {
    localStorage.removeItem('SENSE_APP_DATA');
    appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState();
    triggerHaptic('success');
  }
}
