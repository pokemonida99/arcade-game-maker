# 4. 遊戲引擎

從 `<skill>/template/` 複製起手（可玩：沙包練習場）。

## 檔案
| 檔案 | 內容 |
|---|---|
| `index.html` | 畫布、手機觸控按鍵（搖桿＋拳腳飛彈迴旋超＋START）、桌墊 `#mat`、更新紀錄對話框；**全域 CSS 不能選取、不能拖曳、點擊不閃藍框** |
| `js/core.js` | 384×216 畫布與整數倍縮放、像素文字 `text()`（俐方體 11 號二值化＋描邊＋漸層，有快取）、輸入（鍵盤／手把／觸控合併，`pressed`、`held`、指令 `motion()`、`realPressed`）、`noZoomNoSelect()`、`buzz()` 震動、`Store`（localStorage） |
| `js/audio.js` | 音序器＋合成音效（見 05-audio.md） |
| `js/sprites.js` | 讀 `SPRITE_DATA` 切成小畫布；`drawChar(角色, 動作, x, y, 面向, {scale, alpha, sil})` 以腳底中心對齊；`FRAME_ALIAS` 讓缺的動作借用相近格 |
| `js/game.js` | 版本／更新紀錄、招式表、角色狀態機、打擊判定、粒子、HUD、場景、桌墊、主迴圈 |

## 主迴圈
固定 60fps 邏輯（累積時間，一次可跑多格）＋瀏覽器畫面更新。每格：`Input.update()` → 場景 `update()`；畫面：場景 `draw()`。
場景物件 `{ enter(), update(), draw() }`，用 `go('名稱')` 切換（`G.st` 是進場後第幾格，做演出計時）。

## 角色狀態機
`idle / walk（含 running）/ crouch / jump / attack / throw / rise / rush / hurt / win …`
- 普攻用招式表：`frames`（[動作, 格數]…）、`active`（有效格）、`box`（相對腳底、面向右）、威力。打中後可以接下一招（連段）。
- 必殺先判斷，再判斷普通輸入。指令：`Input.motion(['down','down'], 面向)`；蓄力：記錄按住某方向的格數（≥36 格，放開後 10 格內有效）。
- 跑步：連按兩下方向，或按住同方向約 28 格；跑步中按拳＝衝刺連打。
- 多段技（旋轉、衝刺、魚雷）hitstop 只停 1 格，不然會卡頓；必殺中的無敵不要閃爍。

## 打擊感
hitstop（打中停 3～6 格）、畫面震動、火花、碎片／泡沫粒子、連擊數、分數跳字、手機震動。

## 判定設計提醒
- 站著打中段、蹲著打下段、跳起來打上段；低處目標（車底）把蹲姿判定加大，或讓打擊有「往下流」的附加效果。
- 會移動的目標（飛天車）：在 update 裡改它的 y（起飛、降落充電），所有判定自動跟著。

## 必備介面
- 開機「點一下開始」→ 開場動畫（可跳過）→ 標題（版本號、↑ 更新紀錄、M 靜音、最高分）→ 選角（每人代表音、出招表）→ 關卡介紹（第一關顯示操作）→ 遊戲 → 結算 → 結局 → 排行榜（三字名字輸入）。
- 標題放著不動：排行榜 → 電腦示範（DEMO PLAY）→ 開場動畫 → 標題。
- 暫停：繼續／出招表／重新開始這一關／回到標題／聲音。
- 桌墊：電腦版在畫面正下方（可收起），手機直拿在畫面與按鍵中間（可左右滑），手機橫拿隱藏。
- 版本：`VERSION`、`CHANGELOG`；標題按 ↑、桌墊按鈕都看得到。

## 防誤觸（noZoomNoSelect）
擋 gesturestart／兩指 touchmove／320ms 內第二次 touchend（連點放大）／dblclick／selectstart／dragstart／contextmenu／Ctrl＋滾輪／Ctrl＋＋－0。觸控按鍵用 pointer 事件，不受影響；需要捲動的區塊設 `touch-action: pan-x` 並排除。
