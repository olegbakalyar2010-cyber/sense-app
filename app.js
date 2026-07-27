/* PROTOCOL Life OS — Client Logic & Full Features (No AI) */

const tg = window.Telegram?.WebApp || null;

if (tg) {
  tg.ready();
  tg.expand();
}

function triggerHaptic(type = 'light') {
  if (tg && tg.HapticFeedback) {
    if (type === 'light') tg.HapticFeedback.impactOccurred('light');
    else if (type === 'medium') tg.HapticFeedback.impactOccurred('medium');
    else if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
  }
}

// State
const DEFAULT_STATE = {
  userProfile: {
    name: 'Пользователь',
    weight: 75.0,
    waist: 82,
    chest: 100,
    biceps: 36,
    caloriesGoal: 2661,
    waterGoal: 2.9,
    p: 160,
    f: 75,
    c: 320,
    fib: 30
  },
  waterCurrent: 0.0,
  drinksLog: [],
  sleepData: {
    bedtime: '23:00',
    waketime: '06:30',
    quality: 8
  },
  streak: 1,
  meals: {
    'Завтрак': [],
    'Обед': [],
    'Ужин': [],
    'Перекус': []
  },
  notes: [],
  ideas: [],
  workouts: [],
  books: [],
  bodyLog: [
    { date: '28 Июля', weight: 75.0, waist: 82, chest: 100, biceps: 36 }
  ],
  habits: [
    { id: 1, icon: '💧', title: 'Питьевой режим (Вода)', completed: false, streak: 6 },
    { id: 2, icon: '🏃‍♂️', title: 'Тренировка / Физ. активность', completed: false, streak: 4 },
    { id: 3, icon: '🧴', title: 'Уход за собой (Self-Care)', completed: false, streak: 3 },
    { id: 4, icon: '📖', title: 'Чтение книги (20+ мин)', completed: false, streak: 5 },
    { id: 5, icon: '🤲', title: 'Духовный ритуал / Молитва', completed: false, streak: 7 }
  ]
};

let appState = JSON.parse(localStorage.getItem('PROTOCOL_APP_DATA_V3')) || DEFAULT_STATE;

function saveState() {
  localStorage.setItem('PROTOCOL_APP_DATA_V3', JSON.stringify(appState));
  renderAll();
}

document.addEventListener('DOMContentLoaded', () => {
  initTelegramUser();
  setupNavigation();
  renderAll();
});

function initTelegramUser() {
  const username = tg?.initDataUnsafe?.user?.first_name || appState.userProfile.name || 'Друг';
  const firstLetter = username.charAt(0).toUpperCase();

  const userAvatarChar = document.getElementById('user-avatar-char');
  const profileAvatarCharLg = document.getElementById('profile-avatar-char-lg');
  const profileUsernameDisplay = document.getElementById('profile-username-display');

  if (userAvatarChar) userAvatarChar.textContent = firstLetter;
  if (profileAvatarCharLg) profileAvatarCharLg.textContent = firstLetter;
  if (profileUsernameDisplay) profileUsernameDisplay.textContent = `@${username}`;

  const dateBadge = document.getElementById('current-date-badge');
  if (dateBadge) {
    const now = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'long' };
    dateBadge.textContent = now.toLocaleDateString('ru-RU', options);
  }
}

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
  document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.tab-screen').forEach(screen => {
    screen.classList.remove('active');
  });

  const activeScreen = document.getElementById(`tab-${tabId}`);
  if (activeScreen) {
    activeScreen.classList.add('active');
  }
}

function switchSubTab(subTab) {
  document.getElementById('subtab-btn-today').classList.toggle('active', subTab === 'today');
  document.getElementById('subtab-btn-history').classList.toggle('active', subTab === 'history');

  document.getElementById('today-main-view').style.display = subTab === 'today' ? 'block' : 'none';
  document.getElementById('today-history-view').style.display = subTab === 'history' ? 'block' : 'none';
  triggerHaptic('light');
}

function renderAll() {
  renderTodaySummary();
  renderNutrition();
  renderHabits();
  renderPersonal();
}

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

// 1. TODAY SUMMARY
function renderTodaySummary() {
  const calGoal = appState.userProfile.caloriesGoal || 2661;
  const waterGoal = appState.userProfile.waterGoal || 2.9;

  const loggedCal = getLoggedCalories();

  const kbjuPercent = Math.min(100, Math.round((loggedCal / calGoal) * 100));
  const waterPercent = Math.min(100, Math.round((appState.waterCurrent / waterGoal) * 100));

  const totalHabits = appState.habits.length;
  const completedHabits = appState.habits.filter(h => h.completed).length;
  const habitsPercent = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  const workoutPercent = appState.workouts.length > 0 ? 100 : 0;

  const overall = Math.round((habitsPercent + kbjuPercent + workoutPercent + waterPercent) / 4);

  document.getElementById('val-tasks-percent').textContent = `${habitsPercent}%`;
  document.getElementById('val-kbju-percent').textContent = `${kbjuPercent}%`;
  document.getElementById('val-workouts-percent').textContent = `${workoutPercent}%`;
  document.getElementById('val-water-percent').textContent = `${waterPercent}%`;
  document.getElementById('overall-percentage').textContent = `${overall}%`;

  const ringBar = document.getElementById('overall-ring-bar');
  if (ringBar) {
    ringBar.style.strokeDashoffset = 264 - (264 * overall) / 100;
  }

  // Home Notes Subtitle
  const notesCountBadge = document.getElementById('home-notes-count-badge');
  const notesSubtitle = document.getElementById('home-notes-subtitle');

  if (notesCountBadge) notesCountBadge.textContent = appState.notes.length;
  if (notesSubtitle) {
    notesSubtitle.textContent = appState.notes.length > 0 ? `Записей: ${appState.notes.length}` : 'Пока пусто';
  }

  const sleepBadge = document.getElementById('home-sleep-time-badge');
  const sleepSub = document.getElementById('home-sleep-status-sub');
  if (sleepBadge && appState.sleepData) {
    sleepBadge.textContent = appState.sleepData.bedtime || '23:00';
    if (sleepSub) {
      sleepSub.textContent = `Качество: ${appState.sleepData.quality || 8}/10`;
    }
  }
}

// 2. NUTRITION SCREEN
function renderNutrition() {
  const calGoal = appState.userProfile.caloriesGoal || 2661;
  const waterGoal = appState.userProfile.waterGoal || 2.9;
  const loggedCal = getLoggedCalories();

  const leftCal = Math.max(0, calGoal - loggedCal);
  document.getElementById('calories-left-text').textContent = `Осталось ${leftCal} ккал`;
  document.getElementById('calories-logged-val').textContent = loggedCal;
  document.getElementById('calories-goal-val').textContent = `из ${calGoal}`;

  const calBar = document.getElementById('calorie-ring-bar');
  if (calBar) {
    const pct = Math.min(100, (loggedCal / calGoal) * 100);
    calBar.style.strokeDashoffset = 251.2 - (251.2 * pct) / 100;
  }

  const macros = getLoggedMacros();
  const updateMacro = (type, val, targetVal) => {
    const pct = Math.min(100, Math.round((val / targetVal) * 100));
    document.getElementById(`macro-${type}-percent`).textContent = `${pct}%`;
    document.getElementById(`macro-${type}-bar`).style.width = `${pct}%`;
  };

  updateMacro('p', macros.p, appState.userProfile.p || 160);
  updateMacro('f', macros.f, appState.userProfile.f || 75);
  updateMacro('c', macros.c, appState.userProfile.c || 320);
  updateMacro('fib', macros.fib, appState.userProfile.fib || 30);

  const waterSummary = document.getElementById('water-summary-text');
  if (waterSummary) {
    waterSummary.textContent = `${appState.waterCurrent.toFixed(1)} / ${waterGoal} л • Жидкости всего ${appState.waterCurrent.toFixed(1)} л`;
  }

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

function selectNutritionDate(dateLabel, el) {
  document.querySelectorAll('.date-strip-item').forEach(item => item.classList.remove('active'));
  el.classList.add('active');
  triggerHaptic('light');
}

function toggleWaterAccordion() {
  const body = document.getElementById('water-accordion-body');
  const arrow = document.getElementById('water-accordion-arrow');
  if (body) {
    const isOpen = body.style.display === 'block';
    body.style.display = isOpen ? 'none' : 'block';
    if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
  }
}

function addWater(amount) {
  appState.waterCurrent += amount;
  triggerHaptic('medium');
  saveState();
}

function addDrinkCustom(name, amount) {
  appState.waterCurrent += amount;
  appState.drinksLog.unshift({ name, amount, date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
  triggerHaptic('medium');
  saveState();
}

function resetNutritionToday() {
  appState.meals = { 'Завтрак': [], 'Обед': [], 'Ужин': [], 'Перекус': [] };
  appState.waterCurrent = 0.0;
  triggerHaptic('success');
  saveState();
}

// 3. HABITS (PATH)
function renderHabits() {
  const container = document.getElementById('habits-list-container');
  if (!container) return;

  if (appState.habits.length === 0) {
    container.innerHTML = `<div class="empty-box">Нет ритуалов. Нажмите "+ Ритуал".</div>`;
    return;
  }

  container.innerHTML = appState.habits.map(habit => `
    <div class="habit-card-item ${habit.completed ? 'completed' : ''}" onclick="toggleHabit(${habit.id})">
      <div class="habit-left">
        <span class="habit-icon-emoji">${habit.icon || '✨'}</span>
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

function openAddHabitModal() {
  document.getElementById('modal-title').textContent = 'Новый Ритуал Protocol';
  document.getElementById('modal-body').innerHTML = `
    <input type="text" id="habit-input-title" class="modal-input" placeholder="Название привычки" />
    <button class="btn-primary-sm" style="margin-top: 10px; width: 100%" onclick="saveHabitFromModal()">Создать ритуал</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveHabitFromModal() {
  const title = document.getElementById('habit-input-title').value.trim();
  if (title) {
    appState.habits.push({ id: Date.now(), icon: '✨', title, completed: false, streak: 1 });
    triggerHaptic('success');
    saveState();
    closeModal();
  }
}

// 4. PERSONAL (WORKOUTS, BOOKS, BODY MEASUREMENTS)
function switchPersonalSubTab(subTab) {
  document.getElementById('personal-sub-workout').classList.toggle('active', subTab === 'workout');
  document.getElementById('personal-sub-books').classList.toggle('active', subTab === 'books');
  document.getElementById('personal-sub-body').classList.toggle('active', subTab === 'body');

  document.getElementById('personal-section-workout').style.display = subTab === 'workout' ? 'block' : 'none';
  document.getElementById('personal-section-books').style.display = subTab === 'books' ? 'block' : 'none';
  document.getElementById('personal-section-body').style.display = subTab === 'body' ? 'block' : 'none';
  triggerHaptic('light');
}

function renderPersonal() {
  // Workouts
  const wContainer = document.getElementById('workouts-list-container');
  if (wContainer) {
    wContainer.innerHTML = appState.workouts.length === 0
      ? `<div class="empty-box">Нет записей тренировок. Нажмите "+ Тренировка".</div>`
      : appState.workouts.map(w => `
        <div class="journal-card">
          <div class="journal-meta">
            <span class="journal-tag">🏋️‍♂️ ${w.type}</span>
            <span class="journal-date">${w.date}</span>
          </div>
          <div class="journal-content">${w.details}</div>
        </div>
      `).join('');
  }

  // Books
  const bContainer = document.getElementById('books-list-container');
  if (bContainer) {
    bContainer.innerHTML = appState.books.length === 0
      ? `<div class="empty-box">Список книг пуст. Нажмите "+ Добавить книгу".</div>`
      : appState.books.map(b => `
        <div class="journal-card">
          <div class="journal-meta">
            <span class="journal-tag">📚 ${b.title}</span>
            <span class="journal-date">${b.pages} стр</span>
          </div>
          <div class="journal-content">Автор: ${b.author}</div>
        </div>
      `).join('');
  }

  // Body Measurements
  const bodyContainer = document.getElementById('body-measurements-container');
  if (bodyContainer) {
    bodyContainer.innerHTML = `
      <div style="font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 8px;">Текущие замеры тела:</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
        <div class="macro-item">
          <div class="macro-label">⚖️ ВЕС</div>
          <div style="font-size: 16px; font-weight: 800; color: #fff;">${appState.userProfile.weight || 75} кг</div>
        </div>
        <div class="macro-item">
          <div class="macro-label">📏 ТАЛИЯ</div>
          <div style="font-size: 16px; font-weight: 800; color: #fff;">${appState.userProfile.waist || 82} см</div>
        </div>
        <div class="macro-item">
          <div class="macro-label">💪 БИЦЕПС</div>
          <div style="font-size: 16px; font-weight: 800; color: #fff;">${appState.userProfile.biceps || 36} см</div>
        </div>
        <div class="macro-item">
          <div class="macro-label">👕 ГРУДЬ</div>
          <div style="font-size: 16px; font-weight: 800; color: #fff;">${appState.userProfile.chest || 100} см</div>
        </div>
      </div>
    `;
  }
}

// MODALS (NOTES LIST & IDEAS LIST)
function openNotesListModal() {
  document.getElementById('modal-title').textContent = '📝 Мои Заметки';
  const notesHtml = appState.notes.length === 0
    ? `<div class="empty-box">Заметок пока нет. Нажмите "Создать" ниже.</div>`
    : appState.notes.map((n, i) => `
      <div class="journal-card" style="margin-bottom: 8px;">
        <div class="journal-meta">
          <span class="journal-date">${n.date}</span>
          <button class="btn-text-ghost" onclick="deleteNote(${i})">✕</button>
        </div>
        <div class="journal-content">${n.text}</div>
      </div>
    `).join('');

  document.getElementById('modal-body').innerHTML = `
    <div style="max-height: 260px; overflow-y: auto;">${notesHtml}</div>
    <textarea id="input-new-note-text" class="modal-input" rows="3" placeholder="Новая заметка..."></textarea>
    <button class="btn-primary-sm" style="margin-top: 8px; width: 100%" onclick="saveNoteFromModal()">+ Создать заметку</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveNoteFromModal() {
  const text = document.getElementById('input-new-note-text').value.trim();
  if (text) {
    appState.notes.unshift({ id: Date.now(), text, date: new Date().toLocaleDateString('ru-RU') });
    triggerHaptic('success');
    saveState();
    openNotesListModal();
  }
}

function deleteNote(index) {
  appState.notes.splice(index, 1);
  triggerHaptic('light');
  saveState();
  openNotesListModal();
}

function openIdeasListModal() {
  document.getElementById('modal-title').textContent = '💡 Мои Идеи';
  const ideasHtml = appState.ideas.length === 0
    ? `<div class="empty-box">Идей пока нет. Нажмите "Сохранить идею" ниже.</div>`
    : appState.ideas.map((idea, i) => `
      <div class="journal-card" style="margin-bottom: 8px;">
        <div class="journal-meta">
          <span class="journal-date">${idea.date}</span>
          <button class="btn-text-ghost" onclick="deleteIdea(${i})">✕</button>
        </div>
        <div class="journal-content">${idea.text}</div>
      </div>
    `).join('');

  document.getElementById('modal-body').innerHTML = `
    <div style="max-height: 260px; overflow-y: auto;">${ideasHtml}</div>
    <textarea id="input-new-idea-text" class="modal-input" rows="3" placeholder="Запишите инсайт или идею..."></textarea>
    <button class="btn-primary-sm" style="margin-top: 8px; width: 100%" onclick="saveIdeaFromModal()">+ Сохранить идею</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveIdeaFromModal() {
  const text = document.getElementById('input-new-idea-text').value.trim();
  if (text) {
    appState.ideas.unshift({ id: Date.now(), text, date: new Date().toLocaleDateString('ru-RU') });
    triggerHaptic('success');
    saveState();
    openIdeasListModal();
  }
}

function deleteIdea(index) {
  appState.ideas.splice(index, 1);
  triggerHaptic('light');
  saveState();
  openIdeasListModal();
}

function openSleepModal() {
  document.getElementById('modal-title').textContent = '🌙 Записать Сон Protocol';
  document.getElementById('modal-body').innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      <div>
        <label style="font-size: 11px; color: var(--text-muted);">Отход ко сну</label>
        <input type="time" id="input-sleep-bed" class="modal-input" value="${appState.sleepData.bedtime || '23:00'}" />
      </div>
      <div>
        <label style="font-size: 11px; color: var(--text-muted);">Время подъема</label>
        <input type="time" id="input-sleep-wake" class="modal-input" value="${appState.sleepData.waketime || '06:30'}" />
      </div>
    </div>
    <div style="margin-top: 10px;">
      <label style="font-size: 11px; color: var(--text-muted);">Оценка качества (1-10)</label>
      <input type="number" id="input-sleep-quality" class="modal-input" min="1" max="10" value="${appState.sleepData.quality || 8}" />
    </div>
    <button class="btn-primary-sm" style="margin-top: 12px; width: 100%" onclick="saveSleepFromModal()">Сохранить сон</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveSleepFromModal() {
  const bedtime = document.getElementById('input-sleep-bed').value;
  const waketime = document.getElementById('input-sleep-wake').value;
  const quality = Number(document.getElementById('input-sleep-quality').value) || 8;

  appState.sleepData.bedtime = bedtime;
  appState.sleepData.waketime = waketime;
  appState.sleepData.quality = quality;
  triggerHaptic('success');
  saveState();
  closeModal();
}

function openBodyMeasurementModal() {
  document.getElementById('modal-title').textContent = '🪞 Замер теля и веса';
  document.getElementById('modal-body').innerHTML = `
    <input type="number" id="input-b-weight" class="modal-input" placeholder="Вес (кг)" value="${appState.userProfile.weight || 75}" step="0.1" />
    <input type="number" id="input-b-waist" class="modal-input" placeholder="Талия (см)" value="${appState.userProfile.waist || 82}" />
    <input type="number" id="input-b-chest" class="modal-input" placeholder="Грудь (см)" value="${appState.userProfile.chest || 100}" />
    <input type="number" id="input-b-biceps" class="modal-input" placeholder="Бицепс (см)" value="${appState.userProfile.biceps || 36}" />
    <button class="btn-primary-sm" style="margin-top: 10px; width: 100%" onclick="saveBodyMeasurementsFromModal()">Сохранить замеры</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveBodyMeasurementsFromModal() {
  const weight = Number(document.getElementById('input-b-weight').value) || 75;
  const waist = Number(document.getElementById('input-b-waist').value) || 82;
  const chest = Number(document.getElementById('input-b-chest').value) || 100;
  const biceps = Number(document.getElementById('input-b-biceps').value) || 36;

  appState.userProfile.weight = weight;
  appState.userProfile.waist = waist;
  appState.userProfile.chest = chest;
  appState.userProfile.biceps = biceps;

  triggerHaptic('success');
  saveState();
  closeModal();
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

function openAddWorkoutModal() {
  document.getElementById('modal-title').textContent = '🏋️‍♂️ Новая Тренировка';
  document.getElementById('modal-body').innerHTML = `
    <input type="text" id="workout-type-input" class="modal-input" placeholder="Тип тренировки (напр., Силовая / Кардио)" />
    <textarea id="workout-details-input" class="modal-input" rows="3" placeholder="Детали (упражнения, подходы, вес)"></textarea>
    <button class="btn-primary-sm" style="margin-top: 10px; width: 100%" onclick="saveWorkoutFromModal()">Сохранить тренировку</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveWorkoutFromModal() {
  const type = document.getElementById('workout-type-input').value.trim() || 'Тренировка';
  const details = document.getElementById('workout-details-input').value.trim() || 'Выполнено';
  const date = new Date().toLocaleDateString('ru-RU');

  appState.workouts.unshift({ id: Date.now(), type, details, date });
  triggerHaptic('success');
  saveState();
  closeModal();
}

function openAddBookModal() {
  document.getElementById('modal-title').textContent = '📚 Добавить Книгу';
  document.getElementById('modal-body').innerHTML = `
    <input type="text" id="book-title-input" class="modal-input" placeholder="Название книги" />
    <input type="text" id="book-author-input" class="modal-input" placeholder="Автор" />
    <input type="number" id="book-pages-input" class="modal-input" placeholder="Количество страниц" />
    <button class="btn-primary-sm" style="margin-top: 10px; width: 100%" onclick="saveBookFromModal()">Сохранить книгу</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveBookFromModal() {
  const title = document.getElementById('book-title-input').value.trim();
  const author = document.getElementById('book-author-input').value.trim() || 'Не указан';
  const pages = Number(document.getElementById('book-pages-input').value) || 0;

  if (title) {
    appState.books.unshift({ id: Date.now(), title, author, pages });
    triggerHaptic('success');
    saveState();
    closeModal();
  }
}

function closeModal() {
  const modal = document.getElementById('app-modal');
  if (modal) modal.classList.remove('active');
}

function closeTodaySummaryModal() {
  document.getElementById('modal-title').textContent = '🎉 Закрытие дня PROTOCOL';
  document.getElementById('modal-body').innerHTML = `
    <div style="text-align: center; padding: 10px;">
      <div style="font-size: 32px; margin-bottom: 8px;">🔥</div>
      <div style="font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 6px;">День официально закрыт!</div>
      <div style="font-size: 13px; color: var(--text-muted);">Ваш стрик увеличен! Отличная дисциплина и работа над собой.</div>
    </div>
    <button class="btn-primary-sm" style="margin-top: 12px; width: 100%" onclick="finishCloseDay()">Подтвердить закрытие дня</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function finishCloseDay() {
  appState.streak += 1;
  triggerHaptic('success');
  saveState();
  closeModal();
}

function resetAllAppData() {
  if (confirm('Сбросить все данные Protocol?')) {
    localStorage.removeItem('PROTOCOL_APP_DATA_V3');
    appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState();
    triggerHaptic('success');
  }
}
