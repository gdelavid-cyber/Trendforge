import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

SRC_DIR = r"C:\Users\Gojii\.gemini\antigravity\brain\eabe4d45-5646-4bbb-bd2f-ab9ab458f2b2"
OUT_DIR = r"c:\Users\Gojii\trendforge\nextjs_space\public\avatars"
os.makedirs(OUT_DIR, exist_ok=True)

AVATARS = [
    {
        "id": "cyber_humanoid",
        "file": "cyber_humanoid_avatar_1787419299368.jpg",
        "theme_color": (0, 240, 255),    # Cyan #00F0FF
        "accent_color": (245, 166, 35),   # Gold #F5A623
        "archetype": "CYBER_HUMANOID",
        "fx": "cyber_hud"
    },
    {
        "id": "quantum_android",
        "file": "quantum_android_avatar_1787419309255.jpg",
        "theme_color": (0, 240, 255),    # Cyan
        "accent_color": (168, 85, 247),   # Purple/Quantum
        "archetype": "QUANTUM_ANDROID",
        "fx": "quantum_circuit"
    },
    {
        "id": "wall_street_titan",
        "file": "wall_street_titan_avatar_1787419318337.jpg",
        "theme_color": (245, 166, 35),   # Gold #F5A623
        "accent_color": (0, 240, 255),   # Cyan
        "archetype": "WALL_STREET_TITAN",
        "fx": "golden_crown"
    },
    {
        "id": "cosmic_entity",
        "file": "cosmic_entity_avatar_1787419327104.jpg",
        "theme_color": (192, 132, 252),  # Nebula Violet
        "accent_color": (245, 166, 35),  # Gold rings
        "archetype": "COSMIC_ENTITY",
        "fx": "cosmic_rings"
    }
]

NUM_FRAMES = 32
FPS = 20
FRAME_DURATION = int(1000 / FPS)  # 50ms per frame -> 1.6s seamless loop
TARGET_SIZE = (512, 512)

def generate_animated_avatar(avatar_meta):
    src_path = os.path.join(SRC_DIR, avatar_meta["file"])
    if not os.path.exists(src_path):
        print(f"File not found: {src_path}")
        return

    base_img = Image.open(src_path).convert("RGBA").resize(TARGET_SIZE, Image.Resampling.LANCZOS)
    
    # Save static png
    static_png_path = os.path.join(OUT_DIR, f"{avatar_meta['id']}.png")
    base_img.save(static_png_path, "PNG")
    print(f"Saved static: {static_png_path}")

    w, h = TARGET_SIZE
    cx, cy = w / 2, h / 2
    frames = []

    primary_rgb = avatar_meta["theme_color"]
    accent_rgb = avatar_meta["accent_color"]

    # Pre-generate some consistent particle coordinates
    np.random.seed(42)
    num_particles = 36
    particle_angles = np.random.uniform(0, 2 * math.pi, num_particles)
    particle_radii = np.random.uniform(160, 240, num_particles)
    particle_speeds = np.random.uniform(0.8, 2.2, num_particles)
    particle_sizes = np.random.uniform(2, 5, num_particles)

    for i in range(NUM_FRAMES):
        phase = (i / NUM_FRAMES) * 2 * math.pi
        
        # 1. Floating translation + gentle breathing scale
        float_y = math.sin(phase) * 7.0
        float_x = math.cos(phase * 0.5) * 2.0
        scale = 1.0 + (math.sin(phase) * 0.02)
        
        # Apply smooth transformation (scale and float)
        scaled_w = int(w * scale)
        scaled_h = int(h * scale)
        scaled_img = base_img.resize((scaled_w, scaled_h), Image.Resampling.BILINEAR)
        
        # Paste centered on dark backdrop with float offset
        frame = Image.new("RGBA", TARGET_SIZE, (10, 10, 15, 255))
        paste_x = int((w - scaled_w) / 2 + float_x)
        paste_y = int((h - scaled_h) / 2 + float_y)
        frame.paste(scaled_img, (paste_x, paste_y), scaled_img)

        # 2. Glowing pulse overlay (color breathing)
        pulse_alpha = int(25 + 25 * math.sin(phase))
        glow_overlay = Image.new("RGBA", TARGET_SIZE, (*primary_rgb, pulse_alpha))
        frame = Image.alpha_composite(frame, glow_overlay)

        # 3. Dynamic FX Layer
        fx_layer = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
        draw = ImageDraw.Draw(fx_layer)

        # A) Sweeping Holographic Scanline
        scan_y = int((math.sin(phase * 1.0) * 0.5 + 0.5) * h)
        scan_alpha = int(140 * (1.0 - abs(math.sin(phase))))
        draw.line([(0, scan_y), (w, scan_y)], fill=(*primary_rgb, 180), width=2)
        draw.line([(0, scan_y - 1), (w, scan_y - 1)], fill=(*primary_rgb, 90), width=1)
        draw.line([(0, scan_y + 1), (w, scan_y + 1)], fill=(*primary_rgb, 90), width=1)
        # Scan glow area
        for dy in range(-6, 7):
            alpha = int(40 * (1 - abs(dy) / 7))
            draw.line([(0, scan_y + dy), (w, scan_y + dy)], fill=(*primary_rgb, alpha), width=1)

        # B) Archetype-specific effects
        if avatar_meta["fx"] == "cyber_hud":
            # Rotating HUD targeting brackets & crosshairs
            hud_angle = phase
            for deg_offset in [0, 90, 180, 270]:
                rad = hud_angle + math.radians(deg_offset)
                r_inner = 210
                r_outer = 235
                p1 = (cx + r_inner * math.cos(rad), cy + r_inner * math.sin(rad))
                p2 = (cx + r_outer * math.cos(rad), cy + r_outer * math.sin(rad))
                draw.line([p1, p2], fill=(*primary_rgb, 200), width=2)
            
            # Pulsing corner brackets
            bracket_glow = int(120 + 80 * math.sin(phase * 2))
            draw.arc([16, 16, w - 16, h - 16], start=int(math.degrees(phase)), end=int(math.degrees(phase) + 45), fill=(*accent_rgb, bracket_glow), width=2)
            draw.arc([16, 16, w - 16, h - 16], start=int(math.degrees(phase) + 180), end=int(math.degrees(phase) + 225), fill=(*primary_rgb, bracket_glow), width=2)

        elif avatar_meta["fx"] == "quantum_circuit":
            # Pulsing circuit wave ripple
            ripple_r = 100 + ((i % (NUM_FRAMES // 2)) / (NUM_FRAMES // 2)) * 140
            ripple_alpha = int(180 * (1 - (ripple_r - 100) / 140))
            draw.ellipse([cx - ripple_r, cy - ripple_r, cx + ripple_r, cy + ripple_r], outline=(*primary_rgb, ripple_alpha), width=2)
            
            # Subtle digital glitch bars
            if i % 8 == 0 or (i + 1) % 8 == 0:
                gy = int(cy + (math.sin(phase * 4) * 120))
                draw.rectangle([0, gy, w, gy + 4], fill=(*accent_rgb, 70))

        elif avatar_meta["fx"] == "golden_crown":
            # Orbiting gold sparkles and crown shine
            crown_glow = int(160 + 80 * math.sin(phase * 2))
            # Golden aura beam at the top
            draw.ellipse([cx - 120, 20, cx + 120, 160], outline=(*primary_rgb, crown_glow), width=2)
            for k in range(8):
                sp_angle = phase + (k * math.pi / 4)
                sx = cx + math.cos(sp_angle) * (180 + 20 * math.sin(phase * 3))
                sy = 100 + math.sin(sp_angle) * 40
                draw.ellipse([sx - 3, sy - 3, sx + 3, sy + 3], fill=(*primary_rgb, 220))

        elif avatar_meta["fx"] == "cosmic_rings":
            # Dual tilted rotating orbital rings
            ring_phase = phase
            for ring_idx, ring_color in enumerate([accent_rgb, primary_rgb]):
                tilt = 0.5 if ring_idx == 0 else -0.5
                rx = 220
                ry = 75
                # Draw points along ellipse tilted
                points = []
                for a in np.linspace(0, 2 * math.pi, 48):
                    curr_a = a + (ring_phase if ring_idx == 0 else -ring_phase)
                    px = cx + rx * math.cos(curr_a)
                    py = cy + ry * math.sin(curr_a) + (px - cx) * tilt
                    points.append((px, py))
                
                for pt_idx in range(len(points) - 1):
                    # Depth brightness
                    pt_alpha = int(120 + 100 * math.sin(a + ring_phase))
                    draw.line([points[pt_idx], points[pt_idx + 1]], fill=(*ring_color, max(30, min(255, pt_alpha))), width=2)

        # C) Orbiting floating stardust particles
        for p in range(num_particles):
            cur_angle = particle_angles[p] + (phase * particle_speeds[p])
            rad = particle_radii[p] + math.sin(phase * 2 + p) * 15
            px = cx + rad * math.cos(cur_angle)
            py = cy + rad * math.sin(cur_angle) + (math.sin(cur_angle * 2) * 20)
            p_size = particle_sizes[p]
            p_alpha = int(100 + 120 * math.sin(phase * 3 + p))
            p_col = primary_rgb if p % 2 == 0 else accent_rgb
            draw.ellipse([px - p_size, py - p_size, px + p_size, py + p_size], fill=(*p_col, max(20, min(255, p_alpha))))

        # Composite FX layer
        frame = Image.alpha_composite(frame, fx_layer)

        # Apply circular vignette / avatar circular frame
        border_overlay = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
        border_draw = ImageDraw.Draw(border_overlay)
        # Holographic outer ring
        border_glow = int(180 + 70 * math.sin(phase))
        border_draw.ellipse([3, 3, w - 4, h - 4], outline=(*primary_rgb, border_glow), width=3)
        border_draw.ellipse([7, 7, w - 8, h - 8], outline=(*accent_rgb, int(border_glow * 0.6)), width=1)
        
        frame = Image.alpha_composite(frame, border_overlay)
        frames.append(frame.convert("RGB"))

    # Save as high quality animated WebP
    webp_path = os.path.join(OUT_DIR, f"{avatar_meta['id']}_animated.webp")
    frames[0].save(
        webp_path,
        "WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION,
        loop=0,
        quality=90,
        method=4
    )
    print(f"Saved animated WebP: {webp_path}")

    # Also save as animated GIF for universal fallback compatibility
    gif_path = os.path.join(OUT_DIR, f"{avatar_meta['id']}_animated.gif")
    frames[0].save(
        gif_path,
        "GIF",
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION,
        loop=0,
        optimize=True
    )
    print(f"Saved animated GIF: {gif_path}")

if __name__ == "__main__":
    for avatar in AVATARS:
        print(f"Generating animations for {avatar['id']}...")
        generate_animated_avatar(avatar)
    print("ALL AVATARS SUCCESSFULLY GENERATED!")
