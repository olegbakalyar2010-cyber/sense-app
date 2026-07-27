/* SENSE 2.0 Telegram Mini App — Client Logic & Health Calculator */

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

// Default Initial State
const DEFAULT_STATE = {
  onboarded: false,
  userProfile: {
    name: '',
    gender: 'male',
    age: 25,
    height: 178,
    weight: 75,
    goal: 'loss', // 'loss', 'maintain', 'gain'
    activity: 1.2
  },
  calculatedTargets: {
    calories: 2100,
    waterGoal: 2.6,
    p: 150,
    f: 75,
    c: 200,
    fib: 30
  },
  waterCurrent: 0.0,
  streak: 1,
  meals: {
    'Завтрак': [],
    'Обед': [],
    'Ужин': []
  },
  journal: [
    { id: 1, tag: '💡 Идея', content: 'Дисциплина — это выбор между тем, чего ты хочешь прямо сейчас, и тем, чего ты хочешь больше всего.', date: '28 Июля', mood: '⚡' }
  ],
  habits: [
    { id: 1, title: 'Утренняя разминка (10 мин)', completed: false, streak: 4 },
    { id: 2, title: 'Выпить норму воды', completed: false, streak: 6 },
    { id: 3, title: 'Записать мысль в дневник SENSE', completed: false, streak: 2 }
  ]
};

let appState = JSON.parse(localStorage.getItem('SENSE_APP_DATA_V2')) || DEFAULT_STATE;

function saveState() {
  localStorage.setItem('SENSE_APP_DATA_V2', JSON.stringify(appState));
  renderAll();
}

document.addEventListener('DOMContentLoaded', () => {
  initTelegramUser();
  setupNavigation();

  if (!appState.onboarded) {
    document.getElementById('onboarding-modal').style.display = 'flex';
  } else {
    document.getElementById('onboarding-modal').style.display = 'none';
  }

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

// 🧮 Health Target Calculator
function calculateHealthTargets(profile) {
  const { gender, age, height, weight, goal, activity } = profile;

  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  let tdee = bmr * activity;
  let calories = Math.round(tdee);
  let p = Math.round(weight * 2.0);
  let f = Math.round(weight * 0.9);

  if (goal === 'loss') {
    calories = Math.round(tdee * 0.85); // 15% Deficit
  } else if (goal === 'gain') {
    calories = Math.round(tdee * 1.15); // 15% Surplus for Muscle Mass
    p = Math.round(weight * 2.2);       // High protein for hypertrophy
    f = Math.round(weight * 1.0);
  }

  const remainingCalories = calories - (p * 4) - (f * 9);
  const c = Math.max(50, Math.round(remainingCalories / 4));

  const waterGoal = Number((weight * 0.035).toFixed(1));

  return { calories, waterGoal, p, f, c, fib: 30 };
}

let tempProfile = { ...DEFAULT_STATE.userProfile };

function selectGender(gender) {
  tempProfile.gender = gender;
  document.getElementById('gender-male').classList.toggle('selected', gender === 'male');
  document.getElementById('gender-female').classList.toggle('selected', gender === 'female');
  triggerHaptic('light');
}

function selectGoal(goal) {
  tempProfile.goal = goal;
  const btnLoss = document.getElementById('goal-weightloss');
  const btnMaintain = document.getElementById('goal-maintain');
  const btnGain = document.getElementById('goal-gain');

  if (btnLoss) btnLoss.classList.toggle('selected', goal === 'loss');
  if (btnMaintain) btnMaintain.classList.toggle('selected', goal === 'maintain');
  if (btnGain) btnGain.classList.toggle('selected', goal === 'gain');

  triggerHaptic('light');
}

function selectActivity(activity) {
  tempProfile.activity = activity;
  document.getElementById('act-low').classList.toggle('selected', activity === 1.2);
  document.getElementById('act-mid').classList.toggle('selected', activity === 1.45);
  triggerHaptic('light');
}

function nextOnboardingStep(step) {
  if (step === 2) {
    const nameInput = document.getElementById('onboard-name').value.trim();
    if (nameInput) tempProfile.name = nameInput;
  }

  document.querySelectorAll('.onboarding-step').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(`onboard-step-${step}`);
  if (target) target.classList.add('active');
  triggerHaptic('light');
}

function finishOnboarding() {
  tempProfile.age = Number(document.getElementById('onboard-age').value) || 25;
  tempProfile.height = Number(document.getElementById('onboard-height').value) || 178;
  tempProfile.weight = Number(document.getElementById('onboard-weight').value) || 75;

  appState.userProfile = tempProfile;
  appState.calculatedTargets = calculateHealthTargets(tempProfile);
  appState.onboarded = true;

  document.getElementById('onboarding-modal').style.display = 'none';
  triggerHaptic('success');
  saveState();
}

function openOnboardingAgain() {
  document.getElementById('onboarding-modal').style.display = 'flex';
  document.querySelectorAll('.onboarding-step').forEach(el => el.classList.remove('active'));
  document.getElementById('onboard-step-1').classList.add('active');
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
  renderWaterVessel();
  renderJournal();
  renderHabits();
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

function renderTodaySummary() {
  const targets = appState.calculatedTargets;
  const loggedCal = getLoggedCalories();

  const kbjuPercent = Math.min(100, Math.round((loggedCal / targets.calories) * 100));
  const waterPercent = Math.min(100, Math.round((appState.waterCurrent / targets.waterGoal) * 100));

  const totalHabits = appState.habits.length;
  const completedHabits = appState.habits.filter(h => h.completed).length;
  const habitsPercent = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  const overall = Math.round((habitsPercent + kbjuPercent + waterPercent) / 3);

  document.getElementById('val-tasks-percent').textContent = `${habitsPercent}%`;
  document.getElementById('val-kbju-percent').textContent = `${kbjuPercent}%`;
  document.getElementById('val-water-percent').textContent = `${waterPercent}%`;
  document.getElementById('val-journal-count').textContent = appState.journal.length;
  document.getElementById('overall-percentage').textContent = `${overall}%`;

  const ringBar = document.getElementById('overall-ring-bar');
  if (ringBar) {
    ringBar.style.strokeDashoffset = 264 - (264 * overall) / 100;
  }
}

function renderWaterVessel() {
  const goal = appState.calculatedTargets.waterGoal || 2.6;
  const current = appState.waterCurrent || 0;
  const pct = Math.min(100, Math.round((current / goal) * 100));

  const waveBar = document.getElementById('liquid-wave-bar');
  const currentText = document.getElementById('liquid-current-text');
  const goalText = document.getElementById('liquid-goal-text');

  if (waveBar) waveBar.style.height = `${pct}%`;
  if (currentText) currentText.textContent = `${current.toFixed(1)} л`;
  if (goalText) goalText.textContent = `из ${goal.toFixed(1)} л (${pct}%)`;
}

function addWater(amount) {
  appState.waterCurrent += amount;
  triggerHaptic('medium');
  saveState();
}

function resetNutritionToday() {
  appState.meals = { 'Завтрак': [], 'Обед': [], 'Ужин': [] };
  appState.waterCurrent = 0.0;
  triggerHaptic('success');
  saveState();
}

function renderNutrition() {
  const targets = appState.calculatedTargets;
  const loggedCal = getLoggedCalories();

  document.getElementById('calories-logged-val').textContent = loggedCal;
  document.getElementById('calories-goal-val').textContent = `из ${targets.calories}`;

  const calBar = document.getElementById('calorie-ring-bar');
  if (calBar) {
    const pct = Math.min(100, (loggedCal / targets.calories) * 100);
    calBar.style.strokeDashoffset = 251.2 - (251.2 * pct) / 100;
  }

  const userGoalText = document.getElementById('user-goal-display-text');
  if (userGoalText) {
    let goalLabel = '🔥 Похудение';
    if (appState.userProfile.goal === 'maintain') goalLabel = '⚖️ Баланс';
    if (appState.userProfile.goal === 'gain') goalLabel = '🏋️‍♂️ Набор массы';
    userGoalText.textContent = `Цель: ${goalLabel} (${appState.userProfile.weight} кг)`;
  }

  const macros = getLoggedMacros();
  const updateMacro = (type, val, goal) => {
    const pct = Math.min(100, Math.round((val / goal) * 100));
    document.getElementById(`macro-${type}-percent`).textContent = `${pct}%`;
    document.getElementById(`macro-${type}-gram`).textContent = `${val}г`;
    document.getElementById(`macro-${type}-bar`).style.width = `${pct}%`;
  };

  updateMacro('p', macros.p, targets.p);
  updateMacro('f', macros.f, targets.f);
  updateMacro('c', macros.c, targets.c);
  updateMacro('fib', macros.fib, targets.fib);

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
}

function renderJournal() {
  const container = document.getElementById('journal-feed-container');
  if (!container) return;

  if (appState.journal.length === 0) {
    container.innerHTML = `<div class="empty-box">Дневник мыслей пуст. Нажмите "+ Написать инсайт".</div>`;
    return;
  }

  container.innerHTML = appState.journal.map(entry => `
    <div class="journal-card">
      <div class="journal-meta">
        <span class="journal-tag">${entry.tag} ${entry.mood || ''}</span>
        <span class="journal-date">${entry.date}</span>
      </div>
      <div class="journal-content">${entry.content}</div>
    </div>
  `).join('');
}

function openAddJournalModal() {
  document.getElementById('modal-title').textContent = 'Новый Инсайт / Заметка';
  document.getElementById('modal-body').innerHTML = `
    <select id="journal-input-tag" class="modal-input">
      <option value="💡 Идея">💡 Идея / Озарение</option>
      <option value="📚 Обучение">📚 Чему сегодня научился</option>
      <option value="🧠 Заметка">🧠 Мысль дня</option>
      <option value="🎯 Урок">🎯 Важный вывод</option>
    </select>
    <textarea id="journal-input-content" class="modal-input" rows="4" placeholder="Запишите вашу мысль или изученный материал..."></textarea>
    <button class="btn-primary-sm" style="margin-top: 10px; width: 100%" onclick="saveJournalFromModal()">Сохранить в дневник</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveJournalFromModal() {
  const tag = document.getElementById('journal-input-tag').value;
  const content = document.getElementById('journal-input-content').value.trim();
  const date = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  if (content) {
    appState.journal.unshift({ id: Date.now(), tag, content, date, mood: '✨' });
    triggerHaptic('success');
    saveState();
    closeModal();
  }
}

function renderHabits() {
  const container = document.getElementById('habits-list-container');
  if (!container) return;

  if (appState.habits.length === 0) {
    container.innerHTML = `<div class="empty-box">Нет привычек. Нажмите "+ Новая привычка".</div>`;
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

function openAddHabitModal() {
  document.getElementById('modal-title').textContent = 'Новая привычка';
  document.getElementById('modal-body').innerHTML = `
    <input type="text" id="habit-input-title" class="modal-input" placeholder="Название (напр., Чтение 20 мин)" />
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

function openAddFoodModal(mealName) {
  document.getElementById('modal-title').textContent = `Добавить в ${mealName}`;
  document.getElementById('modal-body').innerHTML = `
    <input type="text" id="food-input-name" class="modal-input" placeholder="Название блюда (напр., Курица с рисом)" />
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

function closeModal() {
  const modal = document.getElementById('app-modal');
  if (modal) modal.classList.remove('active');
}

function resetAllAppData() {
  if (confirm('Сбросить все сохраненные данные SENSE 2.0?')) {
    localStorage.removeItem('SENSE_APP_DATA_V2');
    appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState();
    triggerHaptic('success');
  }
}
