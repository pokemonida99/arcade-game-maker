#!/bin/zsh
# 平行跑一批 GPT 生圖；已經有輸出的就跳過（想重畫某張：刪掉 work/art/<名稱>.png 再跑）
# 用法（在專案根目錄）：<skill>/scripts/run_jobs.sh [工作清單.jsonl]
# 清單每行：["輸出名", "提示詞", ["參考圖1", ...]]（用 make_jobs_example.py 產生）
# ChatGPT 生圖有額度：一次跑幾十張可能中途用完，約半小時後恢復，所以大批要分批。PAR 控制同時幾張（預設 4）
SKILL=$(cd "$(dirname $0)" && pwd)
JOBS=${1:-work/jobs/jobs.jsonl}; PAR=${PAR:-4}; OUT_DIR=${OUT_DIR:-work/art}
mkdir -p work/jobs "$OUT_DIR"
python3 - "$JOBS" <<'PY' | while read n; do [[ -f $OUT_DIR/$n.png ]] || echo $n; done | xargs -P $PAR -I{} zsh -c "OUT_DIR=$OUT_DIR $SKILL/gen.sh {} \"\$(cat work/jobs/{}.prompt)\" \$(cat work/jobs/{}.refs)"
import json, sys
for l in open(sys.argv[1], encoding='utf-8'):
    if not l.strip(): continue
    n, p, r = json.loads(l)
    open(f'work/jobs/{n}.prompt', 'w').write(p); open(f'work/jobs/{n}.refs', 'w').write('\n'.join(r))
    print(n)
PY
