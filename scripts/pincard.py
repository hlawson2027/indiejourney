"""Makes a 1000x1500 branded Pinterest image in The Indie Journey style.

  python3 scripts/pincard.py --title "Christmas Gifts for Runners" \
      --kicker "Amazon idea list" --sub "Gifts runners actually use" \
      --bg "#2F3B33" --out public/pins/christmas-gifts-for-runners.jpg

Optional --image <https url> puts a product/collection photo in the arch
(use Walmart or Zazzle images only, never Amazon).
Run from the repo root (fonts come from node_modules/@fontsource).
"""
import argparse, asyncio, html, os, pathlib, subprocess, tempfile
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
FS = ROOT / 'node_modules' / '@fontsource'

def font(face, fam, file, weight, style='normal'):
    return f"@font-face{{font-family:'{face}';src:url('file://{FS / fam / 'files' / file}') format('woff2');font-weight:{weight};font-style:{style}}}"

async def main():
    p = argparse.ArgumentParser()
    p.add_argument('--title', required=True)
    p.add_argument('--kicker', default='The Indie Journey')
    p.add_argument('--sub', default='')
    p.add_argument('--bg', default='#2F3B33')
    p.add_argument('--image', default='')
    p.add_argument('--out', required=True)
    a = p.parse_args()
    css = ''.join([
        font('PF', 'playfair-display', 'playfair-display-latin-400-normal.woff2', 400),
        font('PF', 'playfair-display', 'playfair-display-latin-400-italic.woff2', 400, 'italic'),
        font('JO', 'jost', 'jost-latin-500-normal.woff2', 500),
    ])
    img = ''
    if a.image:
        tmp = tempfile.mktemp(suffix='.img')
        subprocess.run(['curl', '-sL', '--max-time', '30', '-o', tmp, a.image], check=True)
        img = f"<div class='ph' style=\"background-image:url('file://{tmp}')\"></div>"
    words = html.escape(a.title).split(' ')
    title = ' '.join(words[:-1]) + (f" <em>{words[-1]}</em>" if len(words) > 1 else words[0])
    page = f"""<html><head><style>{css}
    body{{margin:0}}#c{{width:1000px;height:1500px;background:{a.bg};position:relative;overflow:hidden}}
    .arch{{position:absolute;left:90px;top:110px;width:820px;height:1190px;border-radius:410px 410px 0 0;background:#F7F2EC;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 70px;box-sizing:border-box;gap:34px}}
    .k{{font:500 30px JO;letter-spacing:.28em;text-transform:uppercase;color:#A4472F}}
    h1{{font:400 {'96' if len(a.title) < 28 else '80'}px/1.06 PF;color:#1E1B18;margin:0}} em{{font-style:italic}}
    .s{{font:500 30px/1.4 JO;color:#5B4F45}}
    .ph{{width:560px;height:430px;border-radius:24px;background-size:cover;background-position:center;background-color:#fff}}
    .brand{{position:absolute;bottom:42px;left:0;right:0;text-align:center;font:400 40px PF;color:#F7F2EC}}
    .brand span{{font:500 22px JO;letter-spacing:.3em;display:block;margin-top:6px;opacity:.8}}
    </style></head><body><div id='c'><div class='arch'><div class='k'>{html.escape(a.kicker)}</div>{img}<h1>{title}</h1>
    {f"<div class='s'>{html.escape(a.sub)}</div>" if a.sub else ''}</div>
    <div class='brand'>The Indie Journey<span>MYINDIEJOURNEY.COM</span></div></div></body></html>"""
    f = tempfile.NamedTemporaryFile('w', suffix='.html', delete=False)
    f.write(page); f.close()
    async with async_playwright() as pw:
        exe = '/usr/bin/google-chrome' if os.path.exists('/usr/bin/google-chrome') else None
        b = await pw.chromium.launch(executable_path=exe) if exe else await pw.chromium.launch()
        pg = await b.new_page(viewport={'width': 1000, 'height': 1500})
        await pg.goto('file://' + f.name)
        await pg.wait_for_timeout(600)
        png = a.out + '.png'
        await pg.locator('#c').screenshot(path=png)
        await b.close()
    subprocess.run(['node', '-e', f"require('sharp')('{png}').jpeg({{quality:86}}).toFile('{a.out}').then(()=>require('fs').unlinkSync('{png}'))"], check=True, cwd=ROOT)
    print(a.out)

asyncio.run(main())
