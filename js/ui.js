/**
 * ui.js — DOM rendering helpers
 */

const FHUI = (() => {

  function renderNameList(pool, onRemoveOne, onRemoveAll, onTagEdit) {
    const list = document.getElementById('nameList');
    const label = document.getElementById('nameCountLabel');

    label.textContent = `${pool.length} unique name${pool.length !== 1 ? 's' : ''} in pool`;

    if (pool.length === 0) {
      list.innerHTML = '<li style="font-size:0.82rem;color:#8a7d2a;opacity:0.7;font-style:italic;padding:0.5rem 0">No names yet — add some above!</li>';
      return;
    }

    list.innerHTML = '';
    pool.forEach(p => {
      const li = document.createElement('li');
      li.className = 'name-item' + (p.picked ? ' picked' : '');
      li.title = p.picked ? 'Previously picked' : '';

      // Tag pills
      const tagPills = (p.tags || []).map(tid => {
        const tag = FHData.getTag(tid);
        if (!tag) return '';
        return `<span class="name-tag" style="background:${tag.color}20;color:${tag.color}">${tag.name}</span>`;
      }).join('');

      li.innerHTML = `
        <span class="name-text">${escHtml(p.name)}</span>
        ${tagPills}
        <span class="name-count" title="${p.count} entr${p.count !== 1 ? 'ies' : 'y'} in list">×${p.count}</span>
        <span class="name-item-actions">
          <button class="btn-icon" title="Edit tags" data-name="${escHtml(p.name)}">🏷️</button>
          <button class="btn-icon danger" title="Remove one entry" data-name="${escHtml(p.name)}">−</button>
          <button class="btn-icon danger" title="Remove all entries" data-name="${escHtml(p.name)}">✕</button>
        </span>
      `;

      const [tagBtn, minusBtn, xBtn] = li.querySelectorAll('.btn-icon');
      if (onTagEdit) tagBtn.addEventListener('click', () => onTagEdit(p.name));
      minusBtn.addEventListener('click', () => onRemoveOne(p.name));
      xBtn.addEventListener('click', () => onRemoveAll(p.name));

      list.appendChild(li);
    });
  }

  function renderHistory(history) {
    const list = document.getElementById('historyList');
    if (history.length === 0) {
      list.innerHTML = '<li class="history-empty">No spins yet — let\'s go! 🌸</li>';
      return;
    }
    list.innerHTML = '';
    history.forEach(h => {
      const li = document.createElement('li');
      li.className = 'history-item';
      const t = new Date(h.timestamp);
      const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      li.innerHTML = `
        <span class="history-spin-num">#${h.spin}</span>
        <span class="history-item-name">${escHtml(h.name)}</span>
        <span class="history-item-time">${timeStr}</span>
      `;
      list.appendChild(li);
    });
  }

  function renderStats(stats) {
    const container = document.getElementById('statsContainer');
    if (stats.length === 0) {
      container.innerHTML = '<p style="font-size:0.78rem;color:#8a7d2a;opacity:0.7;font-style:italic">Spin some names to see stats!</p>';
      return;
    }
    const max = stats[0][1];
    container.innerHTML = '';
    stats.forEach(([name, count]) => {
      const pct = Math.round((count / max) * 100);
      const div = document.createElement('div');
      div.className = 'stat-item';
      div.innerHTML = `
        <span class="stat-name" title="${escHtml(name)}">${escHtml(truncate(name, 10))}</span>
        <div class="stat-bar-wrap"><div class="stat-bar" style="width:${pct}%"></div></div>
        <span class="stat-count">${count}</span>
      `;
      container.appendChild(div);
    });
  }

  function renderTagSelect(tags) {
    const sel = document.getElementById('tagFilter');
    const current = sel.value;
    sel.innerHTML = '<option value="">All tags</option>';
    tags.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      if (t.id === current) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function renderTagModal(tags, entries, onDeleteTag, onToggleEntryTag) {
    const container = document.getElementById('tagModalContent');
    if (tags.length === 0) {
      container.innerHTML = '<p style="font-size:0.82rem;color:#8a7d2a;font-style:italic">No tags yet. Create one below!</p>';
      return;
    }
    container.innerHTML = '';
    tags.forEach(tag => {
      const count = entries.filter(e => (e.tags || []).includes(tag.id)).length;
      const div = document.createElement('div');
      div.className = 'tag-mgmt-item';
      div.innerHTML = `
        <span class="tag-dot" style="background:${tag.color}"></span>
        <span style="flex:1">${escHtml(tag.name)}</span>
        <span style="font-size:0.72rem;color:#8a7d2a;margin-right:0.75rem">${count} entr${count !== 1 ? 'ies' : 'y'}</span>
        <button class="btn btn-xs btn-danger" data-id="${tag.id}">Delete</button>
      `;
      div.querySelector('button').addEventListener('click', () => {
        onDeleteTag(tag.id);
        renderTagModal(FHData.tags, FHData.entries, onDeleteTag, onToggleEntryTag);
        renderTagSelect(FHData.tags);
      });
      container.appendChild(div);
    });
  }

  function showResult(name) {
    const banner = document.getElementById('resultBanner');
    const nameEl = document.getElementById('resultName');
    nameEl.textContent = name;
    banner.hidden = false;
    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideResult() {
    document.getElementById('resultBanner').hidden = true;
  }

  function setSpinBtn(enabled) {
    document.getElementById('btnSpin').disabled = !enabled;
  }

  // Helpers
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function truncate(str, n) {
    return str.length > n ? str.slice(0, n) + '…' : str;
  }

  return {
    renderNameList,
    renderHistory,
    renderStats,
    renderTagSelect,
    renderTagModal,
    showResult,
    hideResult,
    setSpinBtn,
    escHtml,
  };
})();
