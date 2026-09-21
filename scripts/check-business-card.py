from pathlib import Path
from collections import Counter
import re

from PIL import Image, ImageFilter
from pypdf import PdfReader
import zxingcpp

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://melomanergames.github.io/"


def check(image, label, expected):
    codes = zxingcpp.read_barcodes(image)
    assert [code.text for code in codes] == [expected], f"QR verification failed: {label}"
    print(f"PASS: {label} -> {expected}")


for suffix, expected, words in [
    ("", BASE_URL, ["Роман", "Абашин", "РАЗРАБОТКА ИГР", "Открыть сайт"]),
    ("-en", BASE_URL + "index-en.html", ["Roman", "Abashin", "GAME DEVELOPMENT", "Open website"]),
]:
    language = "EN" if suffix else "RU"
    card = Image.open(ROOT / "assets" / f"roman-abashin-card{suffix}.png").convert("RGB")
    assert card.size == (1800, 1000)
    for width in [1800, 900, 600, 450]:
        small = card.resize((width, round(width * 5 / 9)), Image.Resampling.LANCZOS)
        check(small, f"{language}: card at {width}px", expected)
    check(card.resize((900, 500)).convert("L"), f"{language}: grayscale", expected)
    check(card.resize((900, 500)).filter(ImageFilter.GaussianBlur(0.6)), f"{language}: light blur", expected)
    check(card.rotate(12, expand=True, fillcolor="white"), f"{language}: 12-degree rotation", expected)
    check(Image.open(ROOT / "assets" / f"portfolio-qr{suffix}.png"), f"{language}: standalone QR", expected)

    reader = PdfReader(ROOT / "output" / "pdf" / f"roman-abashin-card{suffix}.pdf")
    assert len(reader.pages) == 1
    page = reader.pages[0]
    width_mm, height_mm = float(page.mediabox.width) * 25.4 / 72, float(page.mediabox.height) * 25.4 / 72
    assert abs(width_mm - 90) < 0.01 and abs(height_mm - 50) < 0.01
    pdf_text = page.extract_text()
    assert all(word in pdf_text for word in words), f"{language}: incorrect PDF translation"
    links = [ref.get_object()["/A"]["/URI"] for ref in page.get("/Annots", [])]
    assert Counter(links) == Counter([expected, expected, "https://t.me/MelomanerL"])
    vcard = (ROOT / "assets" / f"roman-abashin{suffix}.vcf").read_text(encoding="utf-8")
    assert f"URL:{expected}\n" in vcard
    assert words[0] in vcard and words[1] in vcard
    if suffix:
        assert not re.search(r"[А-Яа-яЁё]", pdf_text + vcard), "English files contain untranslated text"
    print(f"PASS: {language}: 90 x 50 mm PDF, translated text, localized PDF links and contact")
