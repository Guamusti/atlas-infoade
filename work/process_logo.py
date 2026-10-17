from pathlib import Path
from PIL import Image
import argparse

parser = argparse.ArgumentParser(description="Genera los iconos de Atlas a partir de una imagen cuadrada.")
parser.add_argument("source", type=Path, help="Ruta a la imagen de logo de origen")
source = parser.parse_args().source
if not source.is_file():
    raise SystemExit(f"No se encuentra la imagen: {source}")
root = Path(__file__).resolve().parents[1]
image = Image.open(source).convert("RGB")
side = min(image.size)
left = (image.width - side) // 2
top = (image.height - side) // 2
image = image.crop((left, top, left + side, top + side))
for size in (192, 512, 1024):
    out = image.resize((size, size), Image.Resampling.LANCZOS)
    out.save(root / "deploy" / f"atlas-icon-{size}.png", optimize=True)
