# 3. 切圖與打包

## 角色動作表 → sprite_data.js
```bash
cp <skill>/template/slice_config.json .      # 改 chars、sheet_sets、target_h
python3 <skill>/scripts/slice.py work/atlas_preview.png
python3 <skill>/scripts/check_sprites.py work/check     # 碎片、殘留洋紅、高度異常、腳底對不齊
```
做了什麼：
1. 洋紅去背：分格用寬門檻（不讓毛邊黏住兩格）、去背用窄門檻（不挖掉粉紅色衣服）。
2. 分格：找連在一起的塊 → 依位置排成「上排左到右、下排左到右」。數量不對時改用「中心點落在哪一格」分組，再不行就硬切 4×2。
3. 每格只留本體＋貼著本體的效果（槍口火光、煙），去掉鄰格碎片與 GPT 順手畫的東西。
4. 依該角色 `idle0` 的高度算縮放倍率（`target_h`，大約 70～80 遊戲像素），同一角色所有格用同一個倍率。
5. 對齊點：站著的動作用「最下面幾排的中位數」（腳），跳、走、跑、躺用「重心」（`air` 清單）——不然走路會左右抖。
6. 打包成一條橫向圖集，調色盤 PNG（8 位角色 24 格約 290KB）。

## 常見問題
| 狀況 | 處理 |
|---|---|
| 「找到 6 格（應為 8）」 | 會自動改用依格分組；還不行就重生那張（提示詞強調格子不要碰到） |
| GPT 排序跑掉 | `order_fix`：`{"hero_C": [0,1,2,3,5,4,6,7]}` |
| 走路左右抖 | 把走路、跑步放進 `air` |
| 手上道具被當成本體切進來 | `strict`：`[["hero","throw1"]]` |
| 某格多了地上的石頭 | `keep_largest`：只留最大一塊 |
| 粉紅衣服被挖洞 | 去背門檻太寬（bg_mask 的 r/b > 190、g < 110） |

## 背景、道具、頭像 → art_data.js
```bash
cp <skill>/template/art_config.json .
python3 <skill>/scripts/stage_art.py
```
- 背景：裁 16:9（保留底部地面）→ 縮成 384×216 → 限 96 色。
- 道具：洋紅去背 → 縮成指定寬度 → 硬邊 alpha。
- 頭像：去白底（只從上緣和兩側上半部往內填，不挖掉碰到底邊的白襯衫）→ 64／112。

## 官方商品照
官網照片通常是含價格、促銷字的廣告圖：只裁商品本體（瓶身）、做成有框的商品卡，不要放價格（特價過期遊戲裡還寫舊價）。參考 GitHub pokemonida99/hjaec-fighter 的 tools/products.py。
