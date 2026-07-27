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
    goal: 'loss',
    activity: 1.2
  },
  calculatedTargets: {
    calories: 2255,
    waterGoal: 2.6,
    p: 150,
    f: 67,
    c: 230,
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
    'Ужин': []
  },
  // 7-day Historical Data Arrays for Charts
  historyData: {
    days: ['Ср', 'Чт', 'Пт', 'Сб', 'Вс', 'Пн', 'Сг'],
    weight: [76.5, 76.2, 75.8, 75.5, 75.3, 75.1, 75.0],
    water: [1.8, 2.1, 2.5, 2.6, 2.2, 2.6, 1.5],
    sleep: [6.5, 7.0, 7.5, 8.0, 6.8, 7.5, 7.5]
  },
  journal: [
    { id: 1, tag: '💡 Идея', content: 'Дисциплина — это выбор между тем, чего ты хочешь прямо сейчас, и тем, чего ты хочешь больше всего.', date: '28 Июля', mood: '⚡' }
  ],
  habits: [
    { id: 1, icon: '💧', title: 'Питьевой режим (Норма воды)', completed: false, streak: 6 },
    { id: 2, icon: '🏃‍♂️', title: 'Спорт / Физ. активность (30+ мин)', completed: false, streak: 4 },
    { id: 3, icon: '🧴', title: 'Уход за собой и кожей (Self-Care)', completed: false, streak: 3 },
    { id: 4, icon: '📖', title: 'Чтение полезной книги (20+ мин)', completed: false, streak: 5 },
    { id: 5, icon: '🤲', title: 'Чтение молитв / Духовный ритуал', completed: false, streak: 7 }
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

// Health Target Calculator
function calculateHealthTargets(profile) {
  const { gender, age, height, weight, goal, activity } = profile;

  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  if (gender === 'male') bmr += 5;
  else bmr -= 161;

  let tdee = bmr * activity;
  let calories = Math.round(tdee);
  let p = Math.round(weight * 2.0);
  let f = Math.round(weight * 0.9);

  if (goal === 'loss') {
    calories = Math.round(tdee * 0.85); // 15% Deficit
  } else if (goal === 'gain') {
    calories = Math.round(tdee * 1.15); // 15% Surplus
    p = Math.round(weight * 2.2);
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
  renderSleepTracker();
  renderJournal();
  renderHabits();
  renderCharts();
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

// TODAY DASHBOARD SUMMARY
function renderTodaySummary() {
  const targets = appState.calculatedTargets || { calories: 2255, waterGoal: 2.6 };
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

  const homeGoalText = document.getElementById('home-user-goal-text');
  if (homeGoalText) {
    let goalLabel = '🔥 Похудение';
    if (appState.userProfile.goal === 'maintain') goalLabel = '⚖️ Баланс';
    if (appState.userProfile.goal === 'gain') goalLabel = '🏋️‍♂️ Набор массы';
    homeGoalText.textContent = `Цель: ${goalLabel} (${appState.userProfile.weight}кг • ${targets.calories} ккал/день)`;
  }
}

// DYNAMIC CHARTS RENDERER (WEIGHT, WATER, SLEEP)
function renderCharts() {
  if (!appState.historyData) {
    appState.historyData = {
      days: ['Ср', 'Чт', 'Пт', 'Сб', 'Вс', 'Пн', 'Сг'],
      weight: [76.5, 76.2, 75.8, 75.5, 75.3, 75.1, 75.0],
      water: [1.8, 2.1, 2.5, 2.6, 2.2, 2.6, 1.5],
      sleep: [6.5, 7.0, 7.5, 8.0, 6.8, 7.5, 7.5]
    };
  }

  // Sync today's current values into the last index
  appState.historyData.weight[6] = appState.userProfile.weight;
  appState.historyData.water[6] = Number(appState.waterCurrent.toFixed(1));
  if (appState.sleepData) {
    appState.historyData.sleep[6] = calculateSleepHours(appState.sleepData.bedtime, appState.sleepData.waketime);
  }

  const { days, weight, water, sleep } = appState.historyData;

  // Render Weight Chart
  const weightContainer = document.getElementById('weight-chart-bars');
  if (weightContainer) {
    const maxW = Math.max(...weight, 80);
    const minW = Math.min(...weight, 60);
    weightContainer.innerHTML = days.map((day, i) => {
      const val = weight[i];
      const heightPct = Math.max(20, Math.round(((val - minW + 5) / (maxW - minW + 10)) * 100));
      return `
        <div class="bar-col emerald">
          <div class="bar-val-text">${val}</div>
          <div class="bar-pill-fill" style="height: ${heightPct}%;"></div>
          <div class="bar-label-day">${day}</div>
        </div>
      `;
    }).join('');
  }

  // Render Water Chart
  const waterContainer = document.getElementById('water-chart-bars');
  if (waterContainer) {
    const goalW = appState.calculatedTargets.waterGoal || 2.6;
    waterContainer.innerHTML = days.map((day, i) => {
      const val = water[i];
      const heightPct = Math.min(100, Math.max(15, Math.round((val / goalW) * 100)));
      return `
        <div class="bar-col">
          <div class="bar-val-text">${val}L</div>
          <div class="bar-pill-fill" style="height: ${heightPct}%;"></div>
          <div class="bar-label-day">${day}</div>
        </div>
      `;
    }).join('');
  }

  // Render Sleep Chart
  const sleepContainer = document.getElementById('sleep-chart-bars');
  if (sleepContainer) {
    sleepContainer.innerHTML = days.map((day, i) => {
      const val = sleep[i];
      const heightPct = Math.min(100, Math.max(15, Math.round((val / 10) * 100)));
      return `
        <div class="bar-col purple">
          <div class="bar-val-text">${val}ч</div>
          <div class="bar-pill-fill" style="height: ${heightPct}%;"></div>
          <div class="bar-label-day">${day}</div>
        </div>
      `;
    }).join('');
  }
}

function logNewWeightModal() {
  document.getElementById('modal-title').textContent = 'Записать замер веса';
  document.getElementById('modal-body').innerHTML = `
    <input type="number" id="input-new-weight-val" class="modal-input" placeholder="${appState.userProfile.weight}" step="0.1" />
    <button class="btn-primary-sm" style="margin-top: 10px; width: 100%" onclick="saveNewWeightFromModal()">Сохранить замер</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function saveNewWeightFromModal() {
  const newW = Number(document.getElementById('input-new-weight-val').value);
  if (newW > 30) {
    appState.userProfile.weight = newW;
    appState.calculatedTargets = calculateHealthTargets(appState.userProfile);
    triggerHaptic('success');
    saveState();
    closeModal();
  }
}

// SLEEP TRACKER
function calculateSleepHours(bedtime, waketime) {
  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = waketime.split(':').map(Number);

  let bDate = new Date(2000, 0, 1, bH, bM);
  let wDate = new Date(2000, 0, 1, wH, wM);

  if (wDate <= bDate) {
    wDate.setDate(wDate.getDate() + 1);
  }

  const diffMs = wDate - bDate;
  return Number((diffMs / (1000 * 60 * 60)).toFixed(1));
}

function renderSleepTracker() {
  if (!appState.sleepData) {
    appState.sleepData = { bedtime: '23:00', waketime: '06:30', quality: 8 };
  }

  const { bedtime, waketime, quality } = appState.sleepData;

  const bedtimeInput = document.getElementById('sleep-bedtime');
  const waketimeInput = document.getElementById('sleep-waketime');
  if (bedtimeInput) bedtimeInput.value = bedtime;
  if (waketimeInput) waketimeInput.value = waketime;

  const hours = calculateSleepHours(bedtime, waketime);
  const badge = document.getElementById('sleep-duration-badge');
  if (badge) badge.textContent = `${hours} ч`;

  const ratingVal = document.getElementById('quality-rating-val');
  if (ratingVal) ratingVal.textContent = `${quality}/10`;

  document.querySelectorAll('.rating-chip').forEach(chip => {
    chip.classList.toggle('selected', Number(chip.textContent) === quality);
  });

  const adviceText = document.getElementById('sleep-advice-text');
  if (adviceText) {
    let advice = 'Идеальная норма сна! Старайтесь проветривать спальню перед сном и засыпать в полной темноте.';
    if (hours < 7) {
      advice = '⚠️ Недостаток сна (меньше 7 часов). Восстановление организма замедленно. Попробуйте сегодня лечь на 45 минут раньше и не пить кофеин после 16:00.';
    } else if (quality <= 5) {
      advice = '⚠️ Низкое качество сна. Отключите экраны смартфонов за 1 час до сна и попробуйте прохладный душ или короткую медитацию.';
    } else if (quality >= 9 && hours >= 7.5) {
      advice = '🌟 Превосходный глубокий сон! Ваш организм полностью восстановился и готов к высокой физической и умственной активности.';
    }
    adviceText.textContent = advice;
  }
}

function updateSleepAnalysis() {
  const bedtime = document.getElementById('sleep-bedtime').value;
  const waketime = document.getElementById('sleep-waketime').value;
  appState.sleepData.bedtime = bedtime;
  appState.sleepData.waketime = waketime;
  triggerHaptic('light');
  saveState();
}

function selectSleepRating(rating) {
  if (!appState.sleepData) appState.sleepData = {};
  appState.sleepData.quality = rating;
  triggerHaptic('medium');
  saveState();
}

// WATER VESSEL
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

// NUTRITION SCREEN
function renderNutrition() {
  const targets = appState.calculatedTargets || { calories: 2255, p: 150, f: 67, c: 230, fib: 30 };
  const loggedCal = getLoggedCalories();

  document.getElementById('calories-logged-val').textContent = loggedCal;
  document.getElementById('calories-goal-val').textContent = `из ${targets.calories} ккал`;

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
    userGoalText.textContent = `Цель: ${goalLabel} (${appState.userProfile.weight} кг • ${targets.calories} ккал/день)`;
  }

  const macros = getLoggedMacros();
  const updateMacro = (type, val, targetVal) => {
    const pct = Math.min(100, Math.round((val / targetVal) * 100));
    document.getElementById(`macro-${type}-percent`).textContent = `${pct}%`;
    document.getElementById(`macro-${type}-gram`).textContent = `${val} / ${targetVal}г`;
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

// JOURNAL
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

// HABITS & RITUALS
function renderHabits() {
  const html = appState.habits.length === 0 
    ? `<div class="empty-box">Нет ритуалов. Нажмите "+ Свой ритуал".</div>`
    : appState.habits.map(habit => `
      <div class="habit-card-item ${habit.completed ? 'completed' : ''}" onclick="toggleHabit(${habit.id})">
        <div class="habit-left">
          <span class="habit-icon-emoji">${habit.icon || '✨'}</span>
          <div class="habit-checkbox">${habit.completed ? '✓' : ''}</div>
          <div class="habit-title">${habit.title}</div>
        </div>
        <div class="habit-streak-badge">⚡ ${habit.streak}дн</div>
      </div>
    `).join('');

  const containerPath = document.getElementById('habits-list-container');
  const containerToday = document.getElementById('today-habits-checklist-container');

  if (containerPath) containerPath.innerHTML = html;
  if (containerToday) containerToday.innerHTML = html;
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
  document.getElementById('modal-title').textContent = 'Новый ритуал';
  document.getElementById('modal-body').innerHTML = `
    <input type="text" id="habit-input-title" class="modal-input" placeholder="Название ритуала (напр., Чтение молитвы / Скинкеэр)" />
    <button class="btn-primary-sm" style="margin-top: 10px; width: 100%" onclick="saveHabitFromModal()">Создать</button>
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
