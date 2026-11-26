"""Builds email-friendly JPGs in public/email/ (landscape crops + masthead)."""
import pathlib, sys
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[2]
U = R / 'src/assets/uploads'; O = R / 'public/email'; O.mkdir(exist_ok=True)
def crop(src, out, w, h, y=0.35):
    im = Image.open(U / src).convert('RGB'); W, H = im.size
    t = w / h
    if W / H > t: nw = int(H * t); box = ((W - nw)//2, 0, (W - nw)//2 + nw, H)
    else:
        nh = int(W / t); top = int((H - nh) * y); box = (0, top, W, top + nh)
    im.crop(box).resize((w, h), Image.LANCZOS).save(O / out, quality=82, optimize=True, progressive=True)
if __name__ == '__main__':
    # args: src out w h [y]
    a = sys.argv[1:]
    crop(a[0], a[1], int(a[2]), int(a[3]), float(a[4]) if len(a) > 4 else 0.35)
