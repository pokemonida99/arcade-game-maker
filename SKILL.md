---
name: arcade-game-maker
description: 街機像素遊戲工坊：做 90 年代街機風格的網頁小遊戲（格鬥、打車／打沙包獎勵關、橫向捲軸清版、Boss 戰），用 GPT 畫逐格動作圖與像素背景、程式切格對齊、WebAudio 合成配樂、手機觸控、上線到 GitHub Pages。Use when the user wants a retro / arcade / pixel-art web game, a beat-'em-up or fighting game, a Street Fighter–style bonus stage, sprite sheets made with GPT, or mentions 街機、快打、清版、橫向捲軸、像素遊戲、復古小遊戲、動作表、出招表、桌墊.
---

# 街機像素遊戲工坊（arcade-game-maker）

做過《紅分子 亮車快打》（快打旋風打車關反過來：把髒車打亮）與《讓子彈飛：鵝城快打》（橫向清版）累積的完整做法。新遊戲照 0 → 7 的順序做；每一步的細節在 `references/`，工具在 `scripts/`，可以直接改的可玩範本在 `template/`（沙包練習場）。

本 skill 的位置：`~/.claude/skills/arcade-game-maker/`（連到 `/Users/hermes/Public/0720/arcade-game-maker/`，GitHub：pokemonida99/arcade-game-maker）。下面用 `<skill>` 代表這個資料夾。

## 0. 開工前先問清楚（不要猜）
- 題材與玩法：格鬥／獎勵關（打物件）／橫向清版／騎乘關？幾關？試玩版要做到哪？
- 角色：使用者有沒有給設定圖、三視圖、劇照、劇本？**改編作品的造型、台詞、年代一律照原作**（先搜尋劇照、跟使用者要劇本），不要自創；**真人照片只當參考，臉畫成原創像素臉**；暴露的參考圖只拿臉部裁切。
- 品牌合作：商品圖優先用官方照片（只裁商品本體、避開價格促銷字）；沒授權的商標不要畫進去（例如「像特斯拉的電動車」不放車廠標誌）。
- 經典招式要「像但不一樣」：動作與指令都換掉（例：過肩拋投＋↓↓拳，取代雙掌氣功＋四分之一圓）；使用者點名要某角色的招式風格時才做致敬版（例：將軍風蓄力衝刺）。
- 每個角色的招式、必殺姿勢要真的不同（不要整批同一句提示詞）。
- 上線：做好後 **push 到 GitHub Pages 前先問使用者**，除非他這次明講「做好就推」。

## 1. 企劃 → 文件（references/01-planning.md）
寫 `docs/`：故事分幕、角色表（定位、速度／力量／跳躍、三招必殺＋超必殺、指令）、關卡表（目標、敵人、頭目、時間）、要用的台詞（標出處）。

## 2. GPT 美術（references/02-gpt-art.md）
- 一律用 ChatGPT.app 內建 codex 生圖：`<skill>/scripts/gen.sh`（單張）、`<skill>/scripts/run_jobs.sh`（平行一批，已生的跳過）。工作清單從 `<skill>/scripts/make_jobs_example.py` 複製改。
- 角色：頭像（白底）＋ 動作表 A 移動／B 普攻／C 必殺（每人專屬）／D 走路跑步（拿 A 表當參考保持畫風）；**洋紅底 #FF00FF、4×2 格、面向右、腳底同一條線、格子不要碰到**。
- 背景：16:9、底部 22% 是可以走的地面、中間留空、不要字（招牌字之後用程式疊）。道具（車子、箱子）：洋紅底、側面。
- GPT 有額度：一次幾十張會中途用完（約半小時恢復），大批分批跑。
- 生完要逐張看：多手、多手指、手太長、衣服跟設定不符 → 刪掉那張重生。

## 3. 切圖與打包（references/03-slicing.md）
- 角色：專案根目錄放 `slice_config.json`（範例 `<skill>/template/slice_config.json`），跑 `python3 <skill>/scripts/slice.py 預覽.png` → `js/sprite_data.js`。看預覽圖的紅線（腳底對齊點），跑 `python3 <skill>/scripts/check_sprites.py` 檢查碎片、殘留洋紅、高度異常。
- 背景／道具／頭像：`art_config.json` ＋ `python3 <skill>/scripts/stage_art.py` → `js/art_data.js`。
- 都打包成 dataURL 的 js 檔：`file://` 也能開、canvas 讀像素不會被跨域擋。

## 4. 遊戲引擎（references/04-engine.md）
從 `<skill>/template/` 複製起手：384×216 內部解析度、固定 60fps 邏輯、像素字型（俐方體 11 號，OFL 可商用）、鍵盤／手把／手機觸控、腳底對齊畫角色、打擊停頓（hitstop）、粒子、HUD、暫停選單、桌墊出招表、版本與更新紀錄。
**必備**：一開始就防誤觸放大與選取（core.js 的 `noZoomNoSelect()`）；標題畫面顯示版本號、按 ↑ 看更新紀錄；不做每日登入、儲值、等時間這類留人機制。

## 5. 音樂與音效（references/05-audio.md）
`js/audio.js` 是 WebAudio 音序器：每首有主旋律、和聲、琶音、貝斯、鼓；場景各一首（開場、標題、選角、每關戰鬥、剩 10 秒、結算、結局）。音效全部合成（打擊、揮空、必殺、選角代表音、煙火）。使用者給 mp3 時就用他的。第一次進遊戲要「點一下開始」才能出聲（iPhone 規定）。

## 6. 測試（references/06-testing.md）
預覽分頁常被隱藏、requestAnimationFrame 不跑 → 注入 `template/tools/dev.js`，用 `step()` 手動推進格數、`tap()` 按鍵、`snap()` 截圖（要先開 `<skill>/scripts/snapshot_server.py`）。寫自動遊玩 bot 跑每個角色×每一關，看通關率調難度；全流程（開機 → 結局 → 排行榜 → 示範）跑一次沒有錯誤才算完成。

## 7. 上線（references/07-release.md）
GitHub 公開 repo ＋ Pages（push main 即部署）。每次改 js：`index.html` 所有 `?v=` 加一（`<skill>/scripts/bump.sh`），`VERSION` 與 `CHANGELOG` 加一筆。等 Pages 更新後開線上版確認載入正常。

## 使用者偏好清單（每次都要）
見 `references/checklist.md`：交付前逐條對過。

## 範例
- 可玩範本：`template/`（線上：https://pokemonida99.github.io/arcade-game-maker/template/ ）
- 作品展示頁：https://pokemonida99.github.io/arcade-game-maker/
- 完整作品原始碼：`/Users/hermes/Public/0720/hjaec-fighter/`（格鬥／獎勵關）、`/Users/hermes/Public/0720/bullets-fly/`（橫向清版、騎馬關、劇情過場）
