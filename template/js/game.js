// 範本遊戲「沙包練習場」：30 秒內打爆越多沙包越好
// 這個檔示範一款街機小遊戲最少需要的東西：場景流程、角色狀態機、打擊判定、粒子、HUD、暫停、版本與更新紀錄、桌墊出招表
// 新專案從這裡改：換角色 id、換關卡目標（沙包 → 車子、敵人…）、加招式
'use strict';

// ---------- 版本與更新紀錄（每次改版一起加一筆，標題畫面按 ↑ 和桌墊按鈕都看得到） ----------
const VERSION = 'v1.0';
const CHANGELOG = [
  ['v1.0', '範本首版：走路、跑步、跳、蹲、拳腳、飛彈、迴旋、暫停、更新紀錄、桌墊出招表'],
];

const HERO = 'hero';                       // SPRITE_DATA 裡的角色 id
const TIME = 30;                           // 一局幾秒

// ---------- 小工具 ----------
function px(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function disc(x, y, r, c) { ctx.fillStyle = c; for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(r * r - dy * dy)); ctx.fillRect(Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1); } }

// ---------- 招式表：box = [前方距離, 相對腳底高度, 寬, 高]（面向右） ----------
const MOVES = {
  jab: { frames: [['punch0', 3], ['punch1', 5], ['punch0', 6]], active: [3, 7], box: [2, -58, 28, 18], dmg: 1 },
  kick: { frames: [['kick0', 5], ['kick1', 7], ['kick0', 8]], active: [5, 11], box: [4, -48, 34, 22], dmg: 2 },
  cjab: { frames: [['crouch', 2], ['cpunch', 5], ['crouch', 5]], active: [2, 6], box: [0, -36, 32, 32], dmg: 1, crouch: true },
  csweep: { frames: [['ckick0', 4], ['ckick1', 8], ['ckick0', 8]], active: [4, 11], box: [0, -26, 44, 26], dmg: 2, crouch: true },
  jkick: { frames: [['jkick', 18]], active: [2, 16], box: [2, -36, 34, 24], dmg: 2, air: true },
};

// ---------- 狀態 ----------
const G = { scene: 'boot', t: 0, st: 0, paused: false, pi: 0, hitstop: 0, shake: 0, best: Store.get('best', 0) };
let P, bags, projs, parts, pops, R, bg;

function go(s) { G.scene = s; G.st = 0; SCENES[s].enter && SCENES[s].enter(); }
function part(o) { parts.push(Object.assign({ vx: 0, vy: 0, g: 0, life: 30, t: 0, col: '#fff', s: 1 }, o)); }
function pop(x, y, str, col = '#fff') { pops.push({ x, y, str, col, t: 0 }); }

function newGame() {
  P = { x: 60, y: GY, vx: 0, vy: 0, face: 1, ground: true, st: 'idle', t: 0, mv: null, mt: 0, hit: false, running: false, walkT: 0, walkDir: 0, combo: 0, comboT: 0 };
  bags = [180, 260, 340].map(x => newBag(x));
  projs = []; parts = []; pops = [];
  R = { time: TIME * 60, score: 0, broken: 0, maxCombo: 0 };
}
function newBag(x) { return { x, hp: 6, shake: 0, flash: 0, dead: 0 }; }
const bagBox = b => ({ x: b.x - 10, y: GY - 62, w: 20, h: 60 });

// ---------- 打擊 ----------
function boxWorld(p, [dx, dy, w, h]) { return { x: p.face > 0 ? p.x + dx : p.x - dx - w, y: p.y + dy, w, h }; }
function strike(rect, dmg) {
  let any = false;
  for (const b of bags) {
    if (b.dead || !rectHit(rect, bagBox(b))) continue;
    any = true; b.hp -= dmg; b.shake = 8; b.flash = 4;
    P.combo++; P.comboT = 60; R.maxCombo = Math.max(R.maxCombo, P.combo);
    const pts = 10 * dmg * (1 + Math.min(P.combo, 20) * 0.1) | 0; R.score += pts;
    for (let i = 0; i < 6; i++) part({ x: b.x + rnd(-6, 6), y: GY - 40 + rnd(-10, 10), vx: P.face * rnd(0.5, 2.5), vy: rnd(-2, 0), g: 0.12, life: 20, col: pick(['#fff7a0', '#ffffff', '#e8c070']) });
    if (b.hp <= 0) {              // 打爆：沙子噴出、加分、過一下再出現新的
      b.dead = 1; R.broken++; R.score += 100; pop(b.x, GY - 74, '+100 爆！', '#ffd040');
      for (let i = 0; i < 26; i++) part({ x: b.x + rnd(-8, 8), y: GY - 40 + rnd(-20, 20), vx: rnd(-3, 3), vy: rnd(-4, -1), g: 0.18, life: 40, col: pick(['#c8a060', '#a07840', '#e0c080']), s: 2 });
      Audio2.sfx('hitBig'); G.shake = 8; buzz(40);
    } else Audio2.sfx(dmg > 1 ? 'hitBig' : 'hit');
    G.hitstop = dmg > 1 ? 5 : 3;
  }
  return any;
}

function startMove(name) { P.st = 'attack'; P.mv = MOVES[name]; P.mvName = name; P.mt = 0; P.hit = false; Audio2.sfx('whiff'); }

function updatePlayer() {
  const p = P, I = Input, held = I.held, pr = I.pressed;
  p.t++;
  if (p.comboT > 0 && --p.comboT === 0) p.combo = 0;
  const free = p.st === 'idle' || p.st === 'walk' || p.st === 'crouch';
  if (p.ground && free) { if (held.left) p.face = -1; else if (held.right) p.face = 1; }
  // 必殺：快捷鍵或 ↓↓＋拳／腳
  if (free && (pr.s1 || (pr.p && I.motion(['down', 'down'], p.face))) && !projs.length) { p.st = 'throw'; p.t = 0; I.hist.length = 0; return; }
  if (free && (pr.s2 || (pr.k && I.motion(['down', 'down'], p.face)))) { p.st = 'rise'; p.t = 0; p.vy = -6.4; p.ground = false; I.hist.length = 0; Audio2.sfx('rise'); return; }

  switch (p.st) {
    case 'idle': case 'walk': case 'crouch': {
      if (pr.up) {
        const dir = held.left ? -1 : held.right ? 1 : 0;
        p.vx = dir * 1.8 * (p.running ? 1.5 : 1); p.vy = -5.4; p.ground = false; p.st = 'jump'; p.mv = null; p.running = false; break;
      }
      if (held.down) { p.st = 'crouch'; if (pr.p) startMove('cjab'); else if (pr.k) startMove('csweep'); break; }
      if (pr.p) { startMove('jab'); break; }
      if (pr.k) { startMove('kick'); break; }
      const dir = held.left ? -1 : held.right ? 1 : 0;
      if (dir) {
        // 跑步：連按兩下方向立刻跑，或按住同方向約半秒
        if (dir !== p.walkDir) { p.walkDir = dir; p.walkT = 0; p.running = false; }
        p.walkT++;
        const d = dir > 0 ? 'right' : 'left';
        if (!p.running && (p.walkT >= 28 || (pr[d] && I.motion([d, d], p.face, 14)))) p.running = true;
        p.x = clamp(p.x + dir * 1.4 * (p.running ? 1.9 : 1), 8, W - 8);
        if (p.running && p.t % 8 === 0) part({ x: p.x - dir * 6, y: p.y - 1, vx: -dir * 0.6, vy: -0.4, life: 12, col: '#9a9aa8' });
        p.st = 'walk';
      } else { p.st = 'idle'; p.running = false; p.walkT = 0; p.walkDir = 0; }
      break;
    }
    case 'jump':
      if (!p.mv && (pr.p || pr.k)) { p.mv = MOVES.jkick; p.mvName = 'jkick'; p.mt = 0; p.hit = false; Audio2.sfx('whiff'); }
      if (p.mv) { p.mt++; const [a0, a1] = p.mv.active; if (!p.hit && p.mt >= a0 && p.mt <= a1 && strike(boxWorld(p, p.mv.box), p.mv.dmg)) p.hit = true; }
      break;
    case 'attack': {
      p.mt++;
      const mv = p.mv, [a0, a1] = mv.active;
      if (!p.hit && p.mt >= a0 && p.mt <= a1 && strike(boxWorld(p, mv.box), mv.dmg)) p.hit = true;
      if (p.hit && p.mt > a1 && (pr.p || pr.k)) { startMove(held.down ? (pr.p ? 'cjab' : 'csweep') : (pr.p ? 'jab' : 'kick')); break; }   // 打中可以接下一招
      if (p.mt >= mv.frames.reduce((s, f) => s + f[1], 0)) { p.st = mv.crouch && held.down ? 'crouch' : 'idle'; p.mv = null; }
      break;
    }
    case 'throw':
      if (p.t === 12) { projs.push({ x: p.x + p.face * 16, y: p.y - 44, vx: p.face * 3.4, t: 0, life: 100 }); Audio2.sfx('proj'); }
      if (p.t >= 28) p.st = 'idle';
      break;
    case 'rise':
      if (p.t < 26 && p.t % 5 === 1) strike({ x: p.x - 16, y: p.y - 64, w: 32, h: 66 }, 1);
      break;
  }
  // 物理
  if (!p.ground) {
    p.x = clamp(p.x + p.vx, 8, W - 8); p.y += p.vy; p.vy += p.st === 'rise' && p.t < 20 ? 0.18 : 0.3;
    if (p.vy >= 0 && p.y >= GY) { p.y = GY; p.ground = true; p.vy = 0; p.vx = 0; if (p.st === 'jump' || p.st === 'rise') { p.st = 'idle'; p.mv = null; } }
  }
}

function pose() {
  const p = P;
  switch (p.st) {
    case 'idle': return 'idle' + (Math.floor(G.t / 22) % 2);
    case 'walk': return p.running ? 'run' + (Math.floor(p.t / 5) % 4) : 'walk' + (Math.floor(p.t / 8) % 4);
    case 'crouch': return 'crouch';
    case 'jump': return p.mv ? 'jkick' : p.vy < 0 ? 'jump' : 'fall';
    case 'attack': { let acc = 0; for (const [n, d] of p.mv.frames) { acc += d; if (p.mt < acc) return n; } return p.mv.frames[0][0]; }
    case 'throw': return p.t < 8 ? 'throw0' : p.t < 12 ? 'throw1' : 'throw2';
    case 'rise': return p.t < 26 ? (Math.floor(p.t / 4) % 2 ? 'spinK' : 'spin') : 'fall';
    case 'win': return 'win0';
    default: return 'idle0';
  }
}

function updateWorld() {
  for (const q of projs) {
    q.t++; q.x += q.vx; q.life--;
    if (q.t % 3 === 0) part({ x: q.x, y: q.y + rnd(-3, 3), life: 12, col: '#8ef0ff' });
    if (strike({ x: q.x - 6, y: q.y - 6, w: 12, h: 12 }, 2)) q.life = 0;
  }
  projs = projs.filter(q => q.life > 0 && q.x > -20 && q.x < W + 20);
  for (const b of bags) {
    if (b.shake > 0) b.shake--; if (b.flash > 0) b.flash--;
    if (b.dead && ++b.dead > 70) Object.assign(b, newBag(clamp(rndi(140, 360), 140, 360)));
  }
  for (const q of parts) { q.t++; q.x += q.vx; q.y += q.vy; q.vy += q.g; }
  parts = parts.filter(q => q.t < q.life);
  for (const q of pops) q.t++;
  pops = pops.filter(q => q.t < 50);
}

// ---------- 繪製 ----------
function drawBag(b) {
  if (b.dead) return;
  const sx = b.shake ? (b.shake % 2 ? 2 : -2) : 0, x = b.x + sx;
  px(x - 1, GY - 78, 2, 16, '#444');                                  // 吊繩
  px(x - 11, GY - 62, 22, 58, '#000'); px(x - 10, GY - 61, 20, 56, b.flash ? '#ffffff' : '#a8743c');
  px(x - 10, GY - 61, 6, 56, '#c8945c'); px(x - 10, GY - 30, 20, 3, '#6a4420');
  px(x - 9, GY - 4, 18, 3, 'rgba(0,0,0,.4)');
  for (let i = 0; i < 6; i++) px(x - 9 + i * 3, GY - 70, 2, 2, i < b.hp ? '#ff4040' : '#333');   // 血條
}
function drawPlay() {
  ctx.save();
  if (G.shake > 0) { G.shake--; ctx.translate(rndi(-2, 2), rndi(-1, 1)); }
  if (bg) ctx.drawImage(bg, 0, 0); else px(0, 0, W, H, '#20202a');
  bags.forEach(drawBag);
  px(P.x - 7, GY - 1, 14, 2, 'rgba(0,0,0,.4)');
  if (P.running || P.st === 'rise') drawChar(HERO, pose(), P.x - P.face * 6, P.y, P.face, { sil: '#3ab0ff', alpha: 0.4 });
  drawChar(HERO, pose(), P.x, P.y, P.face);
  for (const q of projs) { disc(q.x, q.y, 6, '#3ab0ff'); disc(q.x, q.y, 4, '#8ef0ff'); px(q.x - 1, q.y - 1, 2, 2, '#fff'); }
  for (const q of parts) px(q.x, q.y, q.s, q.s, q.col);
  for (const q of pops) text(q.str, q.x, q.y - Math.min(q.t, 20) * 0.6, { c: q.col, a: 'c', o: '#000' });
  ctx.restore();
  // HUD
  const sec = Math.max(0, Math.ceil(R.time / 60));
  px(W / 2 - 18, 3, 36, 26, '#000'); px(W / 2 - 17, 4, 34, 24, sec <= 10 ? '#5a0008' : '#1a1a22');
  text(String(sec).padStart(2, '0'), W / 2, 6, { s: 2, c: '#ffe060', a: 'c', o: '#000' });
  if (window.PORTRAITS && PORTRAITS[HERO]) { px(4, 4, 30, 30, '#ffd040'); ctx.drawImage(portraitImg, 5, 5, 28, 28); }
  text('SCORE ' + String(R.score).padStart(6, '0'), 38, 8, { c: '#ffffff', o: '#000' });
  text('打爆 ' + R.broken, 38, 21, { c: '#ffd040', o: '#000' });
  if (P.combo >= 3) text(P.combo + ' HIT', 8, 44, { s: 2, c: '#ffd040', o: '#300', grad: ['#ffffff', '#ffb020'] });
}

// 頭像（選角、HUD 用）
const portraitImg = new Image();
if (window.PORTRAITS && PORTRAITS[HERO]) portraitImg.src = PORTRAITS[HERO];

// ---------- 場景 ----------
const PAUSE_ITEMS = () => ['繼續', '重新開始', '回到標題', '聲音：' + (Audio2.muted ? '關' : '開')];
const SCENES = {
  boot: {          // 瀏覽器規定要先點一下才能出聲
    update() { if (Input.realPressed && G.st > 10) { Audio2.unlock(); go('title'); } },
    draw() {
      px(0, 0, W, H, '#000');
      text('沙包練習場', W / 2, 80, { s: 2, c: '#ffd040', a: 'c', o: '#300', grad: ['#ffffff', '#ff8a10'] });
      if (G.t % 60 < 42) text(isTouch ? '點一下畫面開始（開啟音效）' : '按任意鍵開始（開啟音效）', W / 2, 124, { c: '#fff', a: 'c' });
      text(VERSION, W - 6, 6, { c: '#5a5a6a', a: 'r' });
    },
  },
  title: {
    enter() { Audio2.play('title'); },
    update() {
      const I = Input.pressed;
      if (I.start || I.p || I.k) { Audio2.sfx('confirm'); newGame(); go('play'); Audio2.play('fight1'); }
      else if (I.up) { Audio2.sfx('blip'); go('changes'); }
    },
    draw() {
      if (bg) ctx.drawImage(bg, 0, 0);
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H);
      text('沙包練習場', W / 2, 30, { s: 4, a: 'c', c: '#ffd040', o: '#5a0000', grad: ['#fff6c0', '#ff8a10'] });
      text('30 秒內打爆越多沙包越好', W / 2, 92, { c: '#ffffff', a: 'c', o: '#000' });
      drawChar(HERO, 'idle' + (Math.floor(G.t / 22) % 2), W / 2, 186, 1);
      if (G.t % 60 < 40) text(isTouch ? '點一下畫面開始' : 'PRESS ENTER', W / 2, 192, { c: '#fff', a: 'c', o: '#000' });
      text(VERSION + '　↑ 更新紀錄　M 靜音', 6, 204, { c: '#8a8a9a', o: '#000' });
      text('最高 ' + G.best, W - 6, 204, { c: '#ffd040', a: 'r', o: '#000' });
    },
  },
  changes: {
    update() { if (G.st > 10 && (Input.pressed.start || Input.pressed.p || Input.pressed.k || Input.pressed.up)) go('title'); },
    draw() {
      px(0, 0, W, H, '#0a0006');
      text('更新紀錄', W / 2, 6, { s: 2, c: '#ffd040', a: 'c', o: '#300' });
      let y = 38;
      for (const [v, ...items] of CHANGELOG) {
        text(v, 10, y, { c: '#ff6060' });
        for (const it of items) for (let i = 0; i < it.length; i += 23) { text((i ? '　' : '・') + it.slice(i, i + 23), 58, y, { c: '#e0e0e8' }); y += 13; }
        y += 4;
      }
      text('按攻擊鍵返回', W / 2, H - 14, { c: '#9ad8ff', a: 'c' });
    },
  },
  play: {
    update() {
      if (G.paused) { pauseMenu(); return; }
      if (Input.pressed.pause || (Input.pressed.start && isTouch)) { G.paused = true; G.pi = 0; return; }
      if (G.hitstop > 0) { G.hitstop--; return; }     // 打中時停幾格，打擊感的關鍵
      if (--R.time <= 0) { P.st = 'win'; Audio2.stop(); Audio2.sfx('gong'); go('result'); return; }
      updatePlayer(); updateWorld();
    },
    draw() {
      drawPlay();
      if (!G.paused) return;
      ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, W, H);
      text('PAUSE', W / 2, 40, { s: 3, c: '#ffd040', a: 'c', o: '#000' });
      PAUSE_ITEMS().forEach((it, i) => { const on = i === G.pi; if (on) px(W / 2 - 60, 98 + i * 18, 120, 16, '#8a0010'); text((on ? '▶ ' : '　') + it, W / 2, 100 + i * 18, { c: on ? '#fff' : '#a0a0b0', a: 'c' }); });
    },
  },
  result: {
    enter() { Audio2.play('result'); if (R.score > G.best) { G.best = R.score; Store.set('best', G.best); this.newBest = true; } else this.newBest = false; },
    update() { if (G.st > 60 && (Input.pressed.start || Input.pressed.p || Input.pressed.k)) go('title'); },
    draw() {
      drawPlay();
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
      text('TIME UP', W / 2, 40, { s: 3, c: '#ff4040', a: 'c', o: '#000' });
      text('分數 ' + R.score + '　打爆 ' + R.broken + ' 個　最大連擊 ' + R.maxCombo, W / 2, 100, { c: '#fff', a: 'c', o: '#000' });
      if (this.newBest && G.t % 30 < 20) text('NEW RECORD!', W / 2, 120, { c: '#ffd040', a: 'c', o: '#000' });
      if (G.st > 60) text('按攻擊鍵回到標題', W / 2, 160, { c: '#9ad8ff', a: 'c', o: '#000' });
    },
  },
};
function pauseMenu() {
  const I = Input.pressed, n = PAUSE_ITEMS().length;
  if (I.up) G.pi = (G.pi + n - 1) % n;
  if (I.down) G.pi = (G.pi + 1) % n;
  if (I.pause) { G.paused = false; return; }
  if (I.p || I.start) {
    if (G.pi === 0) G.paused = false;
    else if (G.pi === 1) { G.paused = false; newGame(); }
    else if (G.pi === 2) { G.paused = false; Audio2.stop(); go('title'); }
    else Audio2.toggleMute();
  }
}

// ---------- 桌墊：遊戲畫面下方的出招表（像街機台面） ----------
function buildMat() {
  const mat = document.getElementById('mat');
  if (!mat) return;
  const basic = isTouch ? ['左搖桿：移動／往上跳／往下蹲', '拳・腳：攻擊', '飛彈・迴旋：直接放必殺', 'START：暫停']
    : ['方向鍵／WASD：移動・↑跳・↓蹲', 'J 拳　K 腳', 'L 飛彈　I 迴旋（快捷）', 'Esc 暫停　M 靜音'];
  const moves = [['↓↓＋拳', '飛彈'], ['↓↓＋腳', '迴旋'], ['→→ 或按住', '跑步']];
  mat.innerHTML = `<div class="mat-head">出招表 COMMAND LIST<span><button id="matLog">${VERSION} 更新紀錄</button> <button id="matToggle">收起</button></span></div>
    <div class="mat-body"><div class="card basic"><div class="nm">基本操作</div><ul>${basic.map(b => `<li>${b}</li>`).join('')}</ul></div>
    <div class="card on"><div class="top">${window.PORTRAITS && PORTRAITS[HERO] ? `<img src="${PORTRAITS[HERO]}" alt="" draggable="false">` : ''}<div class="nm">範例角色<small>沙包練習場</small></div></div>
    <ul>${moves.map(([c, n]) => `<li><b>${c}</b>${n}</li>`).join('')}</ul></div></div>`;
  document.getElementById('matLog').onclick = () => {
    const d = document.getElementById('logDlg');
    d.querySelector('div').innerHTML = CHANGELOG.map(([v, ...it]) => `<h4>${v}</h4><ul>${it.map(x => `<li>${x}</li>`).join('')}</ul>`).join('');
    d.showModal();
  };
  document.getElementById('matToggle').onclick = () => { document.body.classList.toggle('mat-off'); fit(); };
  fit();
}
buildMat();
addEventListener('keydown', e => { if (e.code === 'KeyM') Audio2.toggleMute(); });

// ---------- 主迴圈（固定 60fps 邏輯，畫面跟著瀏覽器更新） ----------
const BG_READY = new Promise(res => {
  const u = window.BG_ART && Object.values(BG_ART)[0];
  if (!u) return res();
  const im = new Image(); im.onload = () => { bg = im; res(); }; im.onerror = res; im.src = u;
});
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { Input.update(); SCENES[G.scene].update(); G.t++; G.st++; acc -= 1000 / 60; }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  SCENES[G.scene].draw();
  requestAnimationFrame(frame);
}
const fontReady = document.fonts ? Promise.race([document.fonts.load(FONT), new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
newGame();
Promise.all([fontReady, SPRITES_READY, BG_READY]).then(() => { textCache.clear(); go('boot'); requestAnimationFrame(frame); });
