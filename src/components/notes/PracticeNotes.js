import './notes.css';
import { UI_TEXT } from '../../constants/ui-text.js';
import { updateSession } from '../../services/storage.service.js';
import { showToast } from '../../services/toast.service.js';

/**
 * 연습 종료 후 노트 작성 화면.
 *
 * @param {{
 *   sessionId: string | null,
 *   duration: number,
 *   onSave: () => void,
 *   onSkip: () => void,
 * }} props
 * @returns {HTMLElement}
 */
export function PracticeNotes({ sessionId, duration, onSave, onSkip }) {
  let rating = 0;

  const minutes = Math.round(duration / 60);
  const durationLabel = minutes > 0 ? `${minutes}분 연습 완료` : '연습 완료';

  const el = document.createElement('div');
  el.className = 'practice-notes animate-fade-in';

  el.innerHTML = `
    <div class="notes-header">
      <h2 class="notes-header__title">${UI_TEXT.NOTES_TITLE}</h2>
      <p class="notes-header__duration">${durationLabel}</p>
    </div>

    <div class="notes-card">
      <span class="notes-label">${UI_TEXT.NOTES_RATING_LABEL}</span>
      <div class="star-rating" role="radiogroup" aria-label="오늘 연습 별점">
        ${[1, 2, 3, 4, 5]
          .map(
            (n) => `
          <button class="star-btn" data-value="${n}"
                  role="radio" aria-checked="false"
                  aria-label="${n}점">★</button>
        `,
          )
          .join('')}
      </div>
    </div>

    <div class="notes-card">
      <label class="notes-label" for="notes-well-done">
        ${UI_TEXT.NOTES_WELL_DONE_LABEL}
      </label>
      <textarea
        id="notes-well-done"
        class="notes-textarea"
        placeholder="${UI_TEXT.NOTES_WELL_DONE_PLACEHOLDER}"
        rows="2"
        maxlength="200"
      ></textarea>
    </div>

    <div class="notes-card">
      <label class="notes-label" for="notes-tomorrow">
        ${UI_TEXT.NOTES_TOMORROW_LABEL}
      </label>
      <textarea
        id="notes-tomorrow"
        class="notes-textarea"
        placeholder="${UI_TEXT.NOTES_TOMORROW_PLACEHOLDER}"
        rows="2"
        maxlength="200"
      ></textarea>
    </div>

    <div class="notes-actions">
      <button class="notes-btn notes-btn--skip">${UI_TEXT.NOTES_SKIP}</button>
      <button class="notes-btn notes-btn--save">${UI_TEXT.NOTES_SAVE}</button>
    </div>
  `;

  // ── 별점 인터랙션 ──────────────────────────────────────
  const starBtns = el.querySelectorAll('.star-btn');

  function updateStars(selected) {
    rating = selected;
    starBtns.forEach((btn) => {
      const val = Number(btn.dataset.value);
      const active = val <= selected;
      btn.classList.toggle('star-btn--active', active);
      btn.setAttribute('aria-checked', String(active));
    });
  }

  starBtns.forEach((btn) => {
    btn.addEventListener('click', () => updateStars(Number(btn.dataset.value)));

    // 호버 미리보기
    btn.addEventListener('mouseenter', () => {
      starBtns.forEach((b) =>
        b.classList.toggle('star-btn--active', Number(b.dataset.value) <= Number(btn.dataset.value)),
      );
    });
  });

  el.querySelector('.star-rating').addEventListener('mouseleave', () => {
    updateStars(rating);
  });

  // ── 저장 ──────────────────────────────────────────────
  el.querySelector('.notes-btn--save').addEventListener('click', async () => {
    const saveBtn = el.querySelector('.notes-btn--save');
    saveBtn.disabled = true;

    const note = {
      rating,
      wellDone: el.querySelector('#notes-well-done').value.trim(),
      tomorrow: el.querySelector('#notes-tomorrow').value.trim(),
    };

    if (sessionId) {
      await updateSession(sessionId, { note });
    }

    showToast({
      icon: '📝',
      title: UI_TEXT.NOTES_SAVED_TITLE,
      message: UI_TEXT.NOTES_SAVED_MESSAGE,
      duration: 3000,
    });

    onSave();
  });

  // ── 건너뛰기 ───────────────────────────────────────────
  el.querySelector('.notes-btn--skip').addEventListener('click', onSkip);

  return el;
}
