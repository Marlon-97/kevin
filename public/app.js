const titleElement = document.getElementById('poll-title');
const descriptionElement = document.getElementById('poll-description');
const voteForm = document.getElementById('vote-form');
const submitButton = document.getElementById('submit-button');
const statusMessage = document.getElementById('status-message');
const selectedRatingElement = document.getElementById('selected-rating');
const averageRatingElement = document.getElementById('average-rating');
const commentField = document.getElementById('chef-comment');
const commentsListElement = document.getElementById('comments-list');

let selectedOptionId = null;
let hoverOptionId = null;
let pollId = null;

function getBeerScale(option, className) {
  const beers = Number(option.beers || 0);
  return Array.from({ length: beers }, () => `<img class="${className}" src="/assets/beer-mug.svg" alt="" aria-hidden="true" />`).join('');
}

function getBeerText(beers) {
  return `${beers} Bier`;
}

function renderComments(comments) {
  if (!comments.length) {
    commentsListElement.innerHTML = '<p class="comment-empty">Noch keine Kommentare.</p>';
    return;
  }

  commentsListElement.innerHTML = comments
    .map(
      (comment) => `
        <article class="comment-item">
          <div class="comment-meta">${getBeerText(comment.beers)}</div>
          <p class="comment-text">${comment.text}</p>
        </article>
      `
    )
    .join('');
}

function getStorageKey(suffix) {
  return pollId ? `kevin-poll-${pollId}-${suffix}` : `kevin-poll-${suffix}`;
}

function getVoterToken() {
  const storageKey = getStorageKey('voter-token');
  let token = window.localStorage.getItem(storageKey);
  if (!token) {
    token = window.crypto.randomUUID();
    window.localStorage.setItem(storageKey, token);
  }
  return token;
}

function hasAlreadyVoted() {
  return window.localStorage.getItem(getStorageKey('has-voted')) === 'true';
}

function setVotedState() {
  window.localStorage.setItem(getStorageKey('has-voted'), 'true');
  if (selectedOptionId) {
    window.localStorage.setItem(getStorageKey('selected-option'), selectedOptionId);
  }
  submitButton.disabled = true;
  commentField.disabled = true;
  for (const tile of voteForm.querySelectorAll('.beer-choice')) {
    tile.setAttribute('disabled', 'disabled');
  }
}

function restoreSavedSelection(options) {
  const savedOptionId = window.localStorage.getItem(getStorageKey('selected-option'));
  if (savedOptionId && options.some((option) => option.id === savedOptionId)) {
    selectedOptionId = savedOptionId;
  }
}

function setStatus(message, state = '') {
  statusMessage.textContent = message;
  if (state) {
    statusMessage.dataset.state = state;
  } else {
    delete statusMessage.dataset.state;
  }
}

function renderSelectedRating(options) {
  const activeOptionId = hoverOptionId || selectedOptionId;
  const selectedOption = options.find((option) => option.id === activeOptionId);

  if (!selectedOption) {
    selectedRatingElement.textContent = 'Noch keine Auswahl';
    for (const tile of voteForm.querySelectorAll('.beer-choice')) {
      tile.classList.remove('is-active', 'is-current');
    }
    return;
  }

  selectedRatingElement.textContent = `${getBeerText(Number(selectedOption.beers || 0))} für das Curry`;

  const activeBeers = Number(selectedOption.beers || 0);
  for (const tile of voteForm.querySelectorAll('.beer-choice')) {
    const beers = Number(tile.dataset.beers || 0);
    tile.classList.toggle('is-active', beers <= activeBeers);
    tile.classList.toggle('is-current', beers === activeBeers);
  }
}

function renderPoll(data) {
  pollId = data.pollId;
  restoreSavedSelection(data.options);

  titleElement.textContent = data.title;
  descriptionElement.textContent = data.description;
  averageRatingElement.textContent = `${Number(data.averageBeers || 0).toFixed(1)} Bier`;
  renderComments(data.comments || []);

  voteForm.innerHTML = data.options
    .sort((left, right) => Number(left.beers || 0) - Number(right.beers || 0))
    .map(
      (option) => `
        <button
          type="button"
          class="beer-choice ${selectedOptionId === option.id ? 'is-current' : ''}"
          data-option-id="${option.id}"
          data-beers="${option.beers}"
          role="radio"
          aria-checked="${selectedOptionId === option.id ? 'true' : 'false'}"
          ${hasAlreadyVoted() ? 'disabled' : ''}
        >
          <img class="beer-choice-icon" src="/assets/beer-mug.svg" alt="" aria-hidden="true" />
          <span class="beer-choice-label">${option.label}</span>
        </button>
      `
    )
    .join('');

  renderSelectedRating(data.options);

  if (hasAlreadyVoted()) {
    submitButton.disabled = true;
    commentField.disabled = true;
  }
}

async function loadPoll() {
  setStatus('Lade Abstimmung...');
  const response = await fetch('/api/poll');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.details || data.message || 'Abstimmung konnte nicht geladen werden.');
  }

  renderPoll(data);
  if (hasAlreadyVoted()) {
    setStatus('Du hast das Curry schon bewertet.', 'success');
  } else {
    setStatus('Wähle deine Bierwertung aus.');
  }
}

async function submitVote() {
  if (hasAlreadyVoted()) {
    setStatus('Du hast das Curry schon bewertet.', 'error');
    submitButton.disabled = true;
    commentField.disabled = true;
    return;
  }

  if (!selectedOptionId) {
    setStatus('Bitte zuerst eine Option auswählen.', 'error');
    return;
  }

  submitButton.disabled = true;
  commentField.disabled = true;
  setStatus('Bewertung wird abgeschickt...');

  try {
    const response = await fetch('/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        optionId: selectedOptionId,
        voterToken: getVoterToken(),
        comment: commentField.value
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.details || data.message || 'Stimme konnte nicht gespeichert werden.');
    }

    setVotedState();
    renderPoll(data);
    setStatus('Deine Bewertung ist drin.', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
    commentField.disabled = false;
  } finally {
    submitButton.disabled = hasAlreadyVoted();
  }
}

voteForm.addEventListener('click', (event) => {
  const target = event.target instanceof HTMLElement ? event.target.closest('.beer-choice') : null;
  if (!(target instanceof HTMLElement) || hasAlreadyVoted()) {
    return;
  }

  selectedOptionId = target.dataset.optionId;
  hoverOptionId = null;

  for (const tile of voteForm.querySelectorAll('.beer-choice')) {
    tile.setAttribute('aria-checked', tile === target ? 'true' : 'false');
  }

  const optionElements = Array.from(voteForm.querySelectorAll('.beer-choice'));
  renderSelectedRating(optionElements.map((element) => ({
    id: element.dataset.optionId,
    beers: Number(element.dataset.beers || 0)
  })));
  setStatus('Ausgewählt.');
});

voteForm.addEventListener('pointerover', (event) => {
  const target = event.target instanceof HTMLElement ? event.target.closest('.beer-choice') : null;
  if (!(target instanceof HTMLElement) || hasAlreadyVoted()) {
    return;
  }

  hoverOptionId = target.dataset.optionId;
  const optionElements = Array.from(voteForm.querySelectorAll('.beer-choice'));
  renderSelectedRating(optionElements.map((element) => ({
    id: element.dataset.optionId,
    beers: Number(element.dataset.beers || 0)
  })));
});

voteForm.addEventListener('pointerleave', () => {
  hoverOptionId = null;
  const optionElements = Array.from(voteForm.querySelectorAll('.beer-choice'));
  renderSelectedRating(optionElements.map((element) => ({
    id: element.dataset.optionId,
    beers: Number(element.dataset.beers || 0)
  })));
});

submitButton.addEventListener('click', () => {
  void submitVote();
});

void loadPoll().catch((error) => {
  setStatus(error.message, 'error');
});
