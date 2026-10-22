// 角色動作格：讀 SPRITE_DATA（slice.py 產生的圖集），切成一格一格的小畫布，畫的時候以「腳底中心」對齊
'use strict';

// 沒有獨立畫的動作借用相近的格（例如沒有 D 表時，跑步借走路）
const FRAME_ALIAS = {
  run0: 'walk0', run1: 'walk1', run2: 'walk2', run3: 'walk3', fall: 'jump', ckick0: 'crouch',
  jpunch: 'jkick', win1: 'win0', yuck: 'hurt', stand: 'idle0',
};
const FRAMES = {};
const SPRITES_READY = Promise.all(Object.entries(window.SPRITE_DATA || {}).map(([cid, d]) => new Promise(res => {
  const im = new Image();
  im.onload = () => {
    FRAMES[cid] = {};
    for (const [n, [fx, fy, fw, fh, ax]] of Object.entries(d.frames)) {
      const [c, g] = mkCanvas(fw, fh);
      g.drawImage(im, fx, fy, fw, fh, 0, 0, fw, fh);
      FRAMES[cid][n] = { c, ox: ax, oy: fh };
    }
    res();
  };
  im.onerror = () => res();
  im.src = d.img;
})));

function getFrame(cid, name) {
  const fr = FRAMES[cid];
  if (!fr) return null;
  return fr[name] || fr[FRAME_ALIAS[name]] || fr.idle0 || null;
}
function getSil(f, col) {          // 單色剪影（殘影、受擊閃白）
  if (!f.sil) f.sil = {};
  if (!f.sil[col]) f.sil[col] = silhouette(f.c, col);
  return f.sil[col];
}
// 畫角色：x,y = 腳底中心；face 1 向右、-1 向左；opt: { scale, alpha, sil }
function drawChar(cid, name, x, y, face, opt = {}) {
  const f = getFrame(cid, name);
  if (!f) return;
  const img = opt.sil ? getSil(f, opt.sil) : f.c, k = opt.scale || 1;
  ctx.save();
  if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (face < 0) ctx.scale(-1, 1);
  ctx.drawImage(img, Math.round(-f.ox * k), Math.round(-f.oy * k), img.width * k, img.height * k);
  ctx.restore();
}
