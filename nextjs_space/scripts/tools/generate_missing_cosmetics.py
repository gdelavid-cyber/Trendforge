"""Generate placeholder cosmetics art for catalog items missing a PNG.

Matches the established asset style: 1024x1024 RGBA radial glow on a
transparent background, tinted per item theme. Re-run safely — only
writes files that do not already exist.
"""
import os
import math
from PIL import Image

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'cosmetics')

# id -> (inner RGB, outer RGB)
ITEMS = {
    'skin_matte_hacker': ((90, 100, 115), (20, 24, 30)),
    'skin_solana_solider': ((20, 241, 149), (99, 45, 255)),
    'skin_mev_phantom': ((200, 80, 255), (40, 10, 60)),
    'skin_pixel_trader': ((60, 255, 120), (10, 40, 20)),
    'skin_bio_synth': ((140, 255, 60), (20, 60, 10)),
    'aura_blood_rage': ((255, 40, 40), (60, 0, 0)),
    'aura_frost_zero': ((160, 230, 255), (20, 60, 120)),
    'anim_breakdance': ((255, 160, 40), (0, 200, 255)),
    'eyes_holo_monocle': ((255, 215, 80), (0, 220, 255)),
    'eyes_cyber_visors': ((120, 160, 255), (20, 30, 60)),
    'eyes_quantum_goggles': ((180, 100, 255), (40, 10, 90)),
    'eyes_gold_seer': ((255, 200, 60), (120, 70, 0)),
    'eyes_void_shades': ((120, 40, 200), (5, 0, 15)),
    'eyes_plasma_spectacles': ((255, 80, 200), (80, 0, 90)),
}

SIZE = 1024


def glow(inner, outer):
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    px = img.load()
    cx = cy = SIZE / 2
    max_r = SIZE * 0.42
    for y in range(SIZE):
        for x in range(SIZE):
            d = math.hypot(x - cx, y - cy) / max_r
            if d >= 1.0:
                continue
            t = d * d  # ease-in falloff
            r = int(outer[0] + (inner[0] - outer[0]) * (1 - t))
            g = int(outer[1] + (inner[1] - outer[1]) * (1 - t))
            b = int(outer[2] + (inner[2] - outer[2]) * (1 - t))
            a = int(255 * (1 - t) ** 1.5)
            px[x, y] = (r, g, b, a)
    return img


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for item_id, colors in ITEMS.items():
        path = os.path.join(OUT_DIR, f'{item_id}.png')
        if os.path.exists(path):
            print(f'skip (exists): {item_id}')
            continue
        glow(*colors).save(path, 'PNG')
        print(f'generated: {path}')


if __name__ == '__main__':
    main()
