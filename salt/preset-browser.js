// Shared preset-browser model: folders (one level), fold state, hover, context menu, user-list mutations.
// Presets: { name, group?, ...fields }. ALL = [...factory, ...user]; `preset` = index into ALL.

export function pbRows(o) {
  // o: { factory, user, folders, loaded, folded, hover, toggleFold, apply, setHover, openMenu, newFolder }
  const rows = [], n0 = o.factory.length;
  const hov = (key) => ({ onEnter: () => o.setHover(key), onLeave: () => o.setHover(null) });
  const presetRow = (p, i, indent) => rows.push({
    key: 'p:' + i, kind: 'preset', label: p.name, indent, tri: '', count: '',
    loaded: i === o.loaded, hovered: o.hover === 'p:' + i, dots: o.hover === 'p:' + i, isUser: i >= n0,
    onClick: () => o.apply(i), ...hov('p:' + i),
    onDots: (e) => o.openMenu({ kind: 'preset', i, key: 'p:' + i }, e),
    onContext: (e) => o.openMenu({ kind: 'preset', i, key: 'p:' + i }, e),
  });
  const section = (label, items, sec) => {
    rows.push({ key: 'sec:' + sec, kind: 'section', label, tri: '', count: '', hovered: false, dots: false });
    const groups = [];
    items.forEach(x => { if (x.p.group && !groups.includes(x.p.group)) groups.push(x.p.group); });
    if (sec === 'U') (o.folders || []).forEach(g => { if (!groups.includes(g)) groups.push(g); });
    items.filter(x => !x.p.group).forEach(x => presetRow(x.p, x.i, false));
    groups.forEach(g => {
      const key = sec + ':' + g, open = !o.folded[key], inside = items.filter(x => x.p.group === g), isUser = sec === 'U', h = o.hover === key;
      rows.push({
        key, kind: 'folder', label: g, tri: open ? '▾' : '▸', count: isUser && h ? '' : String(inside.length), open, isUser,
        hovered: h, dots: isUser && h, onClick: () => o.toggleFold(key), ...hov(key),
        onDots: isUser ? (e) => o.openMenu({ kind: 'folder', name: g, key }, e) : null,
        onContext: isUser ? (e) => o.openMenu({ kind: 'folder', name: g, key }, e) : (e) => e.preventDefault(),
      });
      if (open) inside.forEach(x => presetRow(x.p, x.i, true));
    });
  };
  section('FACTORY', o.factory.map((p, i) => ({ p, i })), 'F');
  section('USER', o.user.map((p, i) => ({ p, i: n0 + i })), 'U');
  rows.push({ key: 'new', kind: 'new', label: '+ New folder', tri: '', count: '', hovered: o.hover === 'new', dots: false, onClick: o.newFolder, ...hov('new') });
  return rows;
}

export function userFolders(user, folders) {
  const g = []; user.forEach(p => { if (p.group && !g.includes(p.group)) g.push(p.group); });
  (folders || []).forEach(f => { if (!g.includes(f)) g.push(f); });
  return g;
}

export function pbMenu(m, o) {
  // m: { kind, i?, name? }  o: { n0, user, folders, act: {...}, close }
  if (!m) return [];
  const items = [];
  const it = (label, fn) => items.push({ key: label, label, item: true, onClick: (e) => { e.stopPropagation(); fn && fn(); o.close(); } });
  const hd = (label) => items.push({ key: 'h:' + label, label, header: true });
  const gap = () => items.push({ key: 'gap' + items.length, gap: true });
  const a = o.act;
  if (m.kind === 'preset') {
    if (m.i >= o.n0) {
      const cur = o.user[m.i - o.n0];
      it('Save', () => a.save(m.i)); it('Save as…', () => a.saveAs()); it('Rename', () => a.rename(m.i)); it('Duplicate', () => a.duplicate(m.i));
      gap(); hd('MOVE TO');
      userFolders(o.user, o.folders).filter(g => g !== (cur && cur.group)).forEach(g => it(g, () => a.moveTo(m.i, g)));
      it('New folder…', () => a.moveToNew(m.i));
      gap(); it('Delete', () => a.del(m.i)); it('Show in Finder', null);
    } else {
      it('Save as…', () => a.saveAs()); it('Save a copy to User', () => a.copyToUser(m.i)); it('Show in Finder', null);
    }
  } else {
    it('Rename folder', () => a.renameFolder(m.name)); it('Delete folder', () => a.deleteFolder(m.name)); it('Show in Finder', null);
  }
  return items;
}

// Menu placement relative to the browser box. Returns { y, flip }.
export function pbPlace(rowEl, boxEl, listEl, itemCount) {
  const r = rowEl.getBoundingClientRect(), b = boxEl.getBoundingClientRect(), l = listEl.getBoundingClientRect();
  const h = itemCount * 21 + 14;
  const below = l.bottom - r.bottom, above = r.top - l.top;
  const flip = below < h && above > below;
  return flip ? { y: r.top - b.top, flip: true } : { y: r.bottom - b.top, flip: false };
}

// Pure state mutations. st: { user, folders, preset }, n0 = factory count.
export const pbAct = {
  save: (st, n0, snap, i) => { const u = st.user.slice(); u[i - n0] = { ...u[i - n0], ...snap }; return { user: u, preset: i }; },
  saveAs: (st, n0, snap, name, group) => { const u = [...st.user, { name, group, ...snap }]; return { user: u, preset: n0 + u.length - 1 }; },
  rename: (st, n0, i, name) => { const u = st.user.slice(); u[i - n0] = { ...u[i - n0], name }; return { user: u }; },
  duplicate: (st, n0, i) => { const u = st.user.slice(), p = u[i - n0]; u.splice(i - n0 + 1, 0, { ...p, name: p.name + ' copy' }); return { user: u, preset: i + 1 }; },
  moveTo: (st, n0, i, group) => { const u = st.user.slice(); u[i - n0] = { ...u[i - n0], group }; return { user: u }; },
  del: (st, n0, i) => { const u = st.user.filter((_, k) => k !== i - n0); return { user: u, preset: Math.min(st.preset > i ? st.preset - 1 : st.preset, n0 + u.length - 1) }; },
  addFolder: (st, name) => ({ folders: [...(st.folders || []), name] }),
  renameFolder: (st, from, to) => ({ user: st.user.map(p => p.group === from ? { ...p, group: to } : p), folders: (st.folders || []).map(f => f === from ? to : f) }),
  deleteFolder: (st, n0, name) => {
    const keep = st.user.map((p, k) => ({ p, k })).filter(x => x.p.group !== name);
    const u = keep.map(x => x.p), oldIdx = st.preset - n0, newIdx = keep.findIndex(x => x.k === oldIdx);
    return { user: u, folders: (st.folders || []).filter(f => f !== name), preset: newIdx >= 0 ? n0 + newIdx : Math.min(st.preset, n0 + u.length - 1) };
  },
};

// Attach browser behaviour to a DC logic instance. cfg: { factory: () => [...], snap: (st) => fields, commit: (patch) => void }
// State the component must own: user, folders, preset, presetOpen, folded, pbHover, pbMenu.
export function installPB(c, cfg) {
  c.pbBox = { current: null }; c.pbList = { current: null };
  const n0 = () => cfg.factory().length;
  const ask = (label, def) => { const v = window.prompt(label, def); return v === null ? null : (v.trim() || def); };
  const names = (st) => st.user.map(p => p.name);
  c.pbToggleFold = (key) => c.setState(st => ({ folded: { ...st.folded, [key]: !st.folded[key] } }));
  c.pbSetHover = (key) => { if (c.state.pbHover !== key) c.setState({ pbHover: key }); };
  c.pbClose = () => { if (c.state.pbMenu) c.setState({ pbMenu: null }); };
  c.pbOpenMenu = (m, e) => {
    e.preventDefault(); e.stopPropagation();
    const row = e.currentTarget.closest('[data-pb-key]');
    const cnt = pbMenu(m, { n0: n0(), user: c.state.user, folders: c.state.folders, act: c.pbAct, close: c.pbClose }).length;
    const pos = row && c.pbBox.current && c.pbList.current ? pbPlace(row, c.pbBox.current, c.pbList.current, cnt) : { y: 40, flip: false };
    c.setState({ pbMenu: { ...m, ...pos } });
  };
  c.presetContext = (e) => {
    e.preventDefault();
    const i = c.state.preset, all = [...cfg.factory(), ...c.state.user], p = all[i]; if (!p) return;
    const key = (i >= n0() ? 'U:' : 'F:') + (p.group || '');
    c.setState(st => ({ presetOpen: true, folded: p.group ? { ...st.folded, [key]: false } : st.folded, pbMenu: { kind: 'preset', i, key: 'p:' + i, pending: true, y: 40, flip: false } }));
  };
  const prevDU = c.componentDidUpdate;
  c.componentDidUpdate = function () {
    prevDU && prevDU.apply(c, arguments);
    const m = c.state.pbMenu;
    if (m && m.pending && c.pbBox.current) {
      const row = c.pbBox.current.querySelector('[data-pb-key="' + m.key + '"]');
      if (row) { const l = c.pbList.current; if (l) { const rt = row.offsetTop - l.offsetTop; if (rt < l.scrollTop || rt > l.scrollTop + l.clientHeight - 24) l.scrollTop = Math.max(0, rt - 24); } const cnt = pbMenu(m, { n0: n0(), user: c.state.user, folders: c.state.folders, act: c.pbAct, close: c.pbClose }).length; c.setState({ pbMenu: { ...m, pending: false, ...pbPlace(row, c.pbBox.current, c.pbList.current, cnt) } }); }
      else c.setState({ pbMenu: { ...m, pending: false } });
    }
  };
  const withName = (label, def, fn) => { const nm = ask(label, def); if (nm !== null) fn(nm); };
  c.pbAct = {
    save: (i) => cfg.commit(st => pbAct.save(st, n0(), cfg.snap(st), i)),
    saveAs: () => withName('Preset name', uniqueName('My preset', names(c.state)), nm => cfg.commit(st => { const cur = st.user[st.preset - n0()]; return pbAct.saveAs(st, n0(), cfg.snap(st), nm, cur && cur.group); })),
    rename: (i) => withName('Rename preset', c.state.user[i - n0()].name, nm => c.setState(st => pbAct.rename(st, n0(), i, nm))),
    duplicate: (i) => cfg.commit(st => pbAct.duplicate(st, n0(), i)),
    moveTo: (i, g) => c.setState(st => pbAct.moveTo(st, n0(), i, g)),
    moveToNew: (i) => withName('New folder', uniqueName('New folder', userFolders(c.state.user, c.state.folders)), nm => c.setState(st => ({ ...pbAct.addFolder(st, nm), ...pbAct.moveTo(st, n0(), i, nm) }))),
    del: (i) => cfg.commit(st => pbAct.del(st, n0(), i)),
    copyToUser: (i) => withName('Preset name', cfg.factory()[i].name, nm => cfg.commit(st => { const { name, group, ...rest } = cfg.factory()[i]; return pbAct.saveAs(st, n0(), rest, nm, undefined); })),
    renameFolder: (g) => withName('Rename folder', g, nm => c.setState(st => pbAct.renameFolder(st, g, nm))),
    deleteFolder: (g) => { if (window.confirm('Delete folder "' + g + '" and its presets?')) cfg.commit(st => pbAct.deleteFolder(st, n0(), g)); },
    newFolder: () => withName('New folder', uniqueName('New folder', userFolders(c.state.user, c.state.folders)), nm => c.setState(st => pbAct.addFolder(st, nm))),
  };
  c.pbVals = (t) => {
    const st = c.state, F = cfg.factory();
    const rows = pbRows({ factory: F, user: st.user, folders: st.folders, loaded: st.preset, folded: st.folded || {}, hover: st.pbHover, toggleFold: c.pbToggleFold, apply: c.applyPreset, setHover: c.pbSetHover, openMenu: c.pbOpenMenu, newFolder: c.pbAct.newFolder })
      .map(r => ({
        ...r,
        color: r.kind === 'section' ? t.section : r.loaded ? t.loaded : r.kind === 'new' ? t.muted : t.ink,
        bg: r.hovered && r.kind !== 'section' ? t.hoverBg : 'transparent',
        pad: (r.kind === 'section' ? t.secPad : t.rowPad) + ' ' + t.padX + 'px ' + (r.kind === 'section' ? t.secPad : t.rowPad) + ' ' + ((r.indent ? t.indent : 0) + t.padX) + 'px',
        font: r.kind === 'section' ? t.fontSC : t.font,
        size: (r.kind === 'section' ? t.secSize : t.size) + 'px',
        ls: r.kind === 'section' ? '.14em' : '0',
        cursor: r.kind === 'section' ? 'default' : 'pointer',
        triW: (r.kind === 'preset' || r.kind === 'new') && !r.indent ? '0px' : '11px',
        onContext: r.onContext || ((e) => e.preventDefault()),
      }));
    const m = st.pbMenu;
    const items = m ? pbMenu(m, { n0: F.length, user: st.user, folders: st.folders, act: c.pbAct, close: c.pbClose }).map(x => ({
      ...x, color: x.header ? t.section : t.ink, font: x.header ? t.fontSC : t.font, size: (x.header ? t.secSize : t.menuSize) + 'px',
      pad: x.gap ? '0' : x.header ? '5px 12px 1px' : '3px 12px', h: x.gap ? '5px' : 'auto', ls: x.header ? '.14em' : '0', cursor: x.item ? 'pointer' : 'default',
      hoverBg: x.item ? t.hoverBg : 'transparent',
    })) : [];
    return {
      pbRows: rows, pbBox: c.pbBox, pbList: c.pbList, pbClose: c.pbClose, presetContext: c.presetContext,
      pbMenuOpen: !!m && !m.pending, pbMenuItems: items, pbMenuY: m ? m.y + 'px' : '0px', pbMenuT: m && m.flip ? 'translateY(-100%)' : 'none',
      pbStop: (e) => e.stopPropagation(),
    };
  };
}

export function uniqueName(base, taken) {
  let n = base, k = 2; while (taken.includes(n)) n = base + ' ' + k++; return n;
}
