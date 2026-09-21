const state = {
  players: ['Player 1', 'Player 2'],
  pointsToWin: 21,
  bestOf: 3,
  scores: [0, 0],
  sets: [0, 0],
  gameNumber: 1,
  firstServer: 0,
  sides: [0, 1],
  matchOver: false,
  summaries: []
};
const history = [];

const setup = {
  step: 0,
  players: ['Bob', 'Alice'],
  visitedPlayers: [false, false],
  playerOneSide: 0,
  pointsToWin: 21,
  bestOf: 3
};

const renderedScores = [null, null];
const renderedSets = [null, null];

function isMobileDevice() {
  return navigator.userAgentData?.mobile ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

const elements = {
  setupPage: document.querySelector('#setup-page'),
  setupStepLabel: document.querySelector('#setup-step-label'),
  setupInputLabel: document.querySelector('#setup-input-label'),
  setupInput: document.querySelector('#setup-input'),
  setupOptions: document.querySelector('#setup-options'),
  orientationPrompt: document.querySelector('#orientation-prompt'),
  sideDiagram: document.querySelector('#side-diagram'),
  tableTopView: document.querySelector('.table-top-view'),
  sidePlayerOne: document.querySelector('#side-player-one'),
  sidePlayerTwo: document.querySelector('#side-player-two'),
  sidePlayerOneName: document.querySelector('#side-player-one-name'),
  sidePlayerTwoName: document.querySelector('#side-player-two-name'),
  sideSwitchButton: document.querySelector('#side-switch-button'),
  serveChoice: document.querySelector('#serve-choice'),
  setupBack: document.querySelector('#setup-back'),
  setupSkip: document.querySelector('#setup-skip'),
  setupNext: document.querySelector('#setup-next'),
  scoreboard: document.querySelector('#scoreboard'),
  playersContainer: document.querySelector('#players'),
  serveSelection: document.querySelector('#serve-selection'),
  serveSelectionButtons: document.querySelector('#serve-selection-buttons'),
  matchFormat: document.querySelector('#match-format'),
  scores: [
    document.querySelector('#player-one-score'),
    document.querySelector('#player-two-score')
  ],
  sets: [
    document.querySelector('#player-one-sets'),
    document.querySelector('#player-two-sets')
  ],
  cards: [
    document.querySelector('#player-one-card'),
    document.querySelector('#player-two-card')
  ],
  labels: Array.from(document.querySelectorAll('.player-label-text')),
  serveDots: Array.from(document.querySelectorAll('.serve-dot')),
  matchStatus: document.querySelector('#match-status'),
  gameStatus: document.querySelector('#game-status'),
  matchControls: document.querySelector('.match-controls'),
  matchResetControls: document.querySelector('#match-reset-controls'),
  scoreboardSummary: document.querySelector('#scoreboard-summary'),
  scoreboardSummaryList: document.querySelector('#scoreboard-summary-list'),
  resetButton: document.querySelector('#reset-button'),
  newMatchButton: document.querySelector('#new-match-button'),
  backButton: document.querySelector('#back-button'),
  serveSwitchButton: document.querySelector('#serve-switch-button'),
  controlTooltips: Array.from(document.querySelectorAll('.control-with-tooltip')),
  gameSummaryOverlay: document.querySelector('#game-summary-overlay'),
  gameSummaryTitle: document.querySelector('#game-summary-title'),
  gameSummaryHeadline: document.querySelector('#game-summary-headline'),
  gameSummaryList: document.querySelector('#game-summary-list'),
  gameSummaryClose: document.querySelector('#game-summary-close'),
  gameSummaryContinue: document.querySelector('#game-summary-continue'),
  gameSummaryReset: document.querySelector('#game-summary-reset'),
  gameSummaryNewMatch: document.querySelector('#game-summary-new-match')
};

function getServingPlayer() {
  const totalPoints = state.scores[0] + state.scores[1];
  const isDeuce = state.scores[0] >= state.pointsToWin - 1 &&
    state.scores[1] >= state.pointsToWin - 1;
  const serveInterval = state.pointsToWin === 11 ? 2 : 5;

  if (isDeuce) {
    return (state.firstServer + totalPoints) % 2;
  }

  return (state.firstServer + Math.floor(totalPoints / serveInterval)) % 2;
}

function getGameWinner() {
  const scoreDifference = Math.abs(state.scores[0] - state.scores[1]);

  if (Math.max(...state.scores) >= state.pointsToWin && scoreDifference >= 2) {
    return state.scores[0] > state.scores[1] ? 0 : 1;
  }

  return null;
}

function hideGameSummary() {
  elements.gameSummaryOverlay.hidden = true;
}

function renderSummaryList(listElement) {
  listElement.replaceChildren(...state.summaries.map((summary) => {
    const summaryElement = document.createElement('p');
    summaryElement.className = 'set-summary';
    summaryElement.textContent =
      `Game ${summary.number}: ${state.players[summary.winner]} won ` +
      `${summary.scores[0]}–${summary.scores[1]}`;
    return summaryElement;
  }));
}

function updateScoreboardSummary() {
  renderSummaryList(elements.scoreboardSummaryList);
}

function showGameSummary() {
  const latest = state.summaries[state.summaries.length - 1];
  if (!latest) {
    hideGameSummary();
    return;
  }

  if (state.matchOver) {
    const matchWinner = state.sets[0] > state.sets[1] ? 0 : 1;
    elements.gameSummaryTitle.textContent = 'Match over';
    elements.gameSummaryHeadline.textContent =
      `${state.players[matchWinner]} wins the match`;
  } else {
    elements.gameSummaryTitle.textContent = `Game ${latest.number}`;
    elements.gameSummaryHeadline.textContent =
      `${state.players[latest.winner]} wins the game`;
  }

  renderSummaryList(elements.gameSummaryList);
  elements.gameSummaryClose.hidden = !state.matchOver;
  elements.gameSummaryContinue.hidden = state.matchOver;
  elements.gameSummaryReset.hidden = !state.matchOver;
  elements.gameSummaryNewMatch.hidden = !state.matchOver;
  elements.gameSummaryOverlay.hidden = false;
}

function closeGameSummary() {
  if (!state.matchOver) {
    return;
  }

  hideGameSummary();
}

function continueToNextGame() {
  if (state.matchOver || getGameWinner() === null) {
    return;
  }

  hideGameSummary();
  state.scores = [0, 0];
  state.gameNumber += 1;
  state.firstServer = state.firstServer === 0 ? 1 : 0;
  state.sides.reverse();
  renderedScores[0] = null;
  renderedScores[1] = null;
  render();
}

function render() {
  const servingPlayer = getServingPlayer();
  const winner = getGameWinner();
  const isDeuce = state.scores[0] >= state.pointsToWin - 1 &&
    state.scores[1] >= state.pointsToWin - 1 && !winner;

  elements.matchFormat.textContent = `Best of ${state.bestOf}`;
  elements.labels.forEach((element, index) => {
    element.textContent = state.players[index];
  });
  elements.scores.forEach((element, index) => {
    const value = state.scores[index];
    const formattedValue = String(value).padStart(2, '0');
    const previousValue = renderedScores[index] === null
      ? null
      : String(renderedScores[index]).padStart(2, '0');
    element.setAttribute('aria-label', formattedValue);
    element.querySelectorAll('.score-tile').forEach((tile, digitIndex) => {
      if (previousValue !== null && previousValue[digitIndex] !== formattedValue[digitIndex]) {
        tile.classList.remove('score-flip');
        void tile.offsetWidth;
        tile.classList.add('score-flip');
        window.setTimeout(() => {
          tile.classList.remove('score-flip');
        }, 500);
      }
      tile.querySelectorAll('.score-digit').forEach((digit) => {
        digit.textContent = formattedValue[digitIndex];
      });
    });
    renderedScores[index] = state.scores[index];
  });
  elements.sets.forEach((element, index) => {
    const value = state.sets[index];
    if (renderedSets[index] !== null && renderedSets[index] !== value) {
      element.classList.remove('score-flip');
      void element.offsetWidth;
      element.classList.add('score-flip');
      window.setTimeout(() => element.classList.remove('score-flip'), 500);
    }
    element.setAttribute('aria-label', `${state.players[index]} sets won ${value}`);
    element.querySelectorAll('.set-digit').forEach((digit) => {
      digit.textContent = value;
    });
    renderedSets[index] = value;
  });
  elements.cards.forEach((element, index) => {
    element.style.order = state.sides[index];
    element.classList.toggle('side-left', state.sides[index] === 0);
    element.classList.toggle('side-right', state.sides[index] === 1);
    element.setAttribute('aria-label', `${state.players[index]} score ${String(state.scores[index]).padStart(2, '0')}`);
    elements.scores[index].disabled = state.matchOver || winner !== null;
  });
  elements.serveDots.forEach((element, index) => {
    element.classList.toggle('active', index === servingPlayer && !state.matchOver);
    element.setAttribute('aria-hidden', index !== servingPlayer || state.matchOver);
  });
  elements.backButton.disabled = history.length === 0;
  elements.serveSwitchButton.disabled = state.matchOver;
  updateScoreboardSummary();

  if (winner !== null || state.matchOver) {
    showGameSummary();
    elements.matchResetControls.hidden = winner !== null && !state.matchOver;
  } else {
    hideGameSummary();
    elements.matchResetControls.hidden = false;
  }

  if (state.matchOver) {
    const winnerIndex = state.sets[0] > state.sets[1] ? 0 : 1;
    elements.matchStatus.textContent = `${state.players[winnerIndex]} wins the match`;
    elements.gameStatus.textContent = 'Start a new match to play again';
  } else if (winner !== null) {
    elements.matchStatus.textContent = `Game ${state.gameNumber}`;
    elements.gameStatus.textContent = `${state.players[winner]} wins the game`;
  } else {
    elements.matchStatus.textContent = `Game ${state.gameNumber}`;
    elements.gameStatus.textContent = isDeuce
      ? 'Deuce: serve alternates every point, win by 2'
      : `First to ${state.pointsToWin} points, win by 2`;
  }
}

function saveState() {
  history.push({
    players: [...state.players],
    pointsToWin: state.pointsToWin,
    bestOf: state.bestOf,
    scores: [...state.scores],
    sets: [...state.sets],
    gameNumber: state.gameNumber,
    firstServer: state.firstServer,
    sides: [...state.sides],
    matchOver: state.matchOver,
    summaries: state.summaries.map((summary) => ({
      number: summary.number,
      scores: [...summary.scores],
      winner: summary.winner
    }))
  });
}

function awardPoint(playerIndex) {
  if (state.matchOver || getGameWinner() !== null) {
    return;
  }

  saveState();
  state.scores[playerIndex] += 1;
  const winner = getGameWinner();

  if (winner !== null) {
    state.summaries.push({
      number: state.gameNumber,
      scores: [...state.scores],
      winner
    });
    state.sets[winner] += 1;
    if (state.sets[winner] >= Math.ceil(state.bestOf / 2)) {
      state.matchOver = true;
    }
  }

  render();
}

function switchFirstServer() {
  state.firstServer = state.firstServer === 0 ? 1 : 0;
  history.forEach((entry) => {
    if (!entry.type && entry.gameNumber === state.gameNumber) {
      entry.firstServer = state.firstServer;
    }
  });
  render();
}

function updateSideDiagramLayout() {
  const portraitMobile = isMobileDevice() && !isLandscapeOrientation();
  elements.sideDiagram.classList.toggle('side-diagram-portrait', portraitMobile);
  elements.tableTopView.setAttribute(
    'aria-label',
    portraitMobile ? 'Left and right sides' : 'Top view of a ping pong table'
  );
}

function showSetupStep() {
  const labels = [
    "Player 1's name",
    "Player 2's name",
    `${setup.players[0] || 'Player 1'}'s side`,
    'Game points',
    'Match format'
  ];
  const mobileDevice = isMobileDevice();
  const orientationStep = mobileDevice && setup.step === 0;
  const configStep = mobileDevice ? setup.step - 1 : setup.step;
  const setupStepCount = labels.length + (mobileDevice ? 1 : 0);
  elements.setupStepLabel.textContent = `Step ${setup.step + 1} of ${setupStepCount}`;
  elements.setupInputLabel.textContent = labels[configStep];
  elements.setupInput.setAttribute('aria-label', labels[configStep]);
  elements.setupInput.placeholder = configStep === 0 ? 'Bob' : 'Alice';
  elements.setupInput.value = configStep >= 0 && configStep < 2 && setup.visitedPlayers[configStep]
    ? setup.players[configStep]
    : '';
  elements.setupInput.hidden = orientationStep || configStep > 1;
  elements.setupInputLabel.hidden = orientationStep;
  elements.setupOptions.hidden = configStep < 3 || configStep > 4;
  elements.orientationPrompt.hidden = !orientationStep;
  elements.sideDiagram.hidden = configStep !== 2;
  elements.sideSwitchButton.hidden = configStep !== 2;
  elements.serveChoice.hidden = true;
  elements.setupNext.hidden = orientationStep;
  elements.setupSkip.hidden = true;
  elements.setupBack.hidden = setup.step === 0;

  if (orientationStep) {
    elements.setupSkip.hidden = false;
  } else if (configStep === 2) {
    elements.setupInputLabel.textContent = 'Choose player sides';
    elements.sidePlayerOneName.textContent = setup.players[0];
    elements.sidePlayerTwoName.textContent = setup.players[1];
    elements.sidePlayerOne.style.gridColumn = setup.playerOneSide === 0 ? '1 / 2' : '3 / 4';
    elements.sidePlayerTwo.style.gridColumn = setup.playerOneSide === 0 ? '3 / 4' : '1 / 2';
    updateSideDiagramLayout();
  } else if (configStep === 3) {
    renderSetupOptions([
      ['11', '11 points'],
      ['21', '21 points']
    ], setup.pointsToWin);
  } else if (configStep === 4) {
    renderSetupOptions([
      ['3', 'Best of 3'],
      ['5', 'Best of 5'],
      ['7', 'Best of 7']
    ], setup.bestOf || 3);
  } else {
    elements.setupOptions.replaceChildren();
  }

  elements.setupNext.disabled = orientationStep || configStep > 1
    ? (configStep === 2 ? false : !elements.setupOptions.querySelector('[aria-pressed="true"]'))
    : false;
}

function renderSetupOptions(options, selectedValue) {
  elements.setupOptions.replaceChildren(...options.map(([value, label]) => {
    const button = document.createElement('button');
    button.className = 'setup-option';
    button.type = 'button';
    button.textContent = label;
    button.dataset.value = value;
    button.setAttribute('aria-pressed', String(String(selectedValue) === value));
    return button;
  }));
}

function switchSetupSides() {
  setup.playerOneSide = setup.playerOneSide === 0 ? 1 : 0;
  showSetupStep();
}

function goToPreviousSetupStep() {
  if (setup.step === 0) {
    return;
  }

  setup.step -= 1;
  showSetupStep();
}

function showServeSelection() {
  elements.setupPage.hidden = true;
  elements.scoreboard.hidden = false;
  elements.playersContainer.hidden = true;
  elements.serveSelection.hidden = false;
  elements.gameStatus.hidden = true;
  elements.backButton.hidden = true;
  elements.serveSwitchButton.hidden = true;
  elements.controlTooltips.forEach((tooltip) => {
    tooltip.setAttribute('hidden', '');
  });
  elements.matchControls.hidden = true;
  elements.matchFormat.textContent = `Best of ${setup.bestOf}`;
  elements.matchStatus.textContent = 'Choose the first server';
  elements.serveSelectionButtons.replaceChildren();

  setup.players.forEach((player, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${player} serves first`;
    button.addEventListener('click', () => startMatch(index));
    elements.serveSelectionButtons.append(button);
  });
}

function completeOrientationStep() {
  if (!isMobileDevice() || setup.step !== 0) {
    return;
  }

  setup.step = 1;
  showSetupStep();
}

function handleOrientationChange() {
  if (isMobileDevice() && isLandscapeOrientation()) {
    completeOrientationStep();
  }
  updateSideDiagramLayout();
}

function isLandscapeOrientation() {
  return window.innerWidth > window.innerHeight ||
    window.matchMedia('(orientation: landscape)').matches;
}

function startMatch(firstServer) {
  state.players = [...setup.players];
  state.pointsToWin = setup.pointsToWin;
  state.bestOf = setup.bestOf;
  state.scores = [0, 0];
  state.sets = [0, 0];
  state.gameNumber = 1;
  state.firstServer = firstServer;
  state.sides = [setup.playerOneSide, setup.playerOneSide === 0 ? 1 : 0];
  state.matchOver = false;
  state.summaries = [];
  elements.playersContainer.hidden = false;
  elements.serveSelection.hidden = true;
  elements.gameStatus.hidden = false;
  elements.backButton.hidden = false;
  elements.serveSwitchButton.hidden = false;
  elements.controlTooltips.forEach((tooltip) => {
    tooltip.removeAttribute('hidden');
  });
  elements.matchControls.hidden = false;
  render();
}

function resetMatch() {
  state.scores = [0, 0];
  state.sets = [0, 0];
  state.gameNumber = 1;
  state.firstServer = 0;
  state.sides = [setup.playerOneSide, setup.playerOneSide === 0 ? 1 : 0];
  state.matchOver = false;
  state.summaries = [];
  history.length = 0;
  hideGameSummary();
  showServeSelection();
}

function startNewMatch() {
  hideGameSummary();
  elements.scoreboard.hidden = true;
  elements.setupPage.hidden = false;
  setup.step = 0;
  setup.players = ['Bob', 'Alice'];
  setup.visitedPlayers = [false, false];
  setup.playerOneSide = 0;
  setup.pointsToWin = 21;
  setup.bestOf = 3;
  history.length = 0;
  if (isMobileDevice() && isLandscapeOrientation()) {
    completeOrientationStep();
  } else {
    showSetupStep();
  }
}

function undoLastPoint() {
  const previousState = history.pop();
  if (!previousState) {
    return;
  }

  Object.assign(state, previousState);
  render();
}

elements.scores.forEach((score, index) => {
  score.addEventListener('click', () => awardPoint(index));
  score.addEventListener('dblclick', (event) => event.preventDefault());
});
elements.setupNext.addEventListener('click', () => {
  if (isMobileDevice() && setup.step === 0) {
    return;
  }

  const configStep = isMobileDevice() ? setup.step - 1 : setup.step;
  const selectedOption = elements.setupOptions.querySelector('[aria-pressed="true"]');
  const value = configStep === 2
    ? 'side-selected'
    : elements.setupOptions.hidden
    ? elements.setupInput.value.trim()
    : selectedOption && selectedOption.dataset.value;
  if (!value && configStep > 1) {
    elements.setupInput.focus();
    return;
  }

  if (configStep < 2) {
    setup.players[configStep] = value || (configStep === 0 ? 'Bob' : 'Alice');
    setup.visitedPlayers[configStep] = true;
  } else if (configStep === 3) {
    setup.pointsToWin = Number(value);
  } else if (configStep === 4) {
    setup.bestOf = Number(value);
  }
  setup.step += 1;
  elements.setupInput.value = '';
  const finalConfigStep = isMobileDevice() ? 6 : 5;
  if (setup.step === finalConfigStep) {
    showServeSelection();
  } else {
    showSetupStep();
  }
});
elements.setupBack.addEventListener('click', goToPreviousSetupStep);
elements.setupSkip.addEventListener('click', completeOrientationStep);
elements.setupInput.addEventListener('input', () => {
  elements.setupNext.disabled = false;
});
elements.setupInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !elements.setupNext.disabled) {
    event.preventDefault();
    elements.setupNext.click();
  }
});
elements.setupOptions.addEventListener('click', (event) => {
  const option = event.target.closest('.setup-option');
  if (!option) {
    return;
  }

  const configStep = isMobileDevice() ? setup.step - 1 : setup.step;
  elements.setupOptions.querySelectorAll('.setup-option').forEach((button) => {
    button.setAttribute('aria-pressed', String(button === option));
  });
  if (configStep === 3) {
    setup.pointsToWin = Number(option.dataset.value);
  } else if (configStep === 4) {
    setup.bestOf = Number(option.dataset.value);
  }
  elements.setupNext.disabled = false;
});
elements.sideSwitchButton.addEventListener('click', switchSetupSides);
window.addEventListener('orientationchange', handleOrientationChange);
window.addEventListener('resize', handleOrientationChange);
screen.orientation?.addEventListener('change', handleOrientationChange);
elements.resetButton.addEventListener('click', resetMatch);
elements.newMatchButton.addEventListener('click', startNewMatch);
elements.gameSummaryReset.addEventListener('click', resetMatch);
elements.gameSummaryNewMatch.addEventListener('click', startNewMatch);
elements.gameSummaryClose.addEventListener('click', closeGameSummary);
elements.gameSummaryContinue.addEventListener('click', continueToNextGame);
elements.backButton.addEventListener('click', undoLastPoint);
elements.serveSwitchButton.addEventListener('click', switchFirstServer);

showSetupStep();
