/**
 * data.js — State management for Flower Hour Wheel
 * All state lives here; UI reads from and writes through these functions.
 */

const FHData = (() => {
  // ── State ──────────────────────────────────────────────
  let state = {
    entries: [],      // { id, name, addedAt, picked, tags:[] }
    history: [],      // { spin, name, timestamp }
    tags: [],         // { id, name, color }
    spinCount: 0,
    filters: {
      countMin: 0,        // 0 = all
      sort: 'added',      // added | alpha | count-desc | count-asc | unpicked
      search: '',
      tag: '',
    },
  };

  let nextId = 1;

  // ── Persistence ────────────────────────────────────────
  const STORAGE_KEY = 'fh-wheel-state';

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, nextId }));
    } catch (e) { /* storage full */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
      nextId = parsed.nextId || (state.entries.length + 1);
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // ── Entry helpers ───────────────────────────────────────
  function addEntry(name, tags = []) {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const entry = {
      id: nextId++,
      name: trimmed,
      addedAt: Date.now(),
      picked: false,
      pickCount: 0,
      tags: [...tags],
    };
    state.entries.push(entry);
    save();
    return entry;
  }

  function addBulk(text, tags = []) {
    const names = text.split('\n').map(s => s.trim()).filter(Boolean);
    names.forEach(n => addEntry(n, tags));
    save();
    return names.length;
  }

  function removeEntry(id) {
    state.entries = state.entries.filter(e => e.id !== id);
    save();
  }

  function removeAllByName(name) {
    state.entries = state.entries.filter(e => e.name !== name);
    save();
  }

  function removeOneByName(name) {
    // Remove the most recently added entry with this name
    const idx = [...state.entries].map((e, i) => ({ e, i }))
      .filter(({ e }) => e.name === name)
      .sort((a, b) => b.e.addedAt - a.e.addedAt)[0]?.i;
    if (idx !== undefined) {
      state.entries.splice(idx, 1);
      save();
    }
  }

  function clearAll() {
    state.entries = [];
    save();
  }

  function markPicked(name) {
    state.entries
      .filter(e => e.name === name)
      .forEach(e => { e.picked = true; e.pickCount = (e.pickCount || 0) + 1; });
    save();
  }

  function setEntryTags(id, tags) {
    const e = state.entries.find(e => e.id === id);
    if (e) { e.tags = tags; save(); }
  }

  // ── Tag helpers ─────────────────────────────────────────
  const TAG_COLORS = ['#a8d4e6','#f4a95a','#e8637a','#8a7d2a','#2d1b69','#f0b8c5','#fcd9b0'];

  function addTag(name) {
    const id = 'tag_' + Date.now();
    const color = TAG_COLORS[state.tags.length % TAG_COLORS.length];
    state.tags.push({ id, name: name.trim(), color });
    save();
    return id;
  }

  function removeTag(id) {
    state.tags = state.tags.filter(t => t.id !== id);
    state.entries.forEach(e => {
      e.tags = (e.tags || []).filter(t => t !== id);
    });
    save();
  }

  function getTag(id) {
    return state.tags.find(t => t.id === id);
  }

  // ── History helpers ──────────────────────────────────────
  function recordSpin(name) {
    state.spinCount++;
    state.history.unshift({
      spin: state.spinCount,
      name,
      timestamp: Date.now(),
    });
    if (state.history.length > 100) state.history = state.history.slice(0, 100);
    markPicked(name);
    save();
  }

  function clearHistory() {
    state.history = [];
    state.spinCount = 0;
    // reset picked flags
    state.entries.forEach(e => { e.picked = false; e.pickCount = 0; });
    save();
  }

  // ── Filtered + sorted pool ──────────────────────────────
  function getFilteredPool() {
    const { countMin, sort, search, tag } = state.filters;

    // Build unique name → count map
    const countMap = {};
    const addedMap = {};
    state.entries.forEach(e => {
      const n = e.name;
      countMap[n] = (countMap[n] || 0) + 1;
      if (!addedMap[n] || e.addedAt < addedMap[n]) addedMap[n] = e.addedAt;
    });

    // Unique names with metadata
    let pool = Object.keys(countMap).map(name => ({
      name,
      count: countMap[name],
      addedAt: addedMap[name],
      picked: state.entries.find(e => e.name === name)?.picked || false,
      pickCount: state.entries.find(e => e.name === name)?.pickCount || 0,
      tags: [...new Set(state.entries.filter(e => e.name === name).flatMap(e => e.tags || []))],
    }));

    // Filter by count
    if (countMin > 0) pool = pool.filter(p => p.count >= countMin);

    // Filter by unpicked (handled via sort=unpicked as a filter too)
    if (sort === 'unpicked') pool = pool.filter(p => !p.picked);

    // Filter by search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      pool = pool.filter(p => p.name.toLowerCase().includes(q));
    }

    // Filter by tag
    if (tag) {
      pool = pool.filter(p => (p.tags || []).includes(tag));
    }

    // Sort
    switch (sort) {
      case 'alpha':
        pool.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'count-desc':
        pool.sort((a, b) => b.count - a.count); break;
      case 'count-asc':
        pool.sort((a, b) => a.count - b.count); break;
      case 'added':
        pool.sort((a, b) => a.addedAt - b.addedAt); break;
      case 'unpicked':
        pool.sort((a, b) => a.addedAt - b.addedAt); break;
    }

    return pool;
  }

  /**
   * Returns the FULL spin pool (with duplicates for weighting).
   * Each entry appears N times = how many times it was added.
   * Filtered by current filters.
   */
  function getSpinPool() {
    const filtered = getFilteredPool();
    const filteredNames = new Set(filtered.map(p => p.name));
    return state.entries.filter(e => filteredNames.has(e.name)).map(e => e.name);
  }

  // ── Stats ───────────────────────────────────────────────
  function getStats() {
    const pickedCount = {};
    state.history.forEach(h => {
      pickedCount[h.name] = (pickedCount[h.name] || 0) + 1;
    });
    return Object.entries(pickedCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }

  // ── Filters setters ─────────────────────────────────────
  function setFilter(key, value) {
    state.filters[key] = value;
    save();
  }

  // ── Public API ───────────────────────────────────────────
  load();

  return {
    addEntry,
    addBulk,
    removeEntry,
    removeAllByName,
    removeOneByName,
    clearAll,
    recordSpin,
    clearHistory,
    getFilteredPool,
    getSpinPool,
    getStats,
    setFilter,
    addTag,
    removeTag,
    getTag,
    setEntryTags,
    get entries() { return state.entries; },
    get history() { return state.history; },
    get tags() { return state.tags; },
    get filters() { return state.filters; },
    get spinCount() { return state.spinCount; },
  };
})();
