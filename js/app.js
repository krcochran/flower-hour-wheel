/**
 * app.js — Main application controller
 * Wires FHData, FHWheel, FHUI, and FHConfetti together.
 */

(function () {
  // ── Init wheel ─────────────────────────────────────────
  const canvas = document.getElementById('wheelCanvas');
  FHWheel.init(canvas);

  // ── State shorthand ─────────────────────────────────────
  let lastWinner = null;

  // ── Render all UI ───────────────────────────────────────
  function refresh() {
    const pool = FHData.getFilteredPool();
    const spinPool = FHData.getSpinPool();

    FHUI.renderNameList(
      pool,
      (name) => { FHData.removeOneByName(name); refresh(); },
      (name) => { FHData.removeAllByName(name); refresh(); },
      (name) => openTagEditorForName(name)
    );

    FHUI.renderHistory(FHData.history);
    FHUI.renderStats(FHData.getStats());
    FHUI.renderTagSelect(FHData.tags);
    FHUI.setSpinBtn(spinPool.length > 0 && !FHWheel.isSpinning());

    // Unique names for wheel display
    const uniqueNames = [...new Set(spinPool)];
    FHWheel.redraw(uniqueNames);
  }

  // ── Add name ────────────────────────────────────────────
  function addNameFromInput() {
    const input = document.getElementById('nameInput');
    const name = input.value.trim();
    if (!name) return;
    FHData.addEntry(name);
    input.value = '';
    input.focus();
    refresh();
    FHUI.hideResult();
  }

  document.getElementById('btnAdd').addEventListener('click', addNameFromInput);
  document.getElementById('nameInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addNameFromInput();
  });

  // ── Bulk import ─────────────────────────────────────────
  document.getElementById('btnBulk').addEventListener('click', () => {
    const ta = document.getElementById('bulkInput');
    const count = FHData.addBulk(ta.value);
    if (count > 0) {
      ta.value = '';
      refresh();
      FHUI.hideResult();
    }
  });

  // ── Clear all ────────────────────────────────────────────
  document.getElementById('btnClearAll').addEventListener('click', () => {
    if (confirm('Clear all names from the list?')) {
      FHData.clearAll();
      FHUI.hideResult();
      refresh();
    }
  });

  // ── Clear history ────────────────────────────────────────
  document.getElementById('btnClearHistory').addEventListener('click', () => {
    if (confirm('Clear spin history and reset picked status?')) {
      FHData.clearHistory();
      refresh();
    }
  });

  // ── Filters ─────────────────────────────────────────────
  document.getElementById('filterCount').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#filterCount .chip').forEach(c => c.classList.remove('chip-active'));
    chip.classList.add('chip-active');
    const val = chip.dataset.filter;
    FHData.setFilter('countMin', val === 'all' ? 0 : parseInt(val));
    refresh();
  });

  document.getElementById('sortSelect').addEventListener('change', e => {
    FHData.setFilter('sort', e.target.value);
    refresh();
  });

  document.getElementById('filterSearch').addEventListener('input', e => {
    FHData.setFilter('search', e.target.value);
    refresh();
  });

  document.getElementById('tagFilter').addEventListener('change', e => {
    FHData.setFilter('tag', e.target.value);
    refresh();
  });

  // Sync sort select UI from saved state
  document.getElementById('sortSelect').value = FHData.filters.sort || 'added';
  document.getElementById('filterSearch').value = FHData.filters.search || '';
  if (FHData.filters.countMin > 0) {
    const chip = document.querySelector(`#filterCount [data-filter="${FHData.filters.countMin}"]`);
    if (chip) {
      document.querySelectorAll('#filterCount .chip').forEach(c => c.classList.remove('chip-active'));
      chip.classList.add('chip-active');
    }
  }

  // ── Spin ─────────────────────────────────────────────────
  document.getElementById('btnSpin').addEventListener('click', () => {
    if (FHWheel.isSpinning()) return;
    const spinPool = FHData.getSpinPool();
    if (spinPool.length === 0) return;

    FHUI.hideResult();
    FHUI.setSpinBtn(false);

    const uniqueNames = [...new Set(spinPool)];

    FHWheel.spin(spinPool, uniqueNames, (winner) => {
      lastWinner = winner;
      FHData.recordSpin(winner);
      FHUI.showResult(winner);
      FHConfetti.burst(90);
      refresh();
    });
  });

  // ── Result actions ───────────────────────────────────────
  document.getElementById('btnKeep').addEventListener('click', () => {
    FHUI.hideResult();
    lastWinner = null;
    refresh();
  });

  document.getElementById('btnRemoveOne').addEventListener('click', () => {
    if (lastWinner) {
      FHData.removeOneByName(lastWinner);
      FHUI.hideResult();
      lastWinner = null;
      refresh();
    }
  });

  document.getElementById('btnRemoveAll').addEventListener('click', () => {
    if (lastWinner) {
      FHData.removeAllByName(lastWinner);
      FHUI.hideResult();
      lastWinner = null;
      refresh();
    }
  });

  // ── Tag modal ────────────────────────────────────────────
  function openTagModal() {
    const backdrop = document.getElementById('modalBackdrop');
    backdrop.hidden = false;
    FHUI.renderTagModal(
      FHData.tags,
      FHData.entries,
      (id) => FHData.removeTag(id),
      null
    );
  }

  function openTagEditorForName(name) {
    // Simple prompt-based tag editor for per-name tagging
    if (FHData.tags.length === 0) {
      alert('Create some tags first using "Manage Tags".');
      return;
    }
    const entries = FHData.entries.filter(e => e.name === name);
    const currentTags = entries[0]?.tags || [];
    const tagOptions = FHData.tags.map(t =>
      `${(currentTags.includes(t.id) ? '✓ ' : '  ')}${t.name} (${t.id})`
    ).join('\n');

    const input = prompt(
      `Tags for "${name}":\nCurrent: ${currentTags.map(id => FHData.getTag(id)?.name || id).join(', ') || 'none'}\n\nEnter tag names to toggle (comma-separated):\nAvailable: ${FHData.tags.map(t => t.name).join(', ')}`
    );

    if (input === null) return;
    const typed = input.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const newTagIds = FHData.tags
      .filter(t => typed.includes(t.name.toLowerCase()))
      .map(t => t.id);

    FHData.entries
      .filter(e => e.name === name)
      .forEach(e => FHData.setEntryTags(e.id, newTagIds));

    refresh();
  }

  document.getElementById('btnManageTags').addEventListener('click', openTagModal);

  document.getElementById('btnCreateTag').addEventListener('click', () => {
    const input = document.getElementById('newTagInput');
    const name = input.value.trim();
    if (!name) return;
    FHData.addTag(name);
    input.value = '';
    FHUI.renderTagModal(FHData.tags, FHData.entries, (id) => FHData.removeTag(id), null);
    FHUI.renderTagSelect(FHData.tags);
  });

  document.getElementById('newTagInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btnCreateTag').click();
  });

  document.getElementById('btnCloseModal').addEventListener('click', () => {
    document.getElementById('modalBackdrop').hidden = true;
    refresh();
  });

  document.getElementById('modalBackdrop').addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      document.getElementById('modalBackdrop').hidden = true;
      refresh();
    }
  });

  // ── Initial render ───────────────────────────────────────
  refresh();
})();
