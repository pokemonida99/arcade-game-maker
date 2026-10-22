// 開發測試用（遊戲不會載入）：在瀏覽器 console 或自動化工具注入
//   const s = document.createElement('script'); s.src = '/tools/dev.js'; document.body.appendChild(s);
// 預覽分頁被隱藏時 requestAnimationFrame 會停，所以測試用 step() 手動推進遊戲格數
window.step = (n = 1, draw = true) => { for (let i = 0; i < n; i++) { Input.update(); SCENES[G.scene].update(); G.t++; G.st++; } if (draw) { ctx.setTransform(1, 0, 0, 1, 0, 0); SCENES[G.scene].draw(); } };
window.tap = (b, n = 2) => { Input.key[b] = true; step(n); Input.key[b] = false; step(1); };
window.hold = (b, n) => { Input.key[b] = true; step(n); Input.key[b] = false; step(1); };
// 截圖：把畫布放大後 POST 到本機的 snapshot_server.py（預設 port 4211），存成 PNG 給你看
window.snap = async (name, scale = 3, port = 4211) => {
  const [b, g] = mkCanvas(W * scale, H * scale); g.imageSmoothingEnabled = false; g.drawImage(cv, 0, 0, b.width, b.height);
  return (await fetch('http://localhost:' + port, { method: 'POST', body: name + '|' + b.toDataURL() })).status;
};
'dev tools ready';
