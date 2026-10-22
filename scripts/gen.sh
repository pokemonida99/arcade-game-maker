#!/bin/zsh
# 用 ChatGPT.app 內建的 codex 生一張圖
# 用法（在專案根目錄）：<skill>/scripts/gen.sh <輸出名> "<提示詞>" [參考圖...]
# 結果存到 $OUT_DIR/<輸出名>.png（預設 work/art）；log 在 work/gen-<輸出名>.log
OUT_DIR=${OUT_DIR:-work/art}
mkdir -p "$OUT_DIR" work
name=$1; prompt=$2; shift 2
args=()
for f in "$@"; do args+=(-i "$f"); done
log=work/gen-$name.log
/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex exec --skip-git-repo-check \
  "Generate one image with your image generation tool: $prompt Do not run any shell commands." "${args[@]}" > $log 2>&1 </dev/null
sid=$(grep -m1 -o 'session id: [0-9a-f-]*' $log | awk '{print $3}')
imgs=(~/.codex/generated_images/${sid:-NONE}/*.png(N.om)); img=${imgs[1]}   # 沒圖時不能用 ls（會列出目前資料夾）
if [[ -n $sid && -n $img && -f $img ]] && cp "$img" "$OUT_DIR/$name.png"; then echo "OK $name"; else echo "FAIL $name (see $log)"; fi
