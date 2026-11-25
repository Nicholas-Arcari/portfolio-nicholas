# build/fa-subset.py
# Il sito pubblica Font Awesome ridotto alle icone che usa: dai file originali
# in build/fontawesome (Font Awesome Free 5.15.4, font SIL OFL 1.1) scrive in
# public/assets i tre woff2 con i soli glifi usati e fontawesome-all.min.css con
# le sole regole .fa-NOME:before di quelle icone (da 164 a circa 7 KB di font).
# Le icone usate sono i nomi fa-* in src e in index.html, piu' i glifi scritti
# per codice nei CSS (content: '\fXXX', come il pulsante del menu del telefono).
#
# Va rilanciato quando il codice usa un'icona nuova: la build lo chiede
# (build/fa-check.js). Serve Python con fontTools e brotli:
#   python3 build/fa-subset.py
import re
import sys
import pathlib
from fontTools import subset

ROOT = pathlib.Path(__file__).resolve().parent.parent
ORIGINALS = ROOT / "build" / "fontawesome"
ASSETS = ROOT / "public" / "assets"

# i codici di Font Awesome 5 stanno in \fXXX e, per le icone piu' recenti, in \e0XX
RULE = re.compile(r'\.fa-([a-z0-9-]+):before\{content:"\\([ef][0-9a-f]{3})"\}')

css = (ORIGINALS / "fontawesome-all.min.css").read_text(encoding="utf-8")
icons = {m.group(1): int(m.group(2), 16) for m in RULE.finditer(css)}

names = set()
for path in [ROOT / "index.html"] + [p for p in (ROOT / "src").rglob("*") if p.suffix in (".js", ".jsx")]:
    names |= set(re.findall(r"\bfa-([a-z0-9-]+)", path.read_text(encoding="utf-8")))
used = sorted(n for n in names if n in icons)

codepoints = {icons[n] for n in used}
for path in [ASSETS / "css" / "main.css"] + list((ROOT / "src").rglob("*.css")):
    for cp in re.findall(r"content:\s*['\"]\\([ef][0-9a-f]{3})['\"]", path.read_text(encoding="utf-8")):
        codepoints.add(int(cp, 16))

for name in ["fa-solid-900", "fa-regular-400", "fa-brands-400"]:
    options = subset.Options()
    options.flavor = "woff2"
    options.ignore_missing_unicodes = True
    options.layout_features = ["*"]
    font = subset.load_font(str(ORIGINALS / f"{name}.woff2"), options)
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=codepoints)
    subsetter.subset(font)
    subset.save_font(font, str(ASSETS / "webfonts" / f"{name}.woff2"), options)

kept = RULE.sub(lambda m: m.group(0) if m.group(1) in used else "", css)
(ASSETS / "css" / "fontawesome-all.min.css").write_text(kept, encoding="utf-8")
print(f"Font Awesome: {len(used)} icone, {len(codepoints)} glifi")
sys.exit(0)
