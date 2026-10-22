# 5. 音樂與音效

## 音序器（js/audio.js）
一首歌是一個物件，一格＝十六分音符：
```js
fight1: {
  bpm: 152, len: 64,                 // len＝總格數（16 格一小節）
  lead: parse(`A4 . C5 . E5 . ...`), // 主旋律（25% 脈衝波）；'.' 休止，音長自動延到下一個音
  lead2: parse(`E4 . . . C5 ...`),   // 和聲（50% 脈衝波，小聲）
  arp: ['A3 C4 E4', 'F3 A3 C4'],     // 每段一個和弦，自動快速琶音（12.5% 脈衝波，很小聲）
  bass: parse(`A2 . A3 . ...`),      // 三角波
  drum: 'k.h.s.h.k.k.s.h.',          // k 大鼓 s 小鼓 h 閉鈸 o 開鈸 c 銅鈸（長度可以比 len 短，會循環）
  once: true,                        // 只播一次（開場、結算）
}
```
寫完用 node 檢查每條長度等於 `len`（少一格整首會錯拍）。升記號寫 `A#`，沒有降記號（B♭ 寫 A#）。

## 每個場景一首
| 場景 | 建議 |
|---|---|
| 開場（約 7 秒） | 號角感、四小節，每小節對一個畫面事件（品牌→商品→角色→標題） |
| 標題 | 中速、記得住的主旋律 |
| 選角 | 輕快大調 |
| 每關戰鬥 | 不同調性、速度：搖滾、律動、高速、未來感 |
| 剩 10 秒 | 更快的催促曲 |
| 結算／結局 | 勝利短句／溫暖長版 |

使用者給 mp3 時直接用他的（`<audio>` 或 AudioBuffer），音效仍可合成。

## 音效（SFX）
打擊 hit／hitBig、揮空 whiff、刷洗 scrub、飛彈 proj、上升 rise、衝刺 rush、閃亮 sparkle、選單 blip／cursor／confirm／decide、計時 tick、時間到 gong、完美 perfect、開場 whoosh／impact、煙火 rocket／firework、選角每人代表音 `ch_<id>`。
音量：音效匯流排 0.55、音樂 0.22；示範模式設 `Audio2.quiet = true` 不出聲。

## 瀏覽器規定
- iPhone 要在使用者點擊時解鎖（core.js 已在 touchend／click 呼叫 `Audio2.unlock()`），所以要有「點一下開始」的開機畫面。
- 沒辦法實機聽的時候要跟使用者說「只確認有產生聲音、沒有報錯」。
