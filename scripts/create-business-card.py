from pathlib import Path
import argparse

import qrcode
from qrcode.image.svg import SvgPathFillImage
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://melomanergames.github.io/"
ASSETS = ROOT / "assets"
LOCALES = {
    "ru": {
        "suffix": "", "url": BASE_URL, "name": ("Роман", "Абашин"),
        "specialty": "РАЗРАБОТКА ИГР", "cta": "Открыть сайт",
    },
    "en": {
        "suffix": "-en", "url": BASE_URL + "index-en.html", "name": ("Roman", "Abashin"),
        "specialty": "GAME DEVELOPMENT", "cta": "Open website",
    },
}


def build(font_dir, language):
    locale = LOCALES[language]
    suffix, url = locale["suffix"], locale["url"]
    pdf = ROOT / "output" / "pdf" / f"roman-abashin-card{suffix}.pdf"
    pdf.parent.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont("Card", str(font_dir / "segoeui.ttf")))
    pdfmetrics.registerFont(TTFont("CardBold", str(font_dir / "segoeuib.ttf")))

    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, border=4, box_size=24)
    qr.add_data(url)
    qr.make(fit=True)
    qr.make_image(fill_color="#09131e", back_color="white").save(ASSETS / f"portfolio-qr{suffix}.png")
    qr.make_image(image_factory=SvgPathFillImage).save(ASSETS / f"portfolio-qr{suffix}.svg")
    matrix = qr.get_matrix()

    card = canvas.Canvas(str(pdf), pagesize=(90 * mm, 50 * mm), pageCompression=1)
    card.setTitle(f"Roman Abashin - MelomanerGames - Business card ({language.upper()})")
    card.setAuthor("Roman Abashin")
    card.setSubject(url)
    card.scale(mm / 20, mm / 20)

    def rect(x, y, w, h, color, radius=0):
        card.setFillColor(HexColor(color))
        if radius:
            card.roundRect(x, y, w, h, radius, stroke=0, fill=1)
        else:
            card.rect(x, y, w, h, stroke=0, fill=1)

    def text(value, x, y, size, color="#edf5fb", bold=False):
        card.setFont("CardBold" if bold else "Card", size)
        card.setFillColor(HexColor(color))
        card.drawString(x, y, value)

    def line(points, color, width=2):
        card.setStrokeColor(HexColor(color))
        card.setLineWidth(width)
        p = card.beginPath()
        p.moveTo(*points[0])
        for point in points[1:]:
            p.lineTo(*point)
        card.drawPath(p)

    def polygon(points, fill, stroke=None, width=2):
        p = card.beginPath()
        p.moveTo(*points[0])
        for point in points[1:]:
            p.lineTo(*point)
        p.close()
        card.setFillColor(HexColor(fill))
        if stroke:
            card.setStrokeColor(HexColor(stroke))
            card.setLineWidth(width)
        card.drawPath(p, fill=1, stroke=bool(stroke))

    def voxel(x, y, size, height, top, left, right):
        polygon([(x - size, y), (x, y - size / 2), (x, y - size / 2 - height),
                 (x - size, y - height)], left)
        polygon([(x, y - size / 2), (x + size, y), (x + size, y - height),
                 (x, y - size / 2 - height)], right)
        polygon([(x, y + size / 2), (x + size, y), (x, y - size / 2),
                 (x - size, y)], top)

    def game_development_art():
        for y in range(400, 757, 44):
            line([(752, y), (1035, y)], "#152330", 1)
        for x in range(771, 1036, 44):
            line([(x, 390), (x, 756)], "#152330", 1)

        controller = [(22, 0), (0, 24), (14, 108), (38, 132), (190, 132),
                      (214, 108), (228, 24), (206, 0), (178, 0), (146, 40),
                      (82, 40), (50, 0)]
        polygon([(783 + x, 616 + y) for x, y in controller], "#132a3a", "#53bedc", 3)
        rect(828, 670, 51, 15, "#8addf4")
        rect(846, 652, 15, 51, "#8addf4")
        rect(943, 687, 17, 17, "#ab92ee")
        rect(963, 664, 17, 17, "#6ed9ed")
        rect(901, 661, 15, 5, "#46677c")
        line([(897, 608), (897, 572)], "#42667e", 2)
        rect(869, 576, 57, 29, "#090f18")
        text("</>", 870, 578, 27, "#73cce9", bold=True)

        voxel(897, 467, 133, 26, "#172f41", "#10202e", "#20304e")
        voxel(897, 538, 43, 63, "#72d7eb", "#257295", "#355a85")
        voxel(842, 484, 43, 34, "#54accf", "#1e526f", "#2c7192")
        voxel(952, 484, 43, 34, "#a68cdb", "#514779", "#6b5899")

        line([(758, 550), (758, 568), (776, 568)], "#4d6f86", 2)
        line([(1017, 568), (1035, 568), (1035, 550)], "#4d6f86", 2)
        line([(758, 389), (758, 371), (776, 371)], "#4d6f86", 2)
        line([(1017, 371), (1035, 371), (1035, 389)], "#4d6f86", 2)
        for x, y in [(897, 535), (764, 467), (1030, 467), (897, 374)]:
            rect(x - 3, y - 3, 6, 6, "#a1dce8")

    rect(0, 0, 1800, 1000, "#090f18")
    rect(1075, 0, 725, 1000, "#0e1726")
    for x in range(1120, 1800, 60):
        line([(x, 0), (x, 1000)], "#172338", 1)
    for y in range(40, 1000, 60):
        line([(1075, y), (1800, y)], "#172338", 1)
    line([(0, 22), (930, 22), (1075, 167), (1800, 167)], "#203b59", 3)
    line([(784, 1000), (784, 935), (1010, 935), (1080, 865)], "#27304b", 3)

    pixels = ["10001", "11011", "10101", "10001", "10001"]
    for row, values in enumerate(pixels):
        for col, enabled in enumerate(values):
            if enabled == "1":
                rect(96 + col * 15, 843 - row * 15, 12, 12, "#68dfff" if col < 3 else "#ac91ff")
    text("MelomanerGames", 197, 806, 47, "#d3e0ed", bold=True)
    rect(96, 716, 8, 43, "#61d5fa")
    text(locale["specialty"], 126, 721, 43, "#83dff4", bold=True)
    game_development_art()

    text(locale["name"][0], 88, 566, 143, bold=True)
    text(locale["name"][1], 88, 423, 143, bold=True)
    text("Game Producer", 99, 327, 53, "#6bddff", bold=True)
    text("Product Game Designer", 99, 266, 48, "#c0cce0")

    line([(100, 213), (785, 213), (813, 241), (986, 241)], "#263b52", 2)
    for x, color in [(945, "#69daff"), (965, "#86b8fa"), (985, "#ac91ff")]:
        rect(x, 264, 11, 11, color)
    display_url = url.removeprefix("https://").removesuffix("/")
    url_size = min(47, 930 / pdfmetrics.stringWidth(display_url, "Card", 1))
    text(display_url, 99, 154, url_size, "#f1f6fc")
    text("Telegram  @MelomanerL", 99, 91, 45, "#a8bcd2")
    card.linkURL(url, (95, 145, 1030, 198), relative=1, thickness=0)
    card.linkURL("https://t.me/MelomanerL", (95, 80, 735, 134), relative=1, thickness=0)

    rect(1117, 85, 589, 830, "#030811", radius=30)
    rect(1109, 99, 589, 830, "#ffffff", radius=28)
    rect(1154, 864, 12, 12, "#21384e")
    text("PORTFOLIO", 1191, 845, 49, "#142438", bold=True)
    qr_x, qr_y, qr_size = 1128, 274, 551
    cell = qr_size / len(matrix)
    card.setFillColor(HexColor("#09131e"))
    for row, values in enumerate(matrix):
        for col, filled in enumerate(values):
            if filled:
                card.rect(qr_x + col * cell, qr_y + (len(matrix) - row - 1) * cell,
                          cell, cell, stroke=0, fill=1)
    line([(1161, 259), (1646, 259)], "#dce5ed", 2)
    cta_x = 1403.5 - pdfmetrics.stringWidth(locale["cta"], "CardBold", 48) / 2
    text(locale["cta"], cta_x, 184, 48, "#142438", bold=True)
    card.linkURL(url, (1109, 99, 1698, 929), relative=1, thickness=0)
    card.showPage()
    card.save()
    print(f"Created {pdf}; {len(matrix)} QR modules including the quiet zone; target: {url}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build a vector 90 x 50 mm portfolio business card.")
    parser.add_argument("--font-dir", type=Path, default=Path("C:/Windows/Fonts"))
    parser.add_argument("--language", choices=["ru", "en", "all"], default="all")
    args = parser.parse_args()
    for language in LOCALES if args.language == "all" else [args.language]:
        build(args.font_dir, language)
