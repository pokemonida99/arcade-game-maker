# 7. 上線

## 第一次
```bash
cd <專案>
git init -b main && git add -A && git commit -m "v1.0：……"
gh repo create pokemonida99/<名稱> --public --source=. --remote=origin --push --description "……"
gh api -X POST repos/pokemonida99/<名稱>/pages -f "source[branch]=main" -f "source[path]=/"
```
.gitignore：`work/`（GPT 原圖、參考圖、log）、使用者給的原始設定圖與照片、大檔（電影、mp4）。

## 每次改版
1. `<skill>/scripts/bump.sh`：index.html 所有 `?v=` 一起加一（不然手機吃舊快取）。改之前先看現值，可能別的 session 已經加過。
2. `game.js` 的 `VERSION` 改新版號，`CHANGELOG` 最上面加一筆（用使用者看得懂的話寫）。
3. README 的玩法／角色表更新。
4. commit 訊息寫版號＋改了什麼。
5. **push 前先問使用者**（除非他這次說「做好就推」）。
6. 等 Pages 更新：`until curl -s https://pokemonida99.github.io/<名稱>/ | grep -q 'game.js?v=<新號>'; do sleep 10; done`
7. 開線上版確認：字型、圖、音效載入，console 沒有錯誤。

## 回報給使用者
- 網址、版號、手機要重新整理一次。
- 做了什麼（用玩家看得到的方式描述）、怎麼玩（新按鍵、新指令）。
- 測了什麼、**哪些沒驗證到**（例如沒有實機聽聲音、沒有在 iPhone 上試連點）。
