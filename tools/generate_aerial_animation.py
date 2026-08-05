#!/usr/bin/env python3
"""Generate a square video that cycles through every Datacenters row with an
aerial photo, overlaying name/city/coordinates on each frame.

Requires Pillow (already installed) and ffmpeg on PATH. --order angle
additionally requires opencv-python(-headless).
"""

from __future__ import annotations

import argparse
import math
import random
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import textwrap
from contextlib import ExitStack
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

try:
    import cv2
except ImportError:
    cv2 = None

REPO_ROOT = Path(__file__).resolve().parent.parent

SCRIM_HEIGHT_FRAC = 0.42
PADDING_FRAC = 0.045
NAME_MAX_WIDTH_FRAC = 0.9

ANGLE_DOMAIN_DEG = 90  # buildings/roads are rectilinear, so angle is only meaningful mod 90 degrees
ANGLE_CENTER_FRAC = 0.5  # fraction of width/height kept, centered, before line detection
ANGLE_COARSE_BIN_DEG = 10  # width of bins used to robustly pick the dominant orientation region
ANGLE_ALGO_VERSION = 3  # bump to invalidate cached angles after a detection-logic change

SIZE_SAT_MAX = 60  # HSV saturation below this = "whitish" (grey/white, not a vivid color)
SIZE_VAL_MIN = 170  # HSV value above this = bright enough to be roofing, not asphalt/shadow
SIZE_CENTER_FRAC = 0.2  # fraction of width/height defining the "must include the center" box
SIZE_MIN_CENTER_COVERAGE = 0.35  # fraction of that (small, tight) center box the blob must cover
SIZE_MAX_AREA_FRAC = 0.55  # reject blobs bigger than this: almost certainly roads/lots merged in
SIZE_ALGO_VERSION = 4  # bump to invalidate cached sizes after a detection-logic change

NOISE_MIN_STD = 5.0  # grayscale std dev below this = blank/corrupt image, not real content
NOISE_ALGO_VERSION = 1  # bump to invalidate cached busyness scores after a detection-logic change

_MISSING = object()


@dataclass
class Facility:
    id: int
    name: str
    lat: float | None
    lon: float | None
    city: str | None
    country_code: str | None
    filename: str


def load_facilities(db_path: Path, seed: int | None) -> list[Facility]:
    uri = f"file:{db_path}?mode=ro"
    con = sqlite3.connect(uri, uri=True)
    try:
        rows = con.execute(
            """
            SELECT id, name, lat, lon, city, country_code, filename
            FROM Datacenters
            WHERE filename IS NOT NULL AND filename != ''
            """
        ).fetchall()
    finally:
        con.close()

    facilities = [Facility(*row) for row in rows]
    rng = random.Random(seed)
    rng.shuffle(facilities)
    return facilities


class ImageFeatureCache:
    """Caches expensive per-image computations (e.g. detected angle) across runs.

    Keyed by (filename, metric) with the source file's mtime/size stored alongside
    so a changed image is recomputed rather than served a stale value.
    """

    def __init__(self, db_path: Path):
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self.con = sqlite3.connect(db_path)
        self.con.execute(
            """
            CREATE TABLE IF NOT EXISTS image_features (
                filename TEXT NOT NULL,
                metric TEXT NOT NULL,
                mtime REAL NOT NULL,
                size INTEGER NOT NULL,
                value REAL,
                PRIMARY KEY (filename, metric)
            )
            """
        )
        self.con.commit()

    def get(self, filename: str, metric: str, mtime: float, size: int):
        row = self.con.execute(
            "SELECT value, mtime, size FROM image_features WHERE filename = ? AND metric = ?",
            (filename, metric),
        ).fetchone()
        if row is None:
            return _MISSING
        value, cached_mtime, cached_size = row
        if cached_mtime != mtime or cached_size != size:
            return _MISSING
        return value

    def set(self, filename: str, metric: str, mtime: float, size: int, value: float | None) -> None:
        self.con.execute(
            "INSERT OR REPLACE INTO image_features (filename, metric, mtime, size, value) VALUES (?, ?, ?, ?, ?)",
            (filename, metric, mtime, size, value),
        )
        self.con.commit()

    def close(self) -> None:
        self.con.close()


def compute_dominant_angle(image_path: Path) -> float | None:
    """Detect the dominant rectilinear orientation (0-89 degrees) of buildings/roads
    near the center of an aerial photo via Hough line detection, or None if no clear
    structure is found. Restricted to the center region so surrounding roads/neighboring
    buildings (not the facility itself) don't skew the result.

    Individual Hough line segments are biased towards "clean" pixel-grid slopes
    (0/45/90 degrees) regardless of a building's true orientation, which pins a
    disproportionate number of images to those exact values. To correct for this,
    the dominant orientation is first picked at coarse (ANGLE_COARSE_BIN_DEG)
    resolution -- robust to a single quantization spike -- and then refined to a
    continuous value by averaging the actual line angles within that bin, weighted
    by length, so real per-image variation survives instead of collapsing onto a
    handful of repeated values.
    """
    img = cv2.imread(str(image_path))
    if img is None:
        return None

    h, w = img.shape[:2]
    cw, ch = int(w * ANGLE_CENTER_FRAC), int(h * ANGLE_CENTER_FRAC)
    x0, y0 = (w - cw) // 2, (h - ch) // 2
    img = img[y0 : y0 + ch, x0 : x0 + cw]

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(gray, 50, 150)
    min_line_length = max(10, int(25 * ANGLE_CENTER_FRAC))
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=30, minLineLength=min_line_length, maxLineGap=5)
    if lines is None:
        return None

    angles = []
    lengths = []
    for (x1, y1, x2, y2) in lines.reshape(-1, 4):
        angles.append(math.degrees(math.atan2(y2 - y1, x2 - x1)) % ANGLE_DOMAIN_DEG)
        lengths.append(math.hypot(x2 - x1, y2 - y1))
    angles = np.array(angles)
    lengths = np.array(lengths)

    num_bins = ANGLE_DOMAIN_DEG // ANGLE_COARSE_BIN_DEG
    bin_indices = (angles // ANGLE_COARSE_BIN_DEG).astype(int) % num_bins
    weights = np.zeros(num_bins)
    np.add.at(weights, bin_indices, lengths)

    if weights.sum() == 0:
        return None

    winning_bin = int(np.argmax(weights))
    in_bin = bin_indices == winning_bin
    return float(np.average(angles[in_bin], weights=lengths[in_bin]))


def get_angle(facility: Facility, images_dir: Path, cache: ImageFeatureCache) -> float | None:
    path = images_dir / facility.filename
    try:
        stat = path.stat()
    except FileNotFoundError:
        return None

    metric = f"angle_v{ANGLE_ALGO_VERSION}"
    cached = cache.get(facility.filename, metric, stat.st_mtime, stat.st_size)
    if cached is not _MISSING:
        return cached

    angle = compute_dominant_angle(path)
    cache.set(facility.filename, metric, stat.st_mtime, stat.st_size, angle)
    return angle


def order_by_angle(
    facilities: list[Facility], images_dir: Path, cache: ImageFeatureCache
) -> list[Facility]:
    """Sort facilities by dominant building/road angle for a smooth rotation effect.

    Facilities with no detectable structure are appended at the end (in their
    existing order) since they can't be placed meaningfully in the rotation.
    """
    scored: list[tuple[float, Facility]] = []
    unscored: list[Facility] = []
    for facility in facilities:
        angle = get_angle(facility, images_dir, cache)
        if angle is None:
            unscored.append(facility)
        else:
            scored.append((angle, facility))

    scored.sort(key=lambda pair: pair[0])

    if scored:
        angles = [angle for angle, _ in scored]
        n = len(angles)
        gaps = [(angles[(i + 1) % n] - angles[i]) % ANGLE_DOMAIN_DEG for i in range(n)]
        seam = int(np.argmax(gaps))
        scored = scored[seam + 1 :] + scored[: seam + 1]

    print(f"angle detected for {len(scored)}/{len(facilities)} facilities ({len(unscored)} without clear structure, appended at the end)")
    return [facility for _, facility in scored] + unscored


def compute_center_blob_size(image_path: Path) -> float | None:
    """Estimate the size (as a fraction of frame area) of the whitish roof blob
    covering the center of an aerial photo, or None if no such blob exists there.

    "Whitish" (low saturation, high brightness) targets bright roofing membrane
    specifically -- plain grey/tan asphalt, concrete and bare ground are excluded
    by the strict value threshold, and morphological opening (before closing) stops
    the blob from bridging across roads/gaps into unrelated neighboring surfaces.
    A blob covering an implausibly large share of the frame is treated as such a
    bridging artifact rather than a real building and rejected.
    """
    img = cv2.imread(str(image_path))
    if img is None:
        return None

    h, w = img.shape[:2]
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    sat, val = hsv[:, :, 1], hsv[:, :, 2]
    mask = ((sat < SIZE_SAT_MAX) & (val > SIZE_VAL_MIN)).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8), iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8), iterations=1)

    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if num_labels <= 1:
        return None

    bw, bh = max(3, int(w * SIZE_CENTER_FRAC)), max(3, int(h * SIZE_CENTER_FRAC))
    x0, y0 = (w - bw) // 2, (h - bh) // 2
    center_labels = labels[y0 : y0 + bh, x0 : x0 + bw]
    foreground = center_labels[center_labels != 0]
    if foreground.size == 0:
        return None

    counts = np.bincount(foreground)
    winning_label = int(np.argmax(counts))
    coverage = counts[winning_label] / center_labels.size
    if coverage < SIZE_MIN_CENTER_COVERAGE:
        return None

    area_frac = float(stats[winning_label, cv2.CC_STAT_AREA]) / (w * h)
    if area_frac > SIZE_MAX_AREA_FRAC:
        return None

    return area_frac


def get_size(facility: Facility, images_dir: Path, cache: ImageFeatureCache) -> float | None:
    path = images_dir / facility.filename
    try:
        stat = path.stat()
    except FileNotFoundError:
        return None

    metric = f"size_v{SIZE_ALGO_VERSION}"
    cached = cache.get(facility.filename, metric, stat.st_mtime, stat.st_size)
    if cached is not _MISSING:
        return cached

    size = compute_center_blob_size(path)
    cache.set(facility.filename, metric, stat.st_mtime, stat.st_size, size)
    return size


def order_by_size(
    facilities: list[Facility], images_dir: Path, cache: ImageFeatureCache
) -> list[Facility]:
    """Sort facilities by estimated building size, smallest first, for a "growing"
    effect. Facilities with no confidently-detected central roof blob are dropped
    from the clip entirely rather than appended, per how this ordering was requested.
    """
    scored: list[tuple[float, Facility]] = []
    dropped = 0
    for facility in facilities:
        size = get_size(facility, images_dir, cache)
        if size is None:
            dropped += 1
        else:
            scored.append((size, facility))

    scored.sort(key=lambda pair: pair[0])

    print(f"size detected for {len(scored)}/{len(facilities)} facilities ({dropped} dropped, no confident central roof blob)")
    return [facility for _, facility in scored]


def compute_busyness(image_path: Path) -> float | None:
    """Measure how visually "busy"/cluttered an aerial photo is, as the fraction of
    pixels that are Canny edges over the whole frame (not just the center): a big
    empty lot or stretch of desert has very few edges, while a dense built-up area
    full of buildings, streets and cars has many. Returns None for images with no
    real content (e.g. blank/corrupt placeholders), rather than a false "quiet" score.
    """
    img = cv2.imread(str(image_path))
    if img is None:
        return None

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    if gray.std() < NOISE_MIN_STD:
        return None

    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    edges = cv2.Canny(blurred, 50, 150)
    return float(np.count_nonzero(edges)) / edges.size


def get_busyness(facility: Facility, images_dir: Path, cache: ImageFeatureCache) -> float | None:
    path = images_dir / facility.filename
    try:
        stat = path.stat()
    except FileNotFoundError:
        return None

    metric = f"noise_v{NOISE_ALGO_VERSION}"
    cached = cache.get(facility.filename, metric, stat.st_mtime, stat.st_size)
    if cached is not _MISSING:
        return cached

    busyness = compute_busyness(path)
    cache.set(facility.filename, metric, stat.st_mtime, stat.st_size, busyness)
    return busyness


def order_by_noise(
    facilities: list[Facility], images_dir: Path, cache: ImageFeatureCache
) -> list[Facility]:
    """Sort facilities from visually quietest (deserts, big empty lots) to busiest
    (dense built-up city centers). Facilities with no usable image are appended at
    the end (in their existing order) since they can't be placed meaningfully.
    """
    scored: list[tuple[float, Facility]] = []
    unscored: list[Facility] = []
    for facility in facilities:
        busyness = get_busyness(facility, images_dir, cache)
        if busyness is None:
            unscored.append(facility)
        else:
            scored.append((busyness, facility))

    scored.sort(key=lambda pair: pair[0])

    print(f"busyness measured for {len(scored)}/{len(facilities)} facilities ({len(unscored)} unusable images, appended at the end)")
    return [facility for _, facility in scored] + unscored


def format_coords(lat: float | None, lon: float | None) -> str:
    if lat is None or lon is None:
        return "coords unavailable"
    ns = "N" if lat >= 0 else "S"
    ew = "E" if lon >= 0 else "W"
    return f"{abs(lat):.4f}° {ns}, {abs(lon):.4f}° {ew}"


def format_location(city: str | None, country_code: str | None) -> str:
    parts = [p for p in (city, country_code) if p]
    return ", ".join(parts) if parts else "location unknown"


def load_source_image(images_dir: Path, filename: str, size: int) -> Image.Image:
    img = Image.open(images_dir / filename).convert("RGB")
    w, h = img.size
    if w != h:
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        img = img.crop((left, top, left + side, top + side))
    return img.resize((size, size), Image.LANCZOS)


def make_scrim(size: int) -> Image.Image:
    scrim_h = int(size * SCRIM_HEIGHT_FRAC)
    scrim = Image.new("RGBA", (size, scrim_h), (0, 0, 0, 0))
    px = scrim.load()
    for y in range(scrim_h):
        alpha = int(200 * (y / scrim_h) ** 1.5)
        for x in range(size):
            px[x, y] = (0, 0, 0, alpha)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(scrim, (0, size - scrim_h))
    return canvas


def fit_font(
    draw: ImageDraw.ImageDraw,
    text: str,
    font_path: Path,
    max_width: int,
    start_size: int,
    min_size: int,
) -> tuple[ImageFont.FreeTypeFont, str]:
    size = start_size
    while size >= min_size:
        font = ImageFont.truetype(str(font_path), size)
        bbox = draw.textbbox((0, 0), text, font=font)
        if bbox[2] - bbox[0] <= max_width:
            return font, text
        size -= 2

    font = ImageFont.truetype(str(font_path), min_size)
    wrapped = textwrap.fill(text, width=max(10, len(text) // 2))
    return font, wrapped


def render_frame(
    facility: Facility,
    images_dir: Path,
    fonts: dict[str, Path],
    size: int,
) -> Image.Image:
    base = load_source_image(images_dir, facility.filename, size).convert("RGBA")
    base = Image.alpha_composite(base, make_scrim(size))

    draw = ImageDraw.Draw(base)
    padding = int(size * PADDING_FRAC)
    max_text_width = int(size * NAME_MAX_WIDTH_FRAC)

    name_font, name_text = fit_font(
        draw, facility.name, fonts["bold"], max_text_width,
        start_size=int(size * 0.052), min_size=int(size * 0.028),
    )
    detail_font = ImageFont.truetype(str(fonts["regular"]), int(size * 0.03))

    location_text = format_location(facility.city, facility.country_code)
    coords_text = format_coords(facility.lat, facility.lon)

    name_bbox = draw.multiline_textbbox((0, 0), name_text, font=name_font)
    name_height = name_bbox[3] - name_bbox[1]

    y = size - padding
    y -= detail_font.size
    draw.text((padding, y), coords_text, font=detail_font, fill=(220, 220, 220, 255))
    y -= detail_font.size * 1.3
    draw.text((padding, y), location_text, font=detail_font, fill="#ff70b3")
    y -= name_height + int(size * 0.015)
    draw.multiline_text((padding, y), name_text, font=name_font, fill=(255, 255, 255, 255))

    return base.convert("RGB")


def generate_frames(
    facilities: list[Facility],
    images_dir: Path,
    fonts: dict[str, Path],
    size: int,
    frames_per_facility: int,
    frames_dir: Path,
) -> int:
    count = 0
    for facility in facilities:
        try:
            frame = render_frame(facility, images_dir, fonts, size)
        except FileNotFoundError:
            print(f"warning: missing image for facility {facility.id} ({facility.filename}), skipping", file=sys.stderr)
            continue

        for _ in range(frames_per_facility):
            count += 1
            # low compression: these PNGs are immediately consumed by ffmpeg and discarded,
            # so we trade file size for a large save-time win (photographic frames compress slowly)
            frame.save(frames_dir / f"frame_{count:05d}.png", compress_level=1)

    return count


def encode_video(frames_dir: Path, fps: int, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", str(frames_dir / "frame_%05d.png"),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        str(output),
    ]
    subprocess.run(cmd, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=REPO_ROOT / "r00ts.db")
    parser.add_argument("--images-dir", type=Path, default=REPO_ROOT / "image" / "aerial")
    parser.add_argument("--font-dir", type=Path, default=REPO_ROOT / "static" / "fonts" / "GT-Pressura")
    parser.add_argument("--output", type=Path, default=REPO_ROOT / "output" / "aerial_animation.mp4")
    parser.add_argument("--size", type=int, default=1080)
    parser.add_argument("--frames-per-facility", type=int, default=2)
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--keep-frames", type=Path, default=None, help="Persist generated PNG frames to this directory instead of a temp dir")
    parser.add_argument("--limit", type=int, default=None, help="Only process the first N facilities (after shuffling), for quick test runs")
    parser.add_argument(
        "--order", choices=["random", "angle", "size", "noise"], default="random",
        help="'angle' sorts by the dominant building/road orientation detected in each photo, for a rotation effect. "
             "'size' sorts by estimated building size, smallest first, for a 'growing' effect, dropping facilities "
             "with no confidently-detected central roof blob. 'noise' sorts by visual busyness (edge density), from "
             "quiet/empty (deserts, big lots) to dense/cluttered (city centers). All require opencv-python.",
    )
    parser.add_argument(
        "--cache-db", type=Path, default=REPO_ROOT / "output" / "image_analysis_cache.sqlite",
        help="SQLite file used to cache per-image computations (e.g. detected angle) across runs",
    )
    args = parser.parse_args()

    if shutil.which("ffmpeg") is None:
        sys.exit("ffmpeg not found on PATH")

    if args.order in ("angle", "size", "noise") and cv2 is None:
        sys.exit(f"--order {args.order} requires opencv-python (or opencv-python-headless) to be installed")

    fonts = {
        "regular": args.font_dir / "GT-Pressura-Mono-Regular.ttf",
        "bold": args.font_dir / "GT-Pressura-Mono-Bold.ttf",
    }
    for path in fonts.values():
        if not path.exists():
            sys.exit(f"font not found: {path}")

    facilities = load_facilities(args.db, args.seed)
    if args.limit:
        facilities = facilities[: args.limit]

    print(f"{len(facilities)} facilities with aerial photos")

    if args.order in ("angle", "size", "noise"):
        cache = ImageFeatureCache(args.cache_db)
        try:
            if args.order == "angle":
                facilities = order_by_angle(facilities, args.images_dir, cache)
            elif args.order == "size":
                facilities = order_by_size(facilities, args.images_dir, cache)
            else:
                facilities = order_by_noise(facilities, args.images_dir, cache)
        finally:
            cache.close()

    with ExitStack() as stack:
        if args.keep_frames:
            frames_dir = args.keep_frames
            frames_dir.mkdir(parents=True, exist_ok=True)
        else:
            frames_dir = Path(stack.enter_context(tempfile.TemporaryDirectory()))

        frame_count = generate_frames(
            facilities, args.images_dir, fonts, args.size,
            args.frames_per_facility, frames_dir,
        )
        print(f"generated {frame_count} frames in {frames_dir}")

        encode_video(frames_dir, args.fps, args.output)

    duration = frame_count / args.fps
    print(f"wrote {args.output} (~{duration:.1f}s at {args.fps}fps)")


if __name__ == "__main__":
    main()
