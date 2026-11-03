"""Builds the small heading font used by the app's interface.

Noto Serif SemiBold (SIL Open Font License 1.1) is downloaded and subset to
Latin, common punctuation and the rupee sign, then written as WOFF2 so the
offline cache stays small. PDFs do not use this font.

Requires: pip install fonttools brotli
Usage:    python scripts/subset-ui-font.py
"""

import io
import pathlib
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont

URL = "https://github.com/notofonts/notofonts.github.io/raw/main/fonts/NotoSerif/hinted/ttf/NotoSerif-SemiBold.ttf"
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "fonts" / "ui" / "NotoSerif-SemiBold-latin.woff2"
UNICODES = "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+2010-2027,U+2030-203A,U+20B9,U+2122,U+2212"

with urllib.request.urlopen(URL) as response:
    font = TTFont(io.BytesIO(response.read()))

options = subset.Options()
options.flavor = "woff2"
options.layout_features = ["kern", "liga", "clig", "calt", "lnum", "pnum", "tnum"]
options.name_IDs = ["*"]
options.name_legacy = True
options.notdef_outline = True
subsetter = subset.Subsetter(options)
subsetter.populate(unicodes=subset.parse_unicodes(UNICODES))
subsetter.subset(font)

OUT.parent.mkdir(parents=True, exist_ok=True)
font.flavor = "woff2"
font.save(OUT)
print(f"{OUT} ({OUT.stat().st_size} bytes)")
