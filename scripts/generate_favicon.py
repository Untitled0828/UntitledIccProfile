from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "icons"
PNG_PATH = OUT_DIR / "favicon.png"
ICO_PATH = OUT_DIR / "favicon.ico"


def lerp_color(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def draw_vertical_gradient(image, box, top, bottom):
    left, top_y, right, bottom_y = box
    height = max(1, bottom_y - top_y)
    grad = Image.new("RGBA", (right - left, height), (0, 0, 0, 0))
    pixels = grad.load()
    for y in range(height):
      t = y / max(1, height - 1)
      color = lerp_color(top, bottom, t) + (255,)
      for x in range(grad.width):
          pixels[x, y] = color
    image.alpha_composite(grad, (left, top_y))


def main():
    size = 256
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)

    card_box = (20, 28, 236, 228)
    mask_draw.rounded_rectangle(card_box, radius=48, fill=255)

    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_vertical_gradient(bg, card_box, (248, 250, 252), (219, 234, 254))
    bg.putalpha(mask)
    img.alpha_composite(bg)

    draw = ImageDraw.Draw(img)
    screen_box = (44, 52, 212, 176)
    draw.rounded_rectangle(screen_box, radius=24, fill="#0f172a")

    draw.line((68, 158, 188, 158), fill="#334155", width=6)

    curve = [(68, 158), (88, 110), (112, 102), (132, 102), (158, 118), (188, 72)]
    curve_colors = ["#0f766e", "#14977f", "#1e98b8", "#38bdf8", "#3b82f6", "#2563eb"]
    for start, end, color in zip(curve[:-1], curve[1:], curve_colors):
        draw.line((start, end), fill=color, width=16, joint="curve")

    for center, color in [((68, 158), "#14b8a6"), ((130, 102), "#38bdf8"), ((188, 72), "#2563eb")]:
        x, y = center
        draw.ellipse((x - 9, y - 9, x + 9, y + 9), fill=color)

    draw.line((84, 206, 172, 206), fill="#475569", width=16)
    draw.line((96, 36, 112, 20), fill="#94a3b8", width=10)
    draw.line((112, 20, 144, 20), fill="#94a3b8", width=10)
    draw.line((144, 20, 160, 36), fill="#94a3b8", width=10)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    img.save(PNG_PATH)
    img.save(ICO_PATH, format="ICO", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print(f"Generated {PNG_PATH}")
    print(f"Generated {ICO_PATH}")


if __name__ == "__main__":
    main()
