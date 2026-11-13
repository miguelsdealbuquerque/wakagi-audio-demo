"""Gera QR Codes em PNG e SVG.

Uso
    python3 tools/make_qr.py https://seu-usuario.github.io/wakagi-audio-demo/ site
    python3 tools/make_qr.py https://doi.org/10.5281/zenodo.24075847 doi

Requer `pip install segno`. Os arquivos saem em assets/qr/.
"""
import sys, pathlib
import segno

url, nome = sys.argv[1], sys.argv[2]
out = pathlib.Path(__file__).resolve().parent.parent / "assets" / "qr"
out.mkdir(parents=True, exist_ok=True)
qr = segno.make(url, error="m")
qr.save(out / f"{nome}.png", scale=24, border=4, dark="#000000", light="#FFFFFF")
qr.save(out / f"{nome}.svg", scale=24, border=4, dark="#000000", light="#FFFFFF")
print("ok", out / f"{nome}.png")
