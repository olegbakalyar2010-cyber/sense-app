/* PROTOCOL Life OS — Client Logic & Health System */

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

// Initial State (Matching Protocol Defaults)
const DEFAULT_STATE = {
  userProfile: {
    name: 'Пользователь',
    weight: 75,
    height: 178,
    caloriesGoal: 2661,
    waterGoal: 2.9,
    p: 160,
    f: 75,
    c: 320,
    fib: 30
  },
  waterCurrent: 0.0,
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
  habits: [
    { id: 1, icon: '💧', title: 'Питьевой режим (Вода)', completed: false, streak: 6 },
    { id: 2, icon: '🏃‍♂️', title: 'Тренировка / Физ. активность', completed: false, streak: 4 },
    { id: 3, icon: '🧴', title: 'Уход за собой (Self-Care)', completed: false, streak: 3 },
    { id: 4, icon: '📖', title: 'Чтение книги (20+ мин)', completed: false, streak: 5 },
    { id: 5, icon: '🤲', title: 'Духовный ритуал / Молитва', completed: false, streak: 7 }
  ]
};

let appState = JSON.parse(localStorage.getItem('PROTOCOL_APP_DATA')) || DEFAULT_STATE;

function saveState() {
  localStorage.setItem('PROTOCOL_APP_DATA', JSON.stringify(appState));
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

// 1. PROTOCOL HOMEPAGE DASHBOARD
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
  if (sleepBadge && appState.sleepData) {
    sleepBadge.textContent = appState.sleepData.bedtime || '23:00';
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

  // Water summary text
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

function toggleWaterAccordion() {
  const body = document.getElementById('water-accordion-body');
  if (body) {
    const isOpen = body.style.display === 'block';
    body.style.display = isOpen ? 'none' : 'block';
  }
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

// 4. PERSONAL (WORKOUTS, BOOKS, BODY)
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
}

// MODALS
function openAddNoteModal() {
  document.getElementById('modal-title').textContent = 'Новая Заметка';
  document.getElementById('modal-body').innerHTML = `
    <textarea id="input-note-text" class="modal-input" rows="4" placeholder="Запишите вашу заметку..."></textarea>
    <button class="btn-primary-sm" style="margin-top: 10px; width: 100%" onclick="saveNoteFromModal()">Сохранить</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveNoteFromModal() {
  const text = document.getElementById('input-note-text').value.trim();
  if (text) {
    appState.notes.unshift({ id: Date.now(), text, date: new Date().toLocaleDateString('ru-RU') });
    triggerHaptic('success');
    saveState();
    closeModal();
  }
}

function openAddIdeaModal() {
  document.getElementById('modal-title').textContent = '💡 Новая Идея';
  document.getElementById('modal-body').innerHTML = `
    <textarea id="input-idea-text" class="modal-input" rows="4" placeholder="Запишите инсайт или идею..."></textarea>
    <button class="btn-primary-sm" style="margin-top: 10px; width: 100%" onclick="saveIdeaFromModal()">Сохранить идею</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveIdeaFromModal() {
  const text = document.getElementById('input-idea-text').value.trim();
  if (text) {
    appState.ideas.unshift({ id: Date.now(), text, date: new Date().toLocaleDateString('ru-RU') });
    triggerHaptic('success');
    saveState();
    closeModal();
  }
}

function openSleepModal() {
  document.getElementById('modal-title').textContent = '🌙 Записать Сон';
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
    <button class="btn-primary-sm" style="margin-top: 10px; width: 100%" onclick="saveSleepFromModal()">Сохранить сон</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveSleepFromModal() {
  const bedtime = document.getElementById('input-sleep-bed').value;
  const waketime = document.getElementById('input-sleep-wake').value;
  appState.sleepData.bedtime = bedtime;
  appState.sleepData.waketime = waketime;
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

function closeTodaySummary() {
  alert('🎉 День успешно закрыт! Отличная дисциплина!');
  triggerHaptic('success');
}

function resetAllAppData() {
  if (confirm('Сбросить все данные Protocol?')) {
    localStorage.removeItem('PROTOCOL_APP_DATA');
    appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState();
    triggerHaptic('success');
  }
}
