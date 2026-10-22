# 背景、道具（車子、箱子…）、頭像：GPT 原圖 → 遊戲尺寸，打包成 js/art_data.js
# 設定在專案根目錄的 art_config.json：
#   { "screen": [384, 216],
#     "backgrounds": { "garage": "work/art/bg_stage1.png" },
#     "props": { "car": { "src": "work/art/prop_car.png", "width": 240 } },
#     "portraits": { "hero": "work/art/p_hero.png" } }
# 用法：python3 <skill>/scripts/stage_art.py
# 輸出：window.BG_ART / PROP_ART / PORTRAITS（64px）/ PORTRAITS_BIG（112px），都是 dataURL
import io, base64, json, os
from PIL import Image

CFG = json.load(open(os.environ.get('ART_CONFIG', 'art_config.json'), encoding='utf-8'))
W, H = CFG.get('screen', [384, 216])


def url(im):
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


def is_mag(r, g, b): return r > 150 and b > 150 and g < 110


def key_magenta(im):
    im = im.convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if is_mag(r, g, b): px[x, y] = (0, 0, 0, 0)
    return im.crop(im.getbbox())


def hard_alpha(sm):
    p = sm.load()
    for y in range(sm.height):
        for x in range(sm.width):
            r, g, b, a = p[x, y]
            p[x, y] = (0, 0, 0, 0) if a < 140 or is_mag(r, g, b) else (r, g, b, 255)
    return sm.crop(sm.getbbox())


def background(src):
    # 裁成 16:9（保留底部地面），縮成畫面大小、限制顏色數讓它更像像素畫
    im = Image.open(src).convert('RGB')
    tw = im.width; th = round(tw * H / W)
    if th > im.height: th = im.height; tw = round(th * W / H)
    x0 = (im.width - tw) // 2; y0 = im.height - th
    im = im.crop((x0, y0, x0 + tw, y0 + th)).resize((W, H), Image.LANCZOS)
    return im.quantize(colors=96, method=Image.Quantize.MAXCOVERAGE, dither=Image.Dither.NONE).convert('RGB')


def prop(cfg):
    im = key_magenta(Image.open(cfg['src']))
    w = cfg['width']; h = round(im.height * w / im.width)
    return hard_alpha(im.resize((w, h), Image.LANCZOS))


def is_bg_white(c): return min(c[:3]) > 228 and max(c[:3]) - min(c[:3]) < 22


def portrait(src, size):
    # 白底頭像：只從上緣和兩側上半部往內去白底（避免把碰到底邊的白襯衫挖掉）
    im = Image.open(src).convert('RGBA'); s = min(im.size)
    im = im.crop(((im.width - s) // 2, 0, (im.width - s) // 2 + s, s)).resize((size, size), Image.LANCZOS)
    q = im.convert('RGB').quantize(colors=48, method=Image.Quantize.MAXCOVERAGE, dither=Image.Dither.NONE).convert('RGBA')
    w, h = q.size; px = q.load(); seen = set()
    st = [(x, 0) for x in range(w)] + [(x, y) for y in range(int(h * 0.7)) for x in (0, w - 1)]
    while st:
        x, y = st.pop()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h): continue
        seen.add((x, y))
        if not is_bg_white(px[x, y]): continue
        px[x, y] = (0, 0, 0, 0); st += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return q


out = ['// 由 stage_art.py 產生，勿手改']
out.append('window.BG_ART = ' + json.dumps({k: url(background(v)) for k, v in CFG.get('backgrounds', {}).items()}) + ';')
out.append('window.PROP_ART = ' + json.dumps({k: url(prop(v)) for k, v in CFG.get('props', {}).items()}) + ';')
P = CFG.get('portraits', {})
out.append('window.PORTRAITS = ' + json.dumps({k: url(portrait(v, 64)) for k, v in P.items()}) + ';')
out.append('window.PORTRAITS_BIG = ' + json.dumps({k: url(portrait(v, 112)) for k, v in P.items()}) + ';')
os.makedirs('js', exist_ok=True)
open(CFG.get('out', 'js/art_data.js'), 'w').write('\n'.join(out) + '\n')
print('backgrounds', len(CFG.get('backgrounds', {})), 'props', len(CFG.get('props', {})), 'portraits', len(P))
