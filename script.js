/**
 * @fileoverview Main game logic and controls for Cyber Rock Paper Scissors.
 * Contains Web Audio Synthesis, local storage management, Canvas particles, and State control.
 * @author Sarthak Singh
 */

/* ==========================================================================
   1. CYBER AUDIO SYNTHESIZER
   ========================================================================== */

/**
 * Class representing a Web Audio API synthesizer for retro-futuristic sound effects.
 */
class CyberAudioSynth {
  /**
   * Create a audio synth.
   */
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    /** @type {number} */
    this.volume = 0.7; // default 70%
    /** @type {boolean} */
    this.muted = false;
  }

  /**
   * Initialize the AudioContext lazily on first user interaction.
   * @private
   */
  _init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Set synth volume.
   * @param {number} val - Volume scale from 0 to 100.
   */
  setVolume(val) {
    this.volume = Math.max(0, Math.min(100, val)) / 100;
  }

  /**
   * Toggle mute state.
   * @returns {boolean} The new muted state.
   */
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * Synthesize a clean, fast click sound for UI actions.
   */
  playClick() {
    if (this.muted) return;
    this._init();

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

    gainNode.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  /**
   * Synthesize a rewarding cybernetic arpeggio for victory.
   */
  playWin() {
    if (this.muted) return;
    this._init();

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 (major pentatonic)
    
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const time = now + index * 0.08;

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

      osc.start(time);
      osc.stop(time + 0.25);
    });
  }

  /**
   * Synthesize a descending industrial noise sweep for defeat.
   */
  playLose() {
    if (this.muted) return;
    this._init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gainNode = this.ctx.createGain();

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.45);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.45);

    gainNode.gain.setValueAtTime(this.volume * 0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  /**
   * Synthesize a neutral double-beep sound for draws.
   */
  playDraw() {
    if (this.muted) return;
    this._init();

    const playBeep = (time) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, time);

      gainNode.gain.setValueAtTime(this.volume * 0.15, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.06);

      osc.start(time);
      osc.stop(time + 0.06);
    };

    const now = this.ctx.currentTime;
    playBeep(now);
    playBeep(now + 0.12);
  }
}

/* ==========================================================================
   2. LOCAL STORAGE AND DATA SERVICE
   ========================================================================== */

/**
 * Class representing the game statistics and configurations persistence service.
 */
class CyberGameStats {
  /**
   * Create the storage.
   */
  constructor() {
    /** @type {string} */
    this.storageKey = 'cyber_shield_stats_v1';
    
    // Default statistics dataset
    this.data = {
      playerName: 'USER_01',
      theme: 'purple',
      volume: 70,
      timerEnabled: true,
      scores: {
        player: 0,
        computer: 0,
        draw: 0
      },
      history: [],
      stats: {
        totalRounds: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        maxWinStreak: 0,
        currentStreak: 0,
        frequencies: {
          Rock: 0,
          Paper: 0,
          Scissors: 0
        }
      }
    };
    
    this.load();
  }

  /**
   * Load data from browser local storage.
   */
  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Deep copy merge to ensure backward compatibility if structure changes
        this.data = { ...this.data, ...parsed };
        // Ensure sub objects are also merged properly
        this.data.scores = { ...this.data.scores, ...parsed.scores };
        this.data.stats = { ...this.data.stats, ...parsed.stats };
        if (parsed.stats && parsed.stats.frequencies) {
          this.data.stats.frequencies = { ...this.data.stats.frequencies, ...parsed.stats.frequencies };
        }
      }
    } catch (e) {
      console.warn('Failed to load local storage sectors:', e);
    }
  }

  /**
   * Save current data to browser local storage.
   */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to write local storage sectors:', e);
    }
  }

  /**
   * Record a match outcome in statistics.
   * @param {string} pMove - Player's choice (Rock, Paper, Scissors).
   * @param {string} cMove - Computer's choice.
   * @param {string} result - 'win', 'lose', or 'draw'.
   */
  recordRound(pMove, cMove, result) {
    this.data.stats.totalRounds++;
    this.data.stats.frequencies[pMove]++;

    if (result === 'win') {
      this.data.stats.wins++;
      this.data.stats.currentStreak++;
      if (this.data.stats.currentStreak > this.data.stats.maxWinStreak) {
        this.data.stats.maxWinStreak = this.data.stats.currentStreak;
      }
    } else if (result === 'lose') {
      this.data.stats.losses++;
      this.data.stats.currentStreak = 0; // reset win streak
    } else {
      this.data.stats.draws++;
      // Draw doesn't break a win streak, it just pauses it
    }

    // Add to matches history (limit to last 50)
    this.data.history.unshift({
      round: this.data.stats.totalRounds,
      playerMove: pMove,
      computerMove: cMove,
      result: result
    });

    if (this.data.history.length > 50) {
      this.data.history.pop();
    }

    this.save();
  }

  /**
   * Flush all temporary runtime match scores.
   */
  resetRuntimeScores() {
    this.data.scores.player = 0;
    this.data.scores.computer = 0;
    this.data.scores.draw = 0;
    this.save();
  }

  /**
   * Purge all statistics records back to fresh state.
   */
  purgeStats() {
    this.data.stats = {
      totalRounds: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      maxWinStreak: 0,
      currentStreak: 0,
      frequencies: {
        Rock: 0,
        Paper: 0,
        Scissors: 0
      }
    };
    this.data.history = [];
    this.save();
  }

  /**
   * Wipe all local data and reset defaults.
   */
  flushAll() {
    localStorage.removeItem(this.storageKey);
    this.data = {
      playerName: 'USER_01',
      theme: 'purple',
      volume: 70,
      timerEnabled: true,
      scores: {
        player: 0,
        computer: 0,
        draw: 0
      },
      history: [],
      stats: {
        totalRounds: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        maxWinStreak: 0,
        currentStreak: 0,
        frequencies: {
          Rock: 0,
          Paper: 0,
          Scissors: 0
        }
      }
    };
    this.save();
  }
}

/* ==========================================================================
   3. NEON PARTICLE SYSTEM
   ========================================================================== */

/**
 * Class representing a particle generator on an HTML5 Canvas.
 */
class NeonParticleSystem {
  /**
   * Create particle system.
   * @param {HTMLCanvasElement} canvas - The canvas element.
   */
  constructor(canvas) {
    this.canvas = canvas;
    /** @type {CanvasRenderingContext2D} */
    this.ctx = canvas.getContext('2d');
    /** @type {Array<Object>} */
    this.particles = [];
    /** @type {number} */
    this.animationId = 0;
    /** @type {boolean} */
    this.running = false;
    
    // Bind handle resize
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  /**
   * Fit canvas dimensions to bounding dimensions.
   */
  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  /**
   * Trigger a burst of neon sparks at specified coordinate.
   * @param {number} x - X axis coordinate.
   * @param {number} y - Y axis coordinate.
   * @param {string} color - Neon hex color.
   * @param {number} count - Amount of particles to build.
   */
  explode(x, y, color, count = 40) {
    this.resize();
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: color,
        alpha: 1,
        life: 1,
        decay: Math.random() * 0.02 + 0.015
      });
    }

    if (!this.running) {
      this.running = true;
      this._loop();
    }
  }

  /**
   * Main rendering update loop.
   * @private
   */
  _loop() {
    if (!this.running) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      // Add slight gravity / air resistance
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= p.decay;
      p.alpha = Math.max(0, p.life);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = p.color;
      this.ctx.fillStyle = p.color;

      // Draw cyber rect/sparks instead of circles
      this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      this.ctx.restore();
    }

    if (this.particles.length === 0) {
      this.running = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      cancelAnimationFrame(this.animationId);
    } else {
      this.animationId = requestAnimationFrame(() => this._loop());
    }
  }
}

/* ==========================================================================
   4. CORE GAME ENGINE
   ========================================================================== */

/**
 * Class representing the core game manager.
 */
class CyberGame {
  /**
   * Initialize game engine, cache DOM nodes, and attach events.
   */
  constructor() {
    // Services
    this.synth = new CyberAudioSynth();
    this.store = new CyberGameStats();
    
    // Game Rules Config
    this.choices = ['Rock', 'Paper', 'Scissors'];
    this.rules = {
      Rock: 'Scissors',
      Scissors: 'Paper',
      Paper: 'Rock'
    };
    
    // Labels mappings
    this.moveTitles = {
      Rock: 'SHIELD',
      Paper: 'GRID',
      Scissors: 'CLAW'
    };
    this.moveSubtitles = {
      Rock: 'TYPE: KINETIC_BLOCK',
      Paper: 'TYPE: DATA_NET',
      Scissors: 'TYPE: LASER_BLADE'
    };
    this.themeColors = {
      purple: '#7c3aed',
      cyan: '#06b6d4',
      green: '#10b981',
      pink: '#ec4899'
    };

    // Game Variables
    this.currentMode = 'unlimited'; // bo3, bo5, unlimited
    this.currentRound = 1;
    this.maxWinsTarget = 0; // calculated from mode
    this.timerDuration = 10; // 10 seconds
    this.timerTimeLeft = 10;
    this.timerInterval = null;
    this.isRoundInProgress = false;
    this.canPlayerChoose = false;

    // Cache elements
    this._cacheElements();

    // Setup Particle System
    this.particles = new NeonParticleSystem(this.elements.canvas);

    // Bind event listeners
    this._attachEvents();

    // Load initial configurations from storage
    this._applyConfig();

    // Start boot sequence
    this.triggerBootSequence();
  }

  /**
   * Cache all required DOM nodes.
   * @private
   */
  _cacheElements() {
    this.elements = {
      body: document.body,
      canvas: document.getElementById('particles-canvas'),
      
      // Screens
      splash: document.getElementById('splash-screen'),
      menu: document.getElementById('main-menu-screen'),
      gameplay: document.getElementById('gameplay-screen'),
      gameOver: document.getElementById('game-over-screen'),
      
      // Splash controls
      bootBar: document.getElementById('boot-progress-bar'),
      bootTerminal: document.getElementById('boot-terminal'),
      splashBtn: document.getElementById('splash-continue-btn'),

      // Menu controls
      playerNameInput: document.getElementById('player-name-input'),
      modeButtons: document.querySelectorAll('.mode-btn'),
      timerToggle: document.getElementById('timer-toggle'),
      startGameBtn: document.getElementById('start-game-btn'),

      // Gameplay HUD
      hudPlayerName: document.getElementById('hud-player-name'),
      hudGameMode: document.getElementById('hud-game-mode'),
      hudStatsBtn: document.getElementById('hud-stats-btn'),
      hudSettingsBtn: document.getElementById('hud-settings-btn'),
      hudSoundBtn: document.getElementById('hud-sound-btn'),
      soundOnSvg: document.getElementById('sound-on-svg'),
      soundOffSvg: document.getElementById('sound-off-svg'),

      // Scoreboard
      playerScore: document.getElementById('player-score'),
      computerScore: document.getElementById('computer-score'),
      roundNum: document.getElementById('round-num'),
      bestOfVerdict: document.getElementById('best-of-verdict'),
      playerWinIndicator: document.getElementById('player-win-indicator'),
      computerWinIndicator: document.getElementById('computer-win-indicator'),

      // Timer
      timerContainer: document.getElementById('gameplay-timer-container'),
      timerBar: document.getElementById('timer-progress'),

      // Battlefield Cards
      playerBattleCard: document.getElementById('player-battle-card'),
      playerPlaceholder: document.getElementById('player-card-icon-placeholder'),
      playerMoveInfo: document.getElementById('player-card-move-info'),
      playerMoveTitle: document.getElementById('player-move-title'),
      
      computerBattleCard: document.getElementById('computer-battle-card'),
      computerPlaceholder: document.getElementById('computer-card-icon-placeholder'),
      computerMoveInfo: document.getElementById('computer-card-move-info'),
      computerMoveTitle: document.getElementById('computer-move-title'),

      versusText: document.getElementById('versus-text'),
      combatBanner: document.getElementById('combat-banner'),
      combatResultText: document.getElementById('combat-result-text'),
      combatExplanationText: document.getElementById('combat-explanation-text'),

      // Player choice panel
      choicesPanel: document.getElementById('choices-panel'),
      choiceButtons: document.querySelectorAll('.choice-btn'),

      // Round action controls
      gameplayActions: document.getElementById('gameplay-actions'),
      nextRoundBtn: document.getElementById('next-round-btn'),
      abortMatchBtn: document.getElementById('abort-match-btn'),

      // History log panel
      historyContainer: document.getElementById('history-container'),
      clearHistoryBtn: document.getElementById('clear-history-btn'),

      // Game Over Screen
      gameOverVerdict: document.getElementById('game-over-verdict'),
      overPlayerScore: document.getElementById('over-player-score'),
      overComputerScore: document.getElementById('over-computer-score'),
      overRoundsTotal: document.getElementById('over-rounds-total'),
      overRatingPercent: document.getElementById('over-rating-percent'),
      overEvaluationText: document.getElementById('over-evaluation-text'),
      gameOverReplayBtn: document.getElementById('game-over-replay-btn'),
      gameOverMenuBtn: document.getElementById('game-over-menu-btn'),

      // Settings Modal
      settingsModal: document.getElementById('settings-modal'),
      settingsCloseBtn: document.getElementById('settings-close-btn'),
      settingsOverlay: document.getElementById('settings-overlay'),
      themeButtons: document.querySelectorAll('.theme-btn'),
      volumeSlider: document.getElementById('volume-slider'),
      volumeValue: document.getElementById('volume-indicator-value'),
      resetAllBtn: document.getElementById('settings-reset-all-btn'),

      // Stats Modal
      statsModal: document.getElementById('stats-modal'),
      statsCloseBtn: document.getElementById('stats-close-btn'),
      statsOverlay: document.getElementById('stats-overlay'),
      statsTotalRounds: document.getElementById('stats-total-rounds'),
      statsWins: document.getElementById('stats-wins'),
      statsLosses: document.getElementById('stats-losses'),
      statsDraws: document.getElementById('stats-draws'),
      statsWinRate: document.getElementById('stats-winrate'),
      statsWinRateProgress: document.getElementById('stats-winrate-progress'),
      statsMaxWinStreak: document.getElementById('stats-max-win-streak'),
      statsCurrentStreak: document.getElementById('stats-current-streak'),
      statsFreqRock: document.getElementById('stats-freq-rock'),
      statsFreqRockVal: document.getElementById('stats-freq-rock-val'),
      statsFreqPaper: document.getElementById('stats-freq-paper'),
      statsFreqPaperVal: document.getElementById('stats-freq-paper-val'),
      statsFreqScissors: document.getElementById('stats-freq-scissors'),
      statsFreqScissorsVal: document.getElementById('stats-freq-scissors-val'),
      statsResetBtn: document.getElementById('stats-reset-btn')
    };
  }

  /**
   * Apply storage state to DOM elements and game configuration.
   * @private
   */
  _applyConfig() {
    const data = this.store.data;
    
    // Player Name
    this.elements.playerNameInput.value = data.playerName;
    
    // Color Theme
    this._setTheme(data.theme);
    
    // Sound volume & mute
    this.elements.volumeSlider.value = data.volume;
    this.elements.volumeValue.innerText = `${data.volume}%`;
    this.synth.setVolume(data.volume);

    // Timer switch
    this.elements.timerToggle.checked = data.timerEnabled;
  }

  /**
   * Attach interactive DOM click handlers and keyboard events.
   * @private
   */
  _attachEvents() {
    // Splash screen click continue
    this.elements.splashBtn.addEventListener('click', () => {
      this.synth.playClick();
      this.transitionScreen(this.elements.splash, this.elements.menu);
    });

    // Menu mode buttons configuration
    this.elements.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.synth.playClick();
        this.elements.modeButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
        this.currentMode = btn.getAttribute('data-mode');
      });
    });

    // Start Simulation Button
    this.elements.startGameBtn.addEventListener('click', () => this.startGame());

    // Gameplay Choice buttons
    this.elements.choiceButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.canPlayerChoose || this.isRoundInProgress) return;
        const choice = btn.getAttribute('data-choice');
        this.playRound(choice);
      });
    });

    // Next Round Actions
    this.elements.nextRoundBtn.addEventListener('click', () => this.nextRound());
    this.elements.abortMatchBtn.addEventListener('click', () => this.abortGame());

    // Clear history logs
    this.elements.clearHistoryBtn.addEventListener('click', () => {
      this.synth.playClick();
      this.store.data.history = [];
      this.store.save();
      this.renderHistoryLog();
    });

    // HUD settings, stats and sound toggles
    this.elements.hudSettingsBtn.addEventListener('click', () => this.toggleModal(this.elements.settingsModal, true));
    this.elements.settingsCloseBtn.addEventListener('click', () => this.toggleModal(this.elements.settingsModal, false));
    this.elements.settingsOverlay.addEventListener('click', () => this.toggleModal(this.elements.settingsModal, false));

    this.elements.hudStatsBtn.addEventListener('click', () => {
      this.renderStatsModal();
      this.toggleModal(this.elements.statsModal, true);
    });
    this.elements.statsCloseBtn.addEventListener('click', () => this.toggleModal(this.elements.statsModal, false));
    this.elements.statsOverlay.addEventListener('click', () => this.toggleModal(this.elements.statsModal, false));

    this.elements.hudSoundBtn.addEventListener('click', () => this.toggleMute());

    // Settings adjustments: Theme buttons
    this.elements.themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.synth.playClick();
        const theme = btn.getAttribute('data-theme');
        this._setTheme(theme);
        this.store.data.theme = theme;
        this.store.save();
      });
    });

    // Settings adjustments: Volume slider
    this.elements.volumeSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.elements.volumeValue.innerText = `${val}%`;
      this.synth.setVolume(val);
      this.store.data.volume = val;
    });

    this.elements.volumeSlider.addEventListener('change', () => {
      this.store.save();
      this.synth.playClick();
    });

    // Settings adjustments: Flush all local data
    this.elements.resetAllBtn.addEventListener('click', () => {
      if (confirm('CRITICAL ACTION: Flush all local configuration and metrics data?')) {
        this.synth.playLose();
        this.store.flushAll();
        this._applyConfig();
        this.toggleModal(this.elements.settingsModal, false);
        this.transitionScreen(this.elements.gameplay, this.elements.menu);
        this.transitionScreen(this.elements.gameOver, this.elements.menu);
      }
    });

    // Stats purge action
    this.elements.statsResetBtn.addEventListener('click', () => {
      if (confirm('CRITICAL ACTION: Purge all telemetry statistics records?')) {
        this.synth.playLose();
        this.store.purgeStats();
        this.renderStatsModal();
        this.renderHistoryLog();
      }
    });

    // Game Over Actions
    this.elements.gameOverReplayBtn.addEventListener('click', () => {
      this.synth.playClick();
      this.transitionScreen(this.elements.gameOver, this.elements.gameplay);
      this.resetMatchState();
      this.startTimer();
    });

    this.elements.gameOverMenuBtn.addEventListener('click', () => {
      this.synth.playClick();
      this.transitionScreen(this.elements.gameOver, this.elements.menu);
      this.resetMatchState();
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeyboardInput(e));
  }

  /**
   * Keyboard shortcuts routing.
   * @param {KeyboardEvent} e - The keydown event.
   */
  handleKeyboardInput(e) {
    // 1. Escape closes open modals
    if (e.key === 'Escape') {
      if (!this.elements.settingsModal.classList.contains('hidden')) {
        this.toggleModal(this.elements.settingsModal, false);
      }
      if (!this.elements.statsModal.classList.contains('hidden')) {
        this.toggleModal(this.elements.statsModal, false);
      }
      return;
    }

    // 2. Choice shortcuts: 1 (Rock), 2 (Paper), 3 (Scissors)
    if (this.canPlayerChoose && !this.isRoundInProgress) {
      if (e.key === '1') {
        this.playRound('Rock');
      } else if (e.key === '2') {
        this.playRound('Paper');
      } else if (e.key === '3') {
        this.playRound('Scissors');
      }
    }

    // 3. Spacebar shortcut to progress/retry
    if (e.key === ' ') {
      // If round finished and "NEXT ROUND" action is showing
      if (!this.elements.gameplayActions.classList.contains('hidden') && 
          this.elements.gameplay.classList.contains('active')) {
        e.preventDefault(); // stop space scroll
        this.nextRound();
      }
      // If Game Over screen is showing and active
      else if (this.elements.gameOver.classList.contains('active')) {
        e.preventDefault();
        this.elements.gameOverReplayBtn.click();
      }
    }
  }

  /**
   * Set theme class on body.
   * @param {string} theme - Theme name (purple, cyan, green, pink).
   * @private
   */
  _setTheme(theme) {
    this.elements.body.className = `theme-${theme}`;
    this.elements.themeButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-theme') === theme) {
        btn.classList.add('active');
      }
    });
  }

  /**
   * Switch screens by toggling classes.
   * @param {HTMLElement} fromScreen - Target screen to hide.
   * @param {HTMLElement} toScreen - Target screen to show.
   */
  transitionScreen(fromScreen, toScreen) {
    fromScreen.classList.remove('active');
    setTimeout(() => {
      fromScreen.classList.add('hidden');
      toScreen.classList.remove('hidden');
      setTimeout(() => {
        toScreen.classList.add('active');
      }, 50);
    }, 300);
  }

  /**
   * Open or close settings/stats overlays.
   * @param {HTMLElement} modal - The modal elements div.
   * @param {boolean} show - True to open, false to close.
   */
  toggleModal(modal, show) {
    this.synth.playClick();
    if (show) {
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
    } else {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Toggle mute and update DOM icon states.
   */
  toggleMute() {
    const isMuted = this.synth.toggleMute();
    if (isMuted) {
      this.elements.soundOnSvg.classList.add('hidden');
      this.elements.soundOffSvg.classList.remove('hidden');
    } else {
      this.elements.soundOnSvg.classList.remove('hidden');
      this.elements.soundOffSvg.classList.add('hidden');
    }
  }

  /**
   * Simulate a booting console sequence for the splash screen.
   */
  triggerBootSequence() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        this.elements.splashBtn.classList.remove('hidden');
        this.elements.splashBtn.focus();
      }
      this.elements.bootBar.style.width = `${progress}%`;
    }, 80);
  }

  /**
   * Start a new match simulation.
   */
  startGame() {
    // Read and save Pilot identification
    let pilotName = this.elements.playerNameInput.value.trim().toUpperCase();
    if (!pilotName) pilotName = 'USER_01';
    
    this.store.data.playerName = pilotName;
    this.store.data.timerEnabled = this.elements.timerToggle.checked;
    this.store.save();

    // Cache local configs
    this.currentMode = document.querySelector('.mode-btn.active').getAttribute('data-mode');
    
    // Reset transient round variables
    this.currentRound = 1;
    this.store.resetRuntimeScores();
    this.resetMatchState();

    // Render scoreboard and HUD variables
    this.elements.hudPlayerName.innerText = pilotName;
    
    let modeText = 'UNLIMITED';
    this.maxWinsTarget = 0;
    if (this.currentMode === 'bo3') {
      modeText = 'BEST OF 3';
      this.maxWinsTarget = 2; // First to 2 wins
    } else if (this.currentMode === 'bo5') {
      modeText = 'BEST OF 5';
      this.maxWinsTarget = 3; // First to 3 wins
    }
    
    this.elements.hudGameMode.innerText = modeText;
    this.elements.bestOfVerdict.innerText = modeText;

    this.renderScoreboard();
    this.renderHistoryLog();

    // Go to gameplay screen
    this.synth.playClick();
    this.transitionScreen(this.elements.menu, this.elements.gameplay);

    // Start first turn
    this.startTimer();
  }

  /**
   * Reset the graphics and logic of the battlefield for a fresh turn.
   */
  resetMatchState() {
    this.canPlayerChoose = true;
    this.isRoundInProgress = false;

    // Reset card UI classes
    this.elements.playerBattleCard.className = 'battle-card';
    this.elements.computerBattleCard.className = 'battle-card';

    // Show waiting placeholders
    this.elements.playerPlaceholder.classList.remove('hidden');
    this.elements.playerMoveInfo.classList.add('hidden');
    this.elements.computerPlaceholder.classList.remove('hidden');
    this.elements.computerMoveInfo.classList.add('hidden');

    // Reset computer matrix anim
    this.elements.computerPlaceholder.innerHTML = `
      <div class="matrix-loader">
        <div class="matrix-bar"></div>
        <div class="matrix-bar"></div>
        <div class="matrix-bar"></div>
      </div>
      <span class="pulse-text">CALCULATING MOVE</span>
    `;

    // Reset banners
    this.elements.versusText.classList.remove('hidden');
    this.elements.combatBanner.className = 'combat-banner hidden';

    // Hide control overlays, show player options
    this.elements.gameplayActions.classList.add('hidden');
    this.elements.choicesPanel.classList.remove('hidden');
    this.elements.choicesPanel.style.pointerEvents = 'all';
    this.elements.choicesPanel.style.opacity = '1';
  }

  /**
   * Start the countdown clock for player decisions.
   */
  startTimer() {
    clearInterval(this.timerInterval);

    if (!this.store.data.timerEnabled) {
      this.elements.timerContainer.style.display = 'none';
      return;
    }

    this.elements.timerContainer.style.display = 'block';
    this.timerTimeLeft = this.timerDuration;
    this.elements.timerBar.style.width = '100%';
    this.elements.timerBar.style.backgroundColor = 'var(--color-warning)';

    this.timerInterval = setInterval(() => {
      this.timerTimeLeft -= 0.1;
      
      const pct = (this.timerTimeLeft / this.timerDuration) * 100;
      this.elements.timerBar.style.width = `${pct}%`;

      // Change timer color to red when running critical low
      if (this.timerTimeLeft <= 3.0) {
        this.elements.timerBar.style.backgroundColor = 'var(--color-danger)';
      }

      if (this.timerTimeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.handleTimerExpiration();
      }
    }, 100);
  }

  /**
   * Auto select a choice if the decision timer lapses.
   */
  handleTimerExpiration() {
    if (!this.canPlayerChoose || this.isRoundInProgress) return;
    
    // Choose random move for player
    const randomChoice = this.choices[Math.floor(Math.random() * this.choices.length)];
    this.playRound(randomChoice);
  }

  /**
   * Execute combat evaluation of choices and display outcomes.
   * @param {string} playerMove - Rock, Paper, or Scissors.
   */
  playRound(playerMove) {
    this.canPlayerChoose = false;
    this.isRoundInProgress = true;
    clearInterval(this.timerInterval);

    // Disable choices buttons visual
    this.elements.choicesPanel.style.pointerEvents = 'none';
    this.elements.choicesPanel.style.opacity = '0.5';

    // 1. Resolve Computer move
    const computerMove = this.choices[Math.floor(Math.random() * this.choices.length)];

    // 2. Evaluate outcome logic
    let result = 'draw';
    let explanation = 'Identical threat signatures detected.';

    if (playerMove === computerMove) {
      result = 'draw';
    } else if (this.rules[playerMove] === computerMove) {
      result = 'win';
      explanation = `${this.moveTitles[playerMove]} blocks/deletes ${this.moveTitles[computerMove]}`;
    } else {
      result = 'lose';
      explanation = `${this.moveTitles[computerMove]} blocks/deletes ${this.moveTitles[playerMove]}`;
    }

    // 3. Update scores and write metrics
    if (result === 'win') {
      this.store.data.scores.player++;
    } else if (result === 'lose') {
      this.store.data.scores.computer++;
    } else {
      this.store.data.scores.draw++;
    }

    this.store.recordRound(playerMove, computerMove, result);

    // 4. Trigger battlefield animations and render
    this.revealChoices(playerMove, computerMove, result, explanation);
  }

  /**
   * Animate battlefield elements to reveal selections.
   * @param {string} pMove - Player's choice.
   * @param {string} cMove - Computer's choice.
   * @param {string} outcome - 'win', 'lose', or 'draw'.
   * @param {string} explanation - Text statement describing why.
   */
  revealChoices(pMove, cMove, outcome, explanation) {
    const CHOICE_SVGS = {
      Rock: `
        <svg viewBox="0 0 24 24" class="card-icon-svg text-cyan">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M12 6v10" stroke="currentColor" stroke-width="2"/>
          <path d="M9 11h6" stroke="currentColor" stroke-width="2"/>
        </svg>`,
      Paper: `
        <svg viewBox="0 0 24 24" class="card-icon-svg text-purple">
          <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M9 3v18" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
          <path d="M15 3v18" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
          <path d="M3 9h18" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
          <path d="M3 15h18" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>`,
      Scissors: `
        <svg viewBox="0 0 24 24" class="card-icon-svg text-danger">
          <path d="M6 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M6 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M20 4L8.5 11" stroke="currentColor" stroke-width="2"/>
          <path d="M20 20L8.5 13" stroke="currentColor" stroke-width="2"/>
          <path d="M16 12l5 0" stroke="currentColor" stroke-width="2"/>
        </svg>`
    };

    // Draw Player Card details
    this.elements.playerPlaceholder.classList.add('hidden');
    this.elements.playerMoveInfo.classList.remove('hidden');
    
    // Put SVG inside
    const playerSVGContainer = document.createElement('div');
    playerSVGContainer.innerHTML = CHOICE_SVGS[pMove];
    const existingSVG = this.elements.playerMoveInfo.querySelector('.card-icon-svg');
    if (existingSVG) existingSVG.remove();
    this.elements.playerMoveInfo.insertBefore(playerSVGContainer.firstElementChild, this.elements.playerMoveInfo.firstChild);
    
    this.elements.playerMoveTitle.innerText = this.moveTitles[pMove];
    const pDetail = this.elements.playerMoveInfo.querySelector('.move-detail');
    if (pDetail) pDetail.innerText = this.moveSubtitles[pMove];

    // Play temporary glitch loading for CPU
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      tickCount++;
      const randMove = this.choices[Math.floor(Math.random() * this.choices.length)];
      this.elements.computerPlaceholder.innerHTML = `
        <div class="card-placeholder">
          ${CHOICE_SVGS[randMove]}
          <span class="pulse-text">DECIPHERING...</span>
        </div>
      `;

      if (tickCount >= 6) {
        clearInterval(tickInterval);
        
        // Finalize CPU choice display
        this.elements.computerPlaceholder.classList.add('hidden');
        this.elements.computerMoveInfo.classList.remove('hidden');
        
        const compSVGContainer = document.createElement('div');
        compSVGContainer.innerHTML = CHOICE_SVGS[cMove];
        const existingCSvg = this.elements.computerMoveInfo.querySelector('.card-icon-svg');
        if (existingCSvg) existingCSvg.remove();
        this.elements.computerMoveInfo.insertBefore(compSVGContainer.firstElementChild, this.elements.computerMoveInfo.firstChild);
        
        this.elements.computerMoveTitle.innerText = this.moveTitles[cMove];
        const cDetail = this.elements.computerMoveInfo.querySelector('.move-detail');
        if (cDetail) cDetail.innerText = this.moveSubtitles[cMove];

        // Evaluate screen outcomes
        this.resolveFinalOutcome(outcome, explanation);
      }
    }, 100);
  }

  /**
   * Finalize outcome and display result banner.
   * @param {string} outcome - 'win', 'lose', or 'draw'.
   * @param {string} explanation - Text statement describing why.
   */
  resolveFinalOutcome(outcome, explanation) {
    // Hide versus text, show combat banner
    this.elements.versusText.classList.add('hidden');
    this.elements.combatBanner.className = `combat-banner ${outcome}`;
    
    let resultHeader = 'MATCH SYNCED';
    let themeColor = 'var(--text-light)';

    if (outcome === 'win') {
      resultHeader = 'PROTOCOL SECURED';
      themeColor = 'var(--color-success)';
      this.elements.playerBattleCard.classList.add('victory');
      this.elements.computerBattleCard.classList.add('defeat');
      this.synth.playWin();

      // Explode neon particles from Player Card
      const cardRect = this.elements.playerBattleCard.getBoundingClientRect();
      const canvasRect = this.elements.canvas.getBoundingClientRect();
      const px = (cardRect.left + cardRect.width / 2) - canvasRect.left;
      const py = (cardRect.top + cardRect.height / 2) - canvasRect.top;
      
      const themeColorHex = this.themeColors[this.store.data.theme] || '#7c3aed';
      this.particles.explode(px, py, themeColorHex, 50);

    } else if (outcome === 'lose') {
      resultHeader = 'CORE INTRUDED';
      themeColor = 'var(--color-danger)';
      this.elements.playerBattleCard.classList.add('defeat');
      this.elements.computerBattleCard.classList.add('victory');
      this.synth.playLose();
    } else {
      resultHeader = 'WAVE SYNC DIVERGED';
      themeColor = 'var(--color-info)';
      this.synth.playDraw();
    }

    this.elements.combatResultText.innerText = resultHeader;
    this.elements.combatExplanationText.innerText = explanation;

    // Refresh scoreboard meters
    this.renderScoreboard();
    this.renderHistoryLog();

    // Check match completion target for Best of X modes
    if (this.maxWinsTarget > 0 && 
        (this.store.data.scores.player >= this.maxWinsTarget || 
         this.store.data.scores.computer >= this.maxWinsTarget)) {
      
      // Delay transition to let the user view final round outcome
      setTimeout(() => {
        this.triggerGameOver();
      }, 1500);

    } else {
      // Shift options to Next Round
      this.elements.choicesPanel.classList.add('hidden');
      this.elements.gameplayActions.classList.remove('hidden');
      this.elements.nextRoundBtn.focus();
    }
  }

  /**
   * Advance to the next round, resetting the turn settings.
   */
  nextRound() {
    this.synth.playClick();
    this.currentRound++;
    this.elements.roundNum.innerText = this.currentRound;
    this.resetMatchState();
    this.startTimer();
  }

  /**
   * Abort game loop, return back to main dashboard menu.
   */
  abortGame() {
    this.synth.playLose();
    clearInterval(this.timerInterval);
    this.resetMatchState();
    this.transitionScreen(this.elements.gameplay, this.elements.menu);
  }

  /**
   * Complete matching protocols, calculate overall score metrics, and load Game Over Screen.
   */
  triggerGameOver() {
    const isPlayerVictor = this.store.data.scores.player > this.store.data.scores.computer;
    
    // Verdict Glow Headers
    if (isPlayerVictor) {
      this.elements.gameOverVerdict.innerText = 'VICTORY ACHIEVED';
      this.elements.gameOverVerdict.className = 'verdict-title text-success';
      this.elements.overEvaluationText.innerText = 'Simulation target successfully infiltrated. Hostile CPU neutralized. Sector secured.';
    } else {
      this.elements.gameOverVerdict.innerText = 'SYSTEM OVERRIDE';
      this.elements.gameOverVerdict.className = 'verdict-title text-danger';
      this.elements.overEvaluationText.innerText = 'Critical breach detected. Hostile algorithms hijacked localized mainframe. Connection severed.';
    }

    // Write metric variables
    const playerFinalScore = this.store.data.scores.player;
    const computerFinalScore = this.store.data.scores.computer;
    const totalRoundsPlayed = playerFinalScore + computerFinalScore + this.store.data.scores.draw;
    
    this.elements.overPlayerScore.innerText = playerFinalScore;
    this.elements.overComputerScore.innerText = computerFinalScore;
    this.elements.overRoundsTotal.innerText = totalRoundsPlayed;

    // Victory Ratio
    const winRate = totalRoundsPlayed > 0 ? Math.round((playerFinalScore / totalRoundsPlayed) * 100) : 0;
    this.elements.overRatingPercent.innerText = `${winRate}%`;

    // Swap panels
    this.transitionScreen(this.elements.gameplay, this.elements.gameOver);
    this.elements.gameOverReplayBtn.focus();
  }

  /**
   * Render scoreboard numbers and indicators.
   */
  renderScoreboard() {
    const scores = this.store.data.scores;
    this.elements.playerScore.innerText = scores.player;
    this.elements.computerScore.innerText = scores.computer;

    // Calculate indicator bars widths for BoX modes
    if (this.maxWinsTarget > 0) {
      const pPercent = Math.min(100, (scores.player / this.maxWinsTarget) * 100);
      const cPercent = Math.min(100, (scores.computer / this.maxWinsTarget) * 100);
      this.elements.playerWinIndicator.style.width = `${pPercent}%`;
      this.elements.computerWinIndicator.style.width = `${cPercent}%`;
    } else {
      // Unlimited mode does standard progress bounds
      const total = scores.player + scores.computer;
      if (total > 0) {
        const pPercent = (scores.player / total) * 100;
        const cPercent = (scores.computer / total) * 100;
        this.elements.playerWinIndicator.style.width = `${pPercent}%`;
        this.elements.computerWinIndicator.style.width = `${cPercent}%`;
      } else {
        this.elements.playerWinIndicator.style.width = '0%';
        this.elements.computerWinIndicator.style.width = '0%';
      }
    }
  }

  /**
   * Build timeline history items in the scrolling container.
   */
  renderHistoryLog() {
    const list = this.store.data.history;
    this.elements.historyContainer.innerHTML = '';

    if (list.length === 0) {
      this.elements.historyContainer.innerHTML = '<div class="history-empty-message">No engagement logs recorded yet.</div>';
      return;
    }

    list.forEach(item => {
      const div = document.createElement('div');
      div.className = `history-item ${item.result}`;
      
      let outcomeLabel = 'DRAW';
      if (item.result === 'win') outcomeLabel = 'VICTORY';
      if (item.result === 'lose') outcomeLabel = 'DEFEAT';

      div.innerHTML = `
        <span class="hist-round">RD_${item.round}</span>
        <span class="hist-summary">${this.moveTitles[item.playerMove]} vs ${this.moveTitles[item.computerMove]}</span>
        <span class="hist-outcome">${outcomeLabel}</span>
      `;
      this.elements.historyContainer.appendChild(div);
    });
  }

  /**
   * Read telemetry state variables and fill chart metrics inside Statistics Modal.
   */
  renderStatsModal() {
    const stats = this.store.data.stats;
    
    // Overview metrics
    this.elements.statsTotalRounds.innerText = stats.totalRounds;
    this.elements.statsWins.innerText = stats.wins;
    this.elements.statsLosses.innerText = stats.losses;
    this.elements.statsDraws.innerText = stats.draws;

    // Win Rate Calculation
    const winRate = stats.totalRounds > 0 ? Math.round((stats.wins / stats.totalRounds) * 100) : 0;
    this.elements.statsWinRate.innerText = `${winRate}%`;
    this.elements.statsWinRateProgress.style.width = `${winRate}%`;

    // Streak stats
    this.elements.statsMaxWinStreak.innerText = stats.maxWinStreak;
    this.elements.statsCurrentStreak.innerText = stats.currentStreak;

    // Move frequency charts
    const rockCount = stats.frequencies.Rock || 0;
    const paperCount = stats.frequencies.Paper || 0;
    const scissorsCount = stats.frequencies.Scissors || 0;
    const totalMoves = rockCount + paperCount + scissorsCount;

    if (totalMoves > 0) {
      const rPct = Math.round((rockCount / totalMoves) * 100);
      const pPct = Math.round((paperCount / totalMoves) * 100);
      const sPct = Math.round((scissorsCount / totalMoves) * 100);

      this.elements.statsFreqRock.style.width = `${rPct}%`;
      this.elements.statsFreqRockVal.innerText = `${rockCount} (${rPct}%)`;

      this.elements.statsFreqPaper.style.width = `${pPct}%`;
      this.elements.statsFreqPaperVal.innerText = `${paperCount} (${pPct}%)`;

      this.elements.statsFreqScissors.style.width = `${sPct}%`;
      this.elements.statsFreqScissorsVal.innerText = `${scissorsCount} (${sPct}%)`;
    } else {
      this.elements.statsFreqRock.style.width = '0%';
      this.elements.statsFreqRockVal.innerText = '0 (0%)';
      this.elements.statsFreqPaper.style.width = '0%';
      this.elements.statsFreqPaperVal.innerText = '0 (0%)';
      this.elements.statsFreqScissors.style.width = '0%';
      this.elements.statsFreqScissorsVal.innerText = '0 (0%)';
    }
  }
}

// Instantiate game engine on load
window.addEventListener('DOMContentLoaded', () => {
  window.cyberGame = new CyberGame();
});
