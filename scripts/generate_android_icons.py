import os
import shutil
from PIL import Image, ImageOps, ImageDraw

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICON_SRC = os.path.join(BASE_DIR, "assets", "app-icon-spectra-logo.png")
RES_DIR = os.path.join(BASE_DIR, "android", "app", "src", "main", "res")

# Mipmap configurations: (folder, ic_launcher_size, foreground_size)
MIPMAP_CONFIGS = [
    ("mipmap-mdpi", 48, 108),
    ("mipmap-hdpi", 72, 162),
    ("mipmap-xhdpi", 96, 216),
    ("mipmap-xxhdpi", 144, 324),
    ("mipmap-xxxhdpi", 192, 432),
]

# Drawable density configurations for notification icons
DRAWABLE_ICON_CONFIGS = [
    ("drawable", 192),
    ("drawable-mdpi", 48),
    ("drawable-hdpi", 72),
    ("drawable-xhdpi", 96),
    ("drawable-xxhdpi", 144),
    ("drawable-xxxhdpi", 192),
]

# Splash / Drawable configurations
DRAWABLE_SPLASH_DIRS = [
    ("drawable", 480),
    ("drawable-port-mdpi", 320),
    ("drawable-port-hdpi", 480),
    ("drawable-port-xhdpi", 720),
    ("drawable-port-xxhdpi", 960),
    ("drawable-port-xxxhdpi", 1280),
    ("drawable-land-mdpi", 320),
    ("drawable-land-hdpi", 480),
    ("drawable-land-xhdpi", 720),
    ("drawable-land-xxhdpi", 960),
    ("drawable-land-xxxhdpi", 1280),
]

def generate_icons():
    print(f"Loading source icon from: {ICON_SRC}")
    if not os.path.exists(ICON_SRC):
        raise FileNotFoundError(f"Icon source not found: {ICON_SRC}")

    img = Image.open(ICON_SRC).convert("RGBA")

    # 1. Generate Mipmap launcher icons
    for folder, size, fg_size in MIPMAP_CONFIGS:
        target_dir = os.path.join(RES_DIR, folder)
        os.makedirs(target_dir, exist_ok=True)

        # 1a. Standard ic_launcher.png
        launcher_img = img.resize((size, size), Image.Resampling.LANCZOS)
        launcher_img.save(os.path.join(target_dir, "ic_launcher.png"), format="PNG")

        # 1b. Round ic_launcher_round.png
        round_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        mask = Image.new("L", (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size, size), fill=255)
        round_img.paste(launcher_img, (0, 0), mask=mask)
        round_img.save(os.path.join(target_dir, "ic_launcher_round.png"), format="PNG")

        # 1c. Adaptive Foreground ic_launcher_foreground.png
        fg_img = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
        inner_size = int(fg_size * 0.72)
        offset = (fg_size - inner_size) // 2
        resized_inner = img.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
        fg_img.paste(resized_inner, (offset, offset), mask=resized_inner)
        fg_img.save(os.path.join(target_dir, "ic_launcher_foreground.png"), format="PNG")

        print(f"[OK] Generated mipmap icons for {folder} ({size}x{size})")

    # 2. Generate explicit notification drawables in res/drawable-*
    # Capacitor LocalNotifications resolves largeIcon and smallIcon strictly from res/drawable!
    for folder, size in DRAWABLE_ICON_CONFIGS:
        target_dir = os.path.join(RES_DIR, folder)
        os.makedirs(target_dir, exist_ok=True)

        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        # Save as both ic_spectra_notification and ic_launcher in drawable
        resized.save(os.path.join(target_dir, "ic_spectra_notification.png"), format="PNG")
        resized.save(os.path.join(target_dir, "ic_launcher.png"), format="PNG")
        print(f"[OK] Generated notification drawables for {folder} ({size}x{size})")

    # 3. Generate splash images in drawable directories
    for d_name, max_dim in DRAWABLE_SPLASH_DIRS:
        target_dir = os.path.join(RES_DIR, d_name)
        if os.path.exists(target_dir):
            splash_img = img.resize((max_dim, max_dim), Image.Resampling.LANCZOS)
            splash_img.save(os.path.join(target_dir, "splash.png"), format="PNG")
            print(f"[OK] Generated splash for {d_name} ({max_dim}x{max_dim})")

    # 4. Synchronize public/assets/app-icon-logo.png with SPECTRA logo
    public_logo = os.path.join(BASE_DIR, "public", "assets", "app-icon-logo.png")
    if os.path.exists(os.path.dirname(public_logo)):
        shutil.copy2(ICON_SRC, public_logo)
        print("[OK] Synchronized public/assets/app-icon-logo.png with Spectra logo")

    print("[SUCCESS] All Android app icons, notification drawables, and splash assets updated to SPECTRA.")

if __name__ == "__main__":
    generate_icons()
