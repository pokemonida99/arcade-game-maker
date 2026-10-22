# GPT 生圖工作清單範例：頭像、四張動作表（A 移動／B 普攻／C 必殺／D 走路跑步）、背景、道具
# 複製到專案的 work/make_jobs.py，改 CH（角色）、C_POSES（每人專屬必殺）、BGS、PROPS 後執行：
#   python3 work/make_jobs.py && <skill>/scripts/run_jobs.sh
import json, os

# 共用的動作表規則：洋紅底、4×2 格、面向右、腳底同一條線、格與格不要碰到
SHEET = ("Pixel art sprite sheet for a 1990s 16-bit arcade fighting game, ONE character drawn 8 times in a grid of 4 columns and 2 rows. "
 "Full body in every cell, side view facing RIGHT, identical character size and proportions in every cell, feet on the same baseline near the bottom of each cell, "
 "generous empty space around each pose, nothing cropped, poses must not touch or overlap each other. "
 "Crisp large visible pixels, bold dark outline, 3-4 tone cel shading, limited palette, no anti-aliasing, no blur. "
 "Background: one flat solid pure magenta (#FF00FF) color everywhere, no floor, no shadows, no grid lines, no borders, no text, no labels, no numbers. "
 "Keep the hairstyle, glasses, clothing and colors exactly as in the reference images; do not add props, jewelry or accessories that are not in the reference. ")
# 選角頭像（白底，之後去背）
PORT = ("16-bit 1990s arcade fighting game character-select portrait, true pixel art with visible square pixels, bust shot showing head and shoulders, "
 "body turned slightly in a 3/4 view facing right, eyes looking at the viewer, bold dark outline, cel shading with 3-4 tones per color, limited palette, no anti-aliasing. "
 "Solid flat pure white background, no text, no frame, no border, square 1:1 image. Keep the hairstyle, glasses and clothing exactly as in the reference image; "
 "do not add accessories. Stylize the face as an original illustrated game character, not a photo. ")
A = ("1) fighting stance with both fists up, 2) the same fighting stance slightly lower as if breathing, 3) walking forward with the left leg stepping forward, 4) walking, legs passing each other, "
     "5) walking forward with the right leg stepping forward, 6) walking, legs passing each other again, 7) low crouch with fists up, 8) jumping in the air with both knees tucked up")
B = ("1) punch wind-up with the fist pulled back, 2) straight punch fully extended forward at chest height, 3) kick chamber with the front knee raised high, 4) side kick fully extended forward at waist height, "
     "5) crouching punch extended forward, 6) crouching low sweep kick with one leg extended forward along the ground, 7) flying kick in mid-air with one leg extended forward, 8) victory pose with one fist raised high and a big smile")
D = ("1) walking: front leg stepping far forward with heel touching down, long stride, arms swinging opposite to legs, 2) walking: weight on the front foot, the back leg lifting off the ground, "
     "3) walking: the OTHER leg stepping far forward, 4) walking: weight on that foot, the other leg lifting, "
     "5) running fast: leaning forward, one knee driving up high, arms pumping, 6) running: both feet off the ground, legs wide apart, "
     "7) running: the OTHER knee driving up high, 8) running: both feet off the ground the other way")

# 角色：id → (外觀描述＝只寫參考圖看得到的東西, [參考圖])。參考圖若是真人照，只用臉部裁切、而且畫成原創像素臉
CH = {
    'hero': ("young woman with a short brown bob, brown beret, round glasses, cream knit sweater, navy floral mini skirt, brown ankle boots",
             ['work/ref/hero.png']),
}
# 每個角色的必殺動作表要「各不相同」，不要整批同一句提示詞
C_POSES = {
    'hero': "1) winding up an overhand throw holding a small glowing crystal, 2) mid-throw, 3) follow-through, empty hand, 4) spinning with arms stretched out, front view, "
            "5) the same spin seen from the back, 6) quick palm strike, 7) palm strike with the other hand, 8) knocked back, recoiling in pain",
}
BG = ("16-bit 1990s arcade fighting game stage background, pixel art, wide 16:9 landscape, flat straight-on side view, the ground is a flat walkable floor strip across the whole bottom 22% of the image, "
      "the middle of the scene is open and empty for the fighters (no people, no animals), crisp pixels, rich detail, no text, no letters, no numbers, no logos. Scene: ")
BGS = {'bg_stage1': "interior of a garage at night with hanging lamps and shelves of bottles"}
PROP = ("16-bit 1990s arcade pixel art of a single object in exact side view, the whole object visible, crisp large pixels, bold dark outline, glossy shading, "
        "generic design with no brand logos and no text, plain flat solid pure magenta (#FF00FF) background, no ground, no shadow. Object: ")
PROPS = {'prop_car': "a bright red 1980s sedan facing LEFT"}

jobs = []
for cid, (desc, refs) in CH.items():
    jobs.append((f'p_{cid}', PORT + f"Character: {desc}.", refs[:1]))
    for sh, poses in (('A', A), ('B', B), ('C', C_POSES[cid]), ('D', D)):
        # D 表最好拿已經生好的 A 表當參考，畫風才會一致（先跑 A，再加 D）
        r = refs + ([f'work/art/{cid}_A.png'] if sh == 'D' and os.path.exists(f'work/art/{cid}_A.png') else [])
        jobs.append((f'{cid}_{sh}', SHEET + f"Character: {desc}. The 8 poses, left to right, top row first: {poses}.", r))
for n, scene in BGS.items(): jobs.append((n, BG + scene, []))
for n, obj in PROPS.items(): jobs.append((n, PROP + obj, []))
os.makedirs('work/jobs', exist_ok=True)
with open('work/jobs/jobs.jsonl', 'w', encoding='utf-8') as f:
    for j in jobs: f.write(json.dumps(j, ensure_ascii=False) + '\n')
print(len(jobs), 'jobs → work/jobs/jobs.jsonl')
