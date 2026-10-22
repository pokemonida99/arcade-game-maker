# 6. 測試

## 為什麼要手動推進
內建預覽分頁常常在背景，`requestAnimationFrame` 不會跑，遊戲停住。所以測試不要等畫面，改成：
```js
// 在預覽分頁注入
const s = document.createElement('script'); s.src = '/tools/dev.js'; document.body.appendChild(s);
step(60);            // 推進 60 格（1 秒）並畫一張
tap('start');        // 按一下
hold('right', 40);   // 按住 40 格
await snap('play.png');   // 截圖存檔（要先開 snapshot_server.py）
```
截圖伺服器：`python3 <skill>/scripts/snapshot_server.py &`（port 4211，存在它自己的資料夾）。拿到 PNG 用 Read 看。

## 自動遊玩 bot
參考 hjaec-fighter/tools/bot.js：每格決定按鍵（找最髒的位置走過去、隨機出拳腳、能量滿放超必殺、附近有敵人先打敵人），跑完回傳 15 秒／30 秒／結束時的進度。
- `sweep([0.6, 0.9])`：每個角色×每一關、新手（60% 時間在按）與高手（90%）各跑一次。
- 目標：第一關高手能滿分；之後一般玩家 85～95%；不同角色差距不要太大。
- 改數值後重跑，結果貼給使用者。

## 一定要跑的全流程
開機 → 開場 → 標題 → 選角 → 每一關 → 結算 → 結局 → 名字輸入 → 排行榜 → 待機示範 → 開場，console 沒有錯誤。
測完清掉 localStorage 的排行榜，不要把測試分數留在使用者的瀏覽器。

## 版面
- `resize_window` 切手機直／橫，量觸控按鍵的位置（getBoundingClientRect），確認不互相蓋住、不蓋到畫面重點。
- 截圖檢查文字有沒有超出畫面（中文一個字 12 像素寬，384 寬的畫面一行最多約 30 字）。

## 常見錯誤
- 顏色寫 `#fff` 三碼：舊版 hex2rgb 會變藍色（範本已修正）。
- 改了 js 沒改 `?v=`：手機吃到舊快取。
- 背景沒載入時 `BG[key]` 不存在：要有備援。
