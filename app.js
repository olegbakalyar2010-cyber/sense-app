/* HAMSTER KOMBAT — Full Client Game Engine (Summer 2024 Edition) */

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

// Leagues Thresholds
const LEAGUES = [
  { name: 'Bronze 🥉', min: 0 },
  { name: 'Silver 🥈', min: 5000 },
  { name: 'Gold 🥇', min: 25000 },
  { name: 'Platinum 💎', min: 100000 },
  { name: 'Diamond 💍', min: 1000000 },
  { name: 'Epic ⚡', min: 2000000 },
  { name: 'Legendary 👑', min: 10000000 },
  { name: 'Master 🔮', min: 50000000 },
  { name: 'Grandmaster 🏆', min: 100000000 },
  { name: 'Lord 👑✨', min: 500000000 },
  { name: 'Creator 🌟', min: 1000000000 }
];

// Mining Cards Database
const MINE_CARDS = [
  // Markets
  { id: 'margin_100', category: 'markets', icon: '📈', title: 'Margin trading x100', profit: 1200, cost: 3000, lvl: 1 },
  { id: 'derivatives', category: 'markets', icon: '📊', title: 'Derivatives', profit: 800, cost: 2000, lvl: 1 },
  { id: 'fan_tokens', category: 'markets', icon: '🪙', title: 'Fan tokens', profit: 500, cost: 1200, lvl: 1 },
  { id: 'meme_coins', category: 'markets', icon: '🐸', title: 'Meme coins', profit: 1500, cost: 4500, lvl: 0 },
  // PR & Team
  { id: 'ceo_hamster', category: 'pr', icon: '👔', title: 'CEO Hamster', profit: 2500, cost: 8000, lvl: 1 },
  { id: 'marketing', category: 'pr', icon: '📢', title: 'Marketing Team', profit: 900, cost: 2500, lvl: 1 },
  { id: 'it_team', category: 'pr', icon: '💻', title: 'IT Infrastructure', profit: 1100, cost: 3200, lvl: 0 },
  // Legal
  { id: 'license_europe', category: 'legal', icon: '🇪🇺', title: 'License Europe', profit: 2000, cost: 6000, lvl: 0 },
  { id: 'license_uae', category: 'legal', icon: '🇦🇪', title: 'License UAE', profit: 3500, cost: 10000, lvl: 0 },
  { id: 'license_japan', category: 'legal', icon: '🇯🇵', title: 'License Japan', profit: 4000, cost: 12000, lvl: 0 },
  // Web3
  { id: 'dex_router', category: 'web3', icon: '🔄', title: 'DEX Router', profit: 1800, cost: 5000, lvl: 0 },
  { id: 'oracle_network', category: 'web3', icon: '🔮', title: 'Oracle Network', profit: 2200, cost: 7000, lvl: 0 },
  // Specials
  { id: 'durov_interview', category: 'specials', icon: '✈️', title: 'Дуров в Карлсоне', profit: 8000, cost: 25000, lvl: 0 },
  { id: 'btc_pizza', category: 'specials', icon: '🍕', title: 'Bitcoin Pizza Day', profit: 5000, cost: 15000, lvl: 0 }
];

// Initial Game State
const DEFAULT_STATE = {
  balance: 1234567,
  profitPerHour: 1250,
  earnPerTap: 1,
  energy: 1500,
  maxEnergy: 1500,
  fullEnergyUses: 6,
  multitapLvl: 1,
  energyLimitLvl: 1,
  keys: 0,
  selectedExchange: 'Binance',
  exchangeLogo: '🟡',
  lastOnlineTimestamp: Date.now(),
  cards: MINE_CARDS,
  comboSolved: false,
  comboCards: ['margin_100', 'ceo_hamster', 'durov_interview'],
  foundCombo: [],
  tasksDone: {},
  walletConnected: false,
  walletAddress: null
};

let gameState = JSON.parse(localStorage.getItem('HAMSTER_KOMBAT_STATE_V1')) || DEFAULT_STATE;

// Daily Morse Code Cipher Word (e.g., "BTC")
const DAILY_CIPHER = {
  word: 'BTC',
  morse: ['-', '.', '.', '.', '-', '.', '-.-.'] // B T C
};
let morseActive = false;
let morseInput = '';
let tapStatClickCount = 0;
let tapStatTimer = null;
let tapPressStartTime = 0;

document.addEventListener('DOMContentLoaded', () => {
  initGame();
  setupTapperEvents();
  startTimers();
});

function initGame() {
  // Offline Passive Income Calculation (Up to 3 hours)
  const now = Date.now();
  const diffMs = now - (gameState.lastOnlineTimestamp || now);
  const diffHours = Math.min(3, diffMs / (1000 * 60 * 60));

  if (diffHours > 0.05 && gameState.profitPerHour > 0) {
    const offlineEarned = Math.round((gameState.profitPerHour / 3600) * (diffHours * 3600));
    gameState.balance += offlineEarned;
    alert(`🎉 Пока тебя не было, твоя биржа заработала +${offlineEarned.toLocaleString()} 🪙 (за ${diffHours.toFixed(1)} ч)!`);
  }
  gameState.lastOnlineTimestamp = now;

  renderAll();
}

function saveGameState() {
  gameState.lastOnlineTimestamp = Date.now();
  localStorage.setItem('HAMSTER_KOMBAT_STATE_V1', JSON.stringify(gameState));
  renderAll();
}

function startTimers() {
  // Passive income & Energy recharge timer every second
  setInterval(() => {
    // Energy Recharge (+3 per second)
    if (gameState.energy < gameState.maxEnergy) {
      gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + 3);
      updateEnergyDisplay();
    }

    // Passive Profit (+profit/3600 per second)
    if (gameState.profitPerHour > 0) {
      const perSec = gameState.profitPerHour / 3600;
      gameState.balance += perSec;
      updateBalanceDisplay();
    }
  }, 1000);
}

function renderAll() {
  updateBalanceDisplay();
  updateEnergyDisplay();
  updateLeagueDisplay();

  document.getElementById('stat-earn-per-tap').textContent = `+${gameState.earnPerTap}`;
  document.getElementById('stat-profit-per-hour').textContent = `+${formatNum(gameState.profitPerHour)} 🪙`;
  document.getElementById('selected-exchange-name').textContent = gameState.selectedExchange || 'Binance';
  document.getElementById('selected-exchange-logo').textContent = gameState.exchangeLogo || '🏦';

  renderMineCards();
}

function formatNum(num) {
  num = Math.round(num);
  if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function updateBalanceDisplay() {
  const el = document.getElementById('total-balance-num');
  if (el) el.textContent = Math.round(gameState.balance).toLocaleString();
}

function updateEnergyDisplay() {
  const el = document.getElementById('energy-counter-text');
  if (el) el.textContent = `${gameState.energy} / ${gameState.maxEnergy}`;
}

function updateLeagueDisplay() {
  const currentLeague = LEAGUES.slice().reverse().find(l => gameState.balance >= l.min) || LEAGUES[0];
  const leagueEl = document.getElementById('user-league-badge');
  if (leagueEl) leagueEl.textContent = `🏆 ${currentLeague.name} ›`;

  const nextLeague = LEAGUES.find(l => l.min > gameState.balance);
  const coinsLvlEl = document.getElementById('stat-coins-to-lvl');
  if (coinsLvlEl) {
    coinsLvlEl.textContent = nextLeague ? formatNum(nextLeague.min) : 'MAX';
  }
}

// TAPPER ENGINE WITH FLOATING NUMBERS
function setupTapperEvents() {
  const btn = document.getElementById('hamster-tapper-btn');
  if (!btn) return;

  const handleStart = (e) => {
    e.preventDefault();
    tapPressStartTime = Date.now();

    // Check Energy
    if (gameState.energy < gameState.earnPerTap) {
      triggerHaptic('medium');
      return;
    }

    // Deduct Energy & Add Coins
    gameState.energy = Math.max(0, gameState.energy - gameState.earnPerTap);
    gameState.balance += gameState.earnPerTap;
    triggerHaptic('light');

    updateBalanceDisplay();
    updateEnergyDisplay();

    // Create Floating Number Animation at click touch point
    const touch = e.touches ? e.touches[0] : e;
    createFloatingNumber(touch.clientX, touch.clientY, `+${gameState.earnPerTap}`);
  };

  const handleEnd = (e) => {
    const pressDuration = Date.now() - tapPressStartTime;

    // Handle Morse Cipher Input if Active
    if (morseActive) {
      const symbol = pressDuration > 220 ? '-' : '.';
      morseInput += symbol;
      document.getElementById('morse-display-code').textContent = morseInput;
      checkMorseCode();
    }
  };

  btn.addEventListener('touchstart', handleStart, { passive: false });
  btn.addEventListener('touchend', handleEnd);
  btn.addEventListener('mousedown', handleStart);
  btn.addEventListener('mouseup', handleEnd);
}

function createFloatingNumber(x, y, text) {
  const numEl = document.createElement('div');
  numEl.className = 'floating-tap-num';
  numEl.textContent = text;
  numEl.style.left = `${x - 15}px`;
  numEl.style.top = `${y - 40}px`;

  document.body.appendChild(numEl);

  setTimeout(() => {
    numEl.remove();
  }, 700);
}

// MORSE CIPHER TRIPLE CLICK TRIGGER
function handleTapStatClick() {
  tapStatClickCount++;
  clearTimeout(tapStatTimer);

  if (tapStatClickCount >= 3) {
    morseActive = !morseActive;
    tapStatClickCount = 0;
    const card = document.getElementById('morse-cipher-card');
    const tapperBtn = document.getElementById('hamster-tapper-btn');

    if (card) card.style.display = morseActive ? 'block' : 'none';
    if (tapperBtn) tapperBtn.classList.toggle('morse-active', morseActive);

    triggerHaptic('success');
    alert(morseActive ? '🔴 РЕЖИМ АЗБУКИ МОРЗЕ АКТИВИРОВАН! Короткий клик = (•), Долгий = (-)' : 'Шифр отключен');
  }

  tapStatTimer = setTimeout(() => { tapStatClickCount = 0; }, 600);
}

function checkMorseCode() {
  if (morseInput === '...---...') { // Secret demo code
    gameState.balance += 1000000;
    triggerHaptic('success');
    alert('🎉 СЕКРЕТНЫЙ ШИФР РАЗГАДАН! Получено +1,000,000 🪙!');
    morseInput = '';
    document.getElementById('morse-display-code').textContent = 'ВВЕДЕНО!';
    saveGameState();
  }
}

// TAB SWITCHING
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

  triggerHaptic('light');
}

// MINE TAB LOGIC
function switchMineCategory(catName, btnEl) {
  document.querySelectorAll('.category-pill-btn').forEach(btn => btn.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderMineCards(catName);
  triggerHaptic('light');
}

function renderMineCards(selectedCategory = 'markets') {
  const grid = document.getElementById('mine-cards-grid');
  if (!grid) return;

  const filtered = gameState.cards.filter(c => c.category === selectedCategory);

  grid.innerHTML = filtered.map(card => `
    <div class="mine-card" onclick="buyMineCard('${card.id}')">
      <div class="mine-card-top">
        <span class="mine-card-icon">${card.icon}</span>
        <div>
          <div class="mine-card-title">${card.title}</div>
          <div class="mine-card-profit">Прибыль в час</div>
          <div class="mine-card-profit-val">+${formatNum(card.profit)} 🪙</div>
        </div>
      </div>
      <div class="mine-card-bottom">
        <span class="mine-card-lvl">Ур. ${card.lvl}</span>
        <span class="mine-card-price">🪙 ${formatNum(card.cost)}</span>
      </div>
    </div>
  `).join('');
}

function buyMineCard(cardId) {
  const card = gameState.cards.find(c => c.id === cardId);
  if (!card) return;

  if (gameState.balance < card.cost) {
    triggerHaptic('medium');
    alert('❌ Недостаточно монет для покупка этой карточки!');
    return;
  }

  gameState.balance -= card.cost;
  gameState.profitPerHour += card.profit;
  card.lvl += 1;
  card.cost = Math.round(card.cost * 1.5);
  card.profit = Math.round(card.profit * 1.3);

  // Check Daily Combo
  if (!gameState.foundCombo.includes(card.id) && gameState.comboCards.includes(card.id)) {
    gameState.foundCombo.push(card.id);
    updateComboDisplay();
  }

  triggerHaptic('success');
  saveGameState();
}

function updateComboDisplay() {
  gameState.foundCombo.forEach((id, idx) => {
    const slot = document.getElementById(`combo-slot-${idx + 1}`);
    if (slot) {
      slot.classList.add('solved');
      slot.textContent = '✓';
    }
  });

  if (gameState.foundCombo.length >= 3 && !gameState.comboSolved) {
    gameState.comboSolved = true;
    gameState.balance += 5000000;
    alert('🎉 ЕЖЕДНЕВНОЕ КОМБО СТЕРТО! Получено +5,000,000 🪙!');
  }
}

// BOOSTS MODAL
function openBoostsModal() {
  document.getElementById('modal-title').textContent = '🚀 Улучшения & Бусты';
  document.getElementById('modal-body').innerHTML = `
    <div class="task-item-card" onclick="useFullEnergy()">
      <div class="task-left">
        <span class="task-icon">⚡</span>
        <div>
          <div class="task-title">Full Energy (Восстановить бак)</div>
          <div class="task-reward">Осталось ${gameState.fullEnergyUses}/6 сегодня</div>
        </div>
      </div>
      <button class="btn-claim-task">Бесплатно</button>
    </div>

    <div class="task-item-card" onclick="upgradeMultitap()">
      <div class="task-left">
        <span class="task-icon">👆</span>
        <div>
          <div class="task-title">Multitap (Сила тапа)</div>
          <div class="task-reward">+1 к клику • 🪙 2,000</div>
        </div>
      </div>
      <button class="btn-claim-task">Ур. ${gameState.multitapLvl}</button>
    </div>

    <div class="task-item-card" onclick="upgradeEnergyLimit()">
      <div class="task-left">
        <span class="task-icon">🔋</span>
        <div>
          <div class="task-title">Energy Limit (Емкость)</div>
          <div class="task-reward">+500 к энергии • 🪙 3,000</div>
        </div>
      </div>
      <button class="btn-claim-task">Ур. ${gameState.energyLimitLvl}</button>
    </div>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function useFullEnergy() {
  if (gameState.fullEnergyUses <= 0) {
    alert('Лимит бесплатных восстановлений исчерпан!');
    return;
  }

  gameState.energy = gameState.maxEnergy;
  gameState.fullEnergyUses -= 1;
  triggerHaptic('success');
  saveGameState();
  closeModal();
}

function upgradeMultitap() {
  if (gameState.balance < 2000) { alert('Недостаточно монет!'); return; }
  gameState.balance -= 2000;
  gameState.earnPerTap += 1;
  gameState.multitapLvl += 1;
  triggerHaptic('success');
  saveGameState();
  closeModal();
}

function upgradeEnergyLimit() {
  if (gameState.balance < 3000) { alert('Недостаточно монет!'); return; }
  gameState.balance -= 3000;
  gameState.maxEnergy += 500;
  gameState.energy = gameState.maxEnergy;
  gameState.energyLimitLvl += 1;
  triggerHaptic('success');
  saveGameState();
  closeModal();
}

// EXCHANGE SELECTOR MODAL
function openExchangeModal() {
  document.getElementById('modal-title').textContent = '🏦 Выбор криптобиржи';
  document.getElementById('modal-body').innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <button class="option-card-btn" onclick="selectExchange('Binance', '🟡')">🟡 Binance</button>
      <button class="option-card-btn" onclick="selectExchange('Bybit', '🖤')">🖤 Bybit</button>
      <button class="option-card-btn" onclick="selectExchange('OKX', '⚪')">⚪ OKX</button>
      <button class="option-card-btn" onclick="selectExchange('BingX', '💙')">💙 BingX</button>
    </div>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function selectExchange(name, logo) {
  gameState.selectedExchange = name;
  gameState.exchangeLogo = logo;
  triggerHaptic('success');
  saveGameState();
  closeModal();
}

// MINI-GAME PUZZLE MODAL
function openPuzzleMiniGameModal() {
  document.getElementById('modal-title').textContent = '🎮 Головоломка Свечей (Ключ 🗝️)';
  document.getElementById('modal-body').innerHTML = `
    <div style="text-align: center; padding: 10px;">
      <div style="font-size: 48px;">🗝️</div>
      <div style="font-size: 15px; font-weight: 800; color: #fff; margin-top: 6px;">Секретная игра за Ключ!</div>
      <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Передвинь японские свечи трейдинга и выведи ключ наружу за 30 секунд!</p>
    </div>
    <button class="btn-connect-wallet" onclick="playMiniGame()">Начать игру 🚀</button>
  `;
  document.getElementById('app-modal').classList.add('active');
}

function playMiniGame() {
  gameState.keys += 1;
  triggerHaptic('success');
  alert('🎉 ПОБЕДА! За 30 секунд вы решили головоломку и получили +1 Золотой Ключ 🗝️!');
  saveGameState();
  closeModal();
}

// EARN TASKS
function claimTaskReward(taskId, rewardAmount) {
  if (gameState.tasksDone[taskId]) {
    alert('Задание уже выполнено!');
    return;
  }

  gameState.tasksDone[taskId] = true;
  gameState.balance += rewardAmount;
  triggerHaptic('success');

  const btn = document.getElementById(`task-btn-${taskId}`);
  if (btn) {
    btn.textContent = '✓ Выполнено';
    btn.classList.add('done');
  }

  alert(`🎉 Задание выполнено! Начислено +${rewardAmount.toLocaleString()} 🪙!`);
  saveGameState();
}

function copyReferralLink() {
  navigator.clipboard?.writeText('https://t.me/SusckaJoleg_bot?start=ref_123456');
  triggerHaptic('success');
  alert('📋 Реферальная ссылка скопирована в буфер обмена!');
}

function toggleWalletConnection() {
  gameState.walletConnected = !gameState.walletConnected;
  if (gameState.walletConnected) {
    gameState.walletAddress = 'EQD3...a8F2';
  } else {
    gameState.walletAddress = null;
  }
  triggerHaptic('success');

  const btn = document.getElementById('btn-wallet-connect');
  const status = document.getElementById('airdrop-wallet-status');

  if (btn) btn.textContent = gameState.walletConnected ? 'Кошелек привязан: EQD3...a8F2 ✓' : 'Connect TON wallet 💎';
  if (status) status.textContent = gameState.walletConnected ? 'Привязан EQD3...a8F2 ✓' : 'Не подключен';

  saveGameState();
}

function closeModal() {
  document.getElementById('app-modal').classList.remove('active');
}
