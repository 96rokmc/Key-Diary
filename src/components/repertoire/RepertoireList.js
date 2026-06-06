import './repertoire.css';
import {
  getAllRepertoire,
  upsertRepertoire,
  deleteRepertoire,
} from '../../services/storage.service.js';
import { DEFAULT_REPERTOIRE } from '../../constants/repertoire.js';
import { today } from '../../utils/date.utils.js';
import { showToast } from '../../services/toast.service.js';

const STATUS_LABELS = {
  goal:        '목표곡',
  in_progress: '진행 중',
  completed:   '완료',
};

/** 현재 BPM 기준으로 버전 해금 여부 재계산 */
function computeVersionUnlocks(piece) {
  return piece.versions.map((v, i) => ({
    ...v,
    unlocked:
      i === 0 ? true
      : i === 1 ? piece.currentBpm >= Math.floor(piece.targetBpm * 0.6)
      : piece.currentBpm >= Math.floor(piece.targetBpm * 0.85),
  }));
}

/**
 * 레퍼토리 관리 화면.
 * IndexedDB `repertoire` 스토어에서 데이터를 읽고 CRUD를 처리한다.
 *
 * @returns {HTMLElement}
 */
export function RepertoireList() {
  let pieces      = [];
  let expandedId  = null;
  let showAddForm = false;

  const el = document.createElement('div');
  el.className = 'repertoire-list';

  async function init() {
    pieces = await getAllRepertoire();

    // 최초 실행 시 기본 레퍼토리 시드
    if (pieces.length === 0) {
      const now = today();
      for (const p of DEFAULT_REPERTOIRE) {
        await upsertRepertoire({ ...p, startedAt: now, completedAt: null });
      }
      pieces = await getAllRepertoire();
    }

    render();
  }

  // ── 렌더 ──────────────────────────────────────────────
  function render() {
    el.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'rep-header';
    header.innerHTML = `
      <h2 class="rep-header__title">레퍼토리</h2>
      <button class="rep-add-btn"
              aria-label="${showAddForm ? '추가 폼 닫기' : '새 곡 추가'}"
              aria-expanded="${showAddForm}">
        ${showAddForm ? '✕' : '+'}
      </button>
    `;
    header.querySelector('.rep-add-btn').addEventListener('click', () => {
      showAddForm = !showAddForm;
      render();
    });
    el.appendChild(header);

    if (showAddForm) el.appendChild(renderAddForm());

    if (pieces.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'rep-empty';
      empty.textContent = '+ 버튼으로 첫 번째 곡을 추가해보세요';
      el.appendChild(empty);
      return;
    }

    pieces.forEach((piece) => el.appendChild(renderPieceCard(piece)));
  }

  // ── 추가 폼 ───────────────────────────────────────────
  function renderAddForm() {
    const form = document.createElement('div');
    form.className = 'rep-form';
    form.innerHTML = `
      <h3 class="rep-form__title">새 곡 추가</h3>
      <div class="rep-form__row">
        <label class="rep-form__label" for="rf-title">곡 제목 *</label>
        <input class="rep-form__input" id="rf-title" type="text"
               placeholder="예: 엘리제를 위하여" maxlength="60" />
      </div>
      <div class="rep-form__row">
        <label class="rep-form__label" for="rf-composer">작곡가</label>
        <input class="rep-form__input" id="rf-composer" type="text"
               placeholder="예: 베토벤" maxlength="40" />
      </div>
      <div class="rep-form__row rep-form__row--half">
        <div>
          <label class="rep-form__label" for="rf-bpm">목표 BPM</label>
          <input class="rep-form__input" id="rf-bpm" type="number" min="20" max="300" value="80" />
        </div>
        <div>
          <label class="rep-form__label" for="rf-measures">전체 마디</label>
          <input class="rep-form__input" id="rf-measures" type="number" min="1" max="9999" value="32" />
        </div>
      </div>
      <div class="rep-form__actions">
        <button class="rep-form__cancel">취소</button>
        <button class="rep-form__submit">추가하기</button>
      </div>
    `;

    // 포커스
    setTimeout(() => form.querySelector('#rf-title')?.focus(), 50);

    form.querySelector('.rep-form__cancel').addEventListener('click', () => {
      showAddForm = false;
      render();
    });

    form.querySelector('.rep-form__submit').addEventListener('click', async () => {
      const titleInput = form.querySelector('#rf-title');
      const title = titleInput.value.trim();
      if (!title) { titleInput.focus(); return; }

      const composer     = form.querySelector('#rf-composer').value.trim() || '—';
      const targetBpm    = Math.max(20, Math.min(300, Number(form.querySelector('#rf-bpm').value) || 80));
      const totalMeasures = Math.max(1, Number(form.querySelector('#rf-measures').value) || 32);

      const newPiece = {
        id:              `piece_${Date.now()}`,
        title,
        composer,
        status:          'goal',
        difficulty:      3,
        targetBpm,
        currentBpm:      Math.floor(targetBpm * 0.5),
        totalMeasures,
        learnedMeasures: 0,
        versions:        [{ level: 1, label: '기본', unlocked: true }],
        notes:           [],
        startedAt:       today(),
        completedAt:     null,
      };

      await upsertRepertoire(newPiece);
      pieces = await getAllRepertoire();
      showAddForm = false;
      showToast({
        icon:    '🎵',
        title:   '곡 추가!',
        message: `${title}이(가) 레퍼토리에 추가됐습니다.`,
        duration: 3000,
      });
      render();
    });

    return form;
  }

  // ── 개별 카드 ─────────────────────────────────────────
  function renderPieceCard(piece) {
    const isExpanded  = expandedId === piece.id;
    const versions    = computeVersionUnlocks(piece);
    const progressPct = piece.totalMeasures > 0
      ? Math.round((piece.learnedMeasures / piece.totalMeasures) * 100)
      : 0;
    const bpmPct = piece.targetBpm > 0
      ? Math.min(100, Math.round((piece.currentBpm / piece.targetBpm) * 100))
      : 0;

    const card = document.createElement('div');
    card.className = `rep-card${isExpanded ? ' rep-card--expanded' : ''}`;

    card.innerHTML = `
      <div class="rep-card__header"
           role="button" tabindex="0"
           aria-expanded="${isExpanded}"
           aria-controls="rep-body-${piece.id}"
           aria-label="${piece.title} 상세 ${isExpanded ? '접기' : '펼치기'}">
        <div class="rep-card__title-row">
          <span class="rep-card__title">${piece.title}</span>
          <span class="rep-status rep-status--${piece.status}">
            ${STATUS_LABELS[piece.status] ?? piece.status}
          </span>
        </div>
        <span class="rep-card__composer">${piece.composer}</span>
        <div class="rep-card__progress-row">
          <div class="rep-progress"
               role="progressbar"
               aria-valuenow="${piece.learnedMeasures}"
               aria-valuemin="0"
               aria-valuemax="${piece.totalMeasures}"
               aria-label="학습 마디 진행도">
            <div class="rep-progress__bar" style="width:${progressPct}%"></div>
          </div>
          <span class="rep-progress__label">${piece.learnedMeasures}/${piece.totalMeasures} 마디</span>
        </div>
        <div class="rep-card__bpm-row">
          <span class="rep-bpm">
            ${piece.currentBpm} <span class="rep-bpm__arrow">→</span> ${piece.targetBpm} BPM
          </span>
          <div class="rep-versions" aria-label="버전 해금 현황">
            ${versions.map((v) => `
              <span class="rep-version${v.unlocked ? ' rep-version--unlocked' : ''}"
                    title="${v.label} ${v.unlocked ? '(해금)' : '(잠금)'}">
                ${v.level}
              </span>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="rep-card__body" id="rep-body-${piece.id}" ${isExpanded ? '' : 'hidden'}>
        <div class="rep-edit">
          <div class="rep-edit__row">
            <label class="rep-edit__label" for="re-bpm-${piece.id}">현재 BPM</label>
            <input class="rep-edit__input" id="re-bpm-${piece.id}"
                   type="number" min="20" max="300" value="${piece.currentBpm}" />
            <span class="rep-edit__hint">/ ${piece.targetBpm}</span>
          </div>
          <div class="rep-edit__bpm-bar" aria-hidden="true">
            <div class="rep-edit__bpm-fill" style="width:${bpmPct}%"></div>
          </div>
          <div class="rep-edit__row">
            <label class="rep-edit__label" for="re-measures-${piece.id}">학습 마디</label>
            <input class="rep-edit__input" id="re-measures-${piece.id}"
                   type="number" min="0" max="${piece.totalMeasures}"
                   value="${piece.learnedMeasures}" />
            <span class="rep-edit__hint">/ ${piece.totalMeasures}</span>
          </div>
          <div class="rep-edit__row rep-edit__row--status">
            <span class="rep-edit__label">상태</span>
            <div class="rep-status-group" role="radiogroup" aria-label="연습 상태 선택">
              ${['goal', 'in_progress', 'completed'].map((s) => `
                <button class="rep-status-btn${piece.status === s ? ' rep-status-btn--active' : ''}"
                        data-status="${s}" role="radio" aria-checked="${piece.status === s}">
                  ${STATUS_LABELS[s]}
                </button>
              `).join('')}
            </div>
          </div>
          <div class="rep-edit__actions">
            <button class="rep-edit__delete">삭제</button>
            <button class="rep-edit__save">저장</button>
          </div>
        </div>
      </div>
    `;

    // ── 접기/펼치기 ──
    const cardHeader = card.querySelector('.rep-card__header');
    function toggleCard() {
      expandedId = isExpanded ? null : piece.id;
      render();
    }
    cardHeader.addEventListener('click', toggleCard);
    cardHeader.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCard(); }
    });

    if (!isExpanded) return card;

    // ── 상태 선택 ──
    let currentStatus = piece.status;
    card.querySelectorAll('.rep-status-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentStatus = btn.dataset.status;
        card.querySelectorAll('.rep-status-btn').forEach((b) => {
          const active = b.dataset.status === currentStatus;
          b.classList.toggle('rep-status-btn--active', active);
          b.setAttribute('aria-checked', String(active));
        });
      });
    });

    // ── BPM 입력 시 진행 바 실시간 업데이트 ──
    const bpmInput = card.querySelector(`#re-bpm-${piece.id}`);
    const bpmFill  = card.querySelector('.rep-edit__bpm-fill');
    bpmInput.addEventListener('input', () => {
      const pct = Math.min(100, Math.round((Number(bpmInput.value) / piece.targetBpm) * 100));
      bpmFill.style.width = `${pct}%`;
    });

    // ── 저장 ──
    card.querySelector('.rep-edit__save').addEventListener('click', async () => {
      const newBpm = Math.max(20, Math.min(300,
        Number(bpmInput.value) || piece.currentBpm));
      const newMeasures = Math.max(0, Math.min(piece.totalMeasures,
        Number(card.querySelector(`#re-measures-${piece.id}`).value) || 0));

      const updatedVersions = computeVersionUnlocks({ ...piece, currentBpm: newBpm });
      const newlyUnlocked = updatedVersions.filter(
        (v, i) => v.unlocked && !(piece.versions[i]?.unlocked),
      );

      await upsertRepertoire({
        ...piece,
        currentBpm:      newBpm,
        learnedMeasures: newMeasures,
        status:          currentStatus,
        versions:        updatedVersions,
        completedAt:
          currentStatus === 'completed' && !piece.completedAt ? today() : piece.completedAt,
      });

      pieces = await getAllRepertoire();
      expandedId = null;

      if (newlyUnlocked.length > 0) {
        showToast({
          icon:    '🔓',
          title:   `${newlyUnlocked[0].label} 해금!`,
          message: `${piece.title} — ${newlyUnlocked[0].label}에 도달했습니다.`,
          duration: 4000,
        });
      }

      render();
    });

    // ── 삭제 ──
    card.querySelector('.rep-edit__delete').addEventListener('click', async () => {
      if (!confirm(`"${piece.title}"을(를) 레퍼토리에서 삭제하시겠어요?`)) return;
      await deleteRepertoire(piece.id);
      pieces = await getAllRepertoire();
      expandedId = null;
      render();
    });

    return card;
  }

  el._destroy = () => {};
  init();
  return el;
}
