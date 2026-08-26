import os
from PIL import Image, ImageOps

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICON_SRC = os.path.join(BASE_DIR, "assets", "app-icon-logo.png")
RES_DIR = os.path.join(BASE_DIR, "android", "app", "src", "main", "res")

# Mipmap configurations: (folder, ic_launcher_size, foreground_size)
MIPMAP_CONFIGS = [
    ("mipmap-mdpi", 48, 108),
    ("mipmap-hdpi", 72, 162),
    ("mipmap-xhdpi", 96, 216),
    ("mipmap-xxhdpi", 144, 324),
    ("mipmap-xxxhdpi", 192, 432),
]

def generate_icons():
    print(f"Loading source icon from: {ICON_SRC}")
    img = Image.open(ICON_SRC).convert("RGBA")

    for folder, size, fg_size in MIPMAP_CONFIGS:
        target_dir = os.path.join(RES_DIR, folder)
        os.makedirs(target_dir, exist_ok=True)

        # 1. Standard ic_launcher.png
        launcher_img = img.resize((size, size), Image.Resampling.LANCZOS)
        launcher_img.save(os.path.join(target_dir, "ic_launcher.png"), format="PNG")

        # 2. Round ic_launcher_round.png
        round_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        # Mask for circle
        mask = Image.new("L", (size, size), 0)
        from PIL import ImageDraw
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size, size), fill=255)
        round_img.paste(launcher_img, (0, 0), mask=mask)
        round_img.save(os.path.join(target_dir, "ic_launcher_round.png"), format="PNG")

        # 3. Adaptive Foreground ic_launcher_foreground.png
        # Centered with padding for adaptive icon viewport
        fg_img = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
        inner_size = int(fg_size * 0.72)
        offset = (fg_size - inner_size) // 2
        resized_inner = img.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
        fg_img.paste(resized_inner, (offset, offset), mask=resized_inner)
        fg_img.save(os.path.join(target_dir, "ic_launcher_foreground.png"), format="PNG")

        print(f"[OK] Generated icons for {folder} ({size}x{size})")

    # Generate splash image in drawable
    drawable_dir = os.path.join(RES_DIR, "drawable")
    splash_img = img.resize((480, 480), Image.Resampling.LANCZOS)
    splash_img.save(os.path.join(drawable_dir, "splash.png"), format="PNG")
    print("[OK] Generated splash drawable")

if __name__ == "__main__":
    generate_icons()
