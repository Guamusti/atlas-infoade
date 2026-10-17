from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

root = Path(__file__).resolve().parents[1]
for size in (192, 512):
    image = Image.new("RGB", (size, size), "#153c2d")
    draw = ImageDraw.Draw(image)
    inset = int(size * .1)
    draw.rounded_rectangle((inset, inset, size-inset, size-inset), radius=int(size*.18), fill="#d9ff43")
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", int(size*.39))
    except OSError:
        font = ImageFont.load_default()
    text = "03"
    box = draw.textbbox((0, 0), text, font=font)
    x = (size - (box[2]-box[0])) / 2
    y = (size - (box[3]-box[1])) / 2 - box[1]
    draw.text((x, y), text, font=font, fill="#153c2d")
    image.save(root / "deploy" / f"icon-{size}.png", optimize=True)
