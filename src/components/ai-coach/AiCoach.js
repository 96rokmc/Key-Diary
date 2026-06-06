import './ai-coach.css';
import { UI_TEXT } from '../../constants/ui-text.js';
import { getApiKey, saveApiKey, generatePracticeReview } from '../../services/ai.service.js';

/**
 * AI 연습 코치 화면.
 * 노트 저장 후 표시 — API 키 입력, 리뷰 생성, 결과 표시를 담당.
 *
 * @param {{ session: { duration: number, note: object | null }, onComplete: () => void }} props
 * @returns {HTMLElement}
 */
export function AiCoach({ session, onComplete }) {
  const el = document.createElement('div');
  el.className = 'ai-coach animate-fade-in';

  let apiKey  = getApiKey();
  let review  = null;
  let loading = false;
  let error   = null;

  function render() {
    const mins = Math.round((session.duration ?? 0) / 60);

    el.innerHTML = `
      <div class="ac-header">
        <h2 class="ac-title">${UI_TEXT.AI_COACH_TITLE}</h2>
        <p class="ac-subtitle">${UI_TEXT.AI_COACH_SUBTITLE}</p>
      </div>

      ${!apiKey                              ? renderKeyInput()    : ''}
      ${apiKey && !review && !loading && !error ? renderCTA(mins) : ''}
      ${loading                              ? renderLoading()     : ''}
      ${error                                ? renderError()       : ''}
      ${review                               ? renderReview()      : ''}

      ${!review ? `<button class="ac-skip-btn" id="ac-skip">${UI_TEXT.AI_COACH_SKIP}</button>` : ''}
    `;

    el.querySelector('#ac-key-form')?.addEventListener('submit', handleKeySubmit);
    el.querySelector('#ac-generate')?.addEventListener('click', handleGenerate);
    el.querySelector('#ac-retry')?.addEventListener('click', handleGenerate);
    el.querySelector('#ac-skip')?.addEventListener('click', onComplete);
    el.querySelector('#ac-done')?.addEventListener('click', onComplete);
  }

  function renderKeyInput() {
    return `
      <div class="ac-card">
        <p class="ac-card-desc">${UI_TEXT.AI_COACH_KEY_DESC}</p>
        <form class="ac-key-form" id="ac-key-form">
          <input type="password" class="ac-key-input" id="ac-key-input"
                 placeholder="${UI_TEXT.AI_COACH_KEY_PLACEHOLDER}"
                 autocomplete="off" aria-label="Anthropic API 키" required />
          <button type="submit" class="ac-key-save-btn">${UI_TEXT.AI_COACH_KEY_SAVE}</button>
        </form>
      </div>
    `;
  }

  function renderCTA(mins) {
    const desc = UI_TEXT.AI_COACH_CTA_DESC(mins).replace('\n', '<br>');
    return `
      <div class="ac-card ac-card--cta">
        <p class="ac-card-desc">${desc}</p>
        <button class="ac-generate-btn" id="ac-generate">
          <span class="ac-generate-icon" aria-hidden="true">✦</span>
          ${UI_TEXT.AI_COACH_GENERATE}
        </button>
      </div>
    `;
  }

  function renderLoading() {
    return `
      <div class="ac-loading" aria-live="polite" aria-label="${UI_TEXT.AI_COACH_LOADING}">
        <div class="ac-spinner"></div>
        <p class="ac-loading-text">${UI_TEXT.AI_COACH_LOADING}</p>
      </div>
    `;
  }

  function renderError() {
    return `
      <div class="ac-error-card" role="alert">
        <p class="ac-error-msg">${error}</p>
        <button class="ac-retry-btn" id="ac-retry">${UI_TEXT.AI_COACH_RETRY}</button>
      </div>
    `;
  }

  function renderReview() {
    // 마크다운 **bold**·- bullet → HTML 변환
    const html = review
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[^<]*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
      .split('\n')
      .filter(Boolean)
      .map((line) => (line.startsWith('<') ? line : `<p>${line}</p>`))
      .join('');

    return `
      <div class="ac-review-card">
        <div class="ac-review-body">${html}</div>
      </div>
      <button class="ac-done-btn" id="ac-done">${UI_TEXT.AI_COACH_DONE}</button>
    `;
  }

  async function handleKeySubmit(e) {
    e.preventDefault();
    const val = el.querySelector('#ac-key-input')?.value?.trim();
    if (!val) return;
    saveApiKey(val);
    apiKey = val;
    render();
  }

  async function handleGenerate() {
    loading = true;
    error   = null;
    render();

    const result = await generatePracticeReview(session);
    loading = false;

    if (result.success) {
      review = result.review;
    } else {
      error = result.error === 'no_key'
        ? UI_TEXT.AI_COACH_ERROR_NO_KEY
        : `${UI_TEXT.AI_COACH_ERROR_PREFIX}${result.error}`;
    }
    render();
  }

  render();
  return el;
}
