import { glyphState } from './glyphState.svelte.ts';
import type { Colour, GlyphDrawFn, GlyphParams } from './types.ts';
import { colourToString } from './utils.ts';

const DEFAULT_FG = 'black';

export const GLYPH_FUNCTIONS: { name: string, fn: GlyphDrawFn }[] = [
    {
        name: "blank",
        fn: (_ctx, _s, _fg) => { }
    },
    {
        name: "line_h",
        fn: (ctx, s, fg) => {
            ctx.strokeStyle = colourToString(fg);

            ctx.beginPath();
            ctx.moveTo(0, s / 2);
            ctx.lineTo(s, s / 2);
            ctx.stroke();
        }
    },
    {
        name: "line_v",
        fn: (ctx, s, fg) => {
            ctx.strokeStyle = colourToString(fg);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, s);
            ctx.stroke();
        }
    },

    {
        name: "circle_small",
        fn: (ctx, s, fg) => {
            ctx.fillStyle = colourToString(fg);

            ctx.beginPath();
            ctx.arc(s / 2, s / 2, s / 3, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    {
        name: "circle",
        fn: (ctx, s, fg) => {
            ctx.fillStyle = colourToString(fg);

            ctx.beginPath();
            ctx.arc(s / 2, s / 2, s / 2 - 1, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    {
        name: "wedge",
        fn: (ctx, s, fg) => {
            ctx.fillStyle = colourToString(fg);

            ctx.moveTo(0, 0);
            ctx.lineTo(s, 0);
            ctx.lineTo(0, s);
            ctx.closePath();
            ctx.fill();
        }
    },

    {
        name: "triangle",
        fn: (ctx, s, fg) => {
            ctx.fillStyle = colourToString(fg);

            ctx.moveTo(s / 2, 0);
            ctx.lineTo(s, s);
            ctx.lineTo(0, s);
            ctx.closePath();
            ctx.fill();
        }
    },
    {
        name: "triangle_d",
        fn: (ctx, s, fg) => {
            ctx.fillStyle = colourToString(fg);

            ctx.moveTo(s / 2, s);
            ctx.lineTo(s, 0);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
        }
    },

    {
        name: "cross",
        fn: (ctx, s, fg) => {
            ctx.strokeStyle = colourToString(fg);

            const o = s * 0.1;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(o, o);
            ctx.lineTo(s - 0, s - 0);
            ctx.moveTo(o, s - o);
            ctx.lineTo(s - o, o);
            ctx.stroke();
        }
    },

    {
        name: "slash",
        fn: (ctx, s, fg) => {
            ctx.strokeStyle = colourToString(fg);

            const o = s * 0.1;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(o, o);
            ctx.lineTo(s - o, s - o);
            ctx.stroke();
        }
    }
];

function colourDistSquared(a: Colour, b: Colour) {
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

async function createGlyph(size: number, drawFn: GlyphDrawFn, fg?: Colour | string, bg?: Colour | string): Promise<ImageBitmap | null> {
    const canvas = new OffscreenCanvas(size, size);
    if (typeof canvas === "undefined") {
        console.log("Offscreen canvas is not avaliable");
        return null;
    }

    const ctx = canvas.getContext("2d");
    if (ctx == null) {
        console.log("2d context not created")
        return null;
    }

    if (fg == null)
        fg = DEFAULT_FG;

    if (bg != null) {
        if (typeof bg == "string") ctx.fillStyle = bg;
        else ctx.fillStyle = colourToString(bg);

        ctx.fillRect(0, 0, size, size);
    }
    drawFn(ctx, size, fg);

    const bitmap = await createImageBitmap(canvas);

    return bitmap;
}

export class RasteriserPalette {
    private glyphFunctions: { [key: string]: GlyphDrawFn } = {};
    public palette: GlyphParams[] = glyphState;

    private glyphPaletteCanvas: HTMLCanvasElement | OffscreenCanvas;
    private glyphPaletteCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

    private glyphSize: number = 10;
    public dpr: number = 1;

    private glyphCache: Map<number, ImageBitmap> = new Map();

    constructor(glyphPaletteCanvas?: HTMLCanvasElement | OffscreenCanvas, glyphSize = 10, dpr = 1) {
        this.dpr = dpr;
        this.glyphSize = glyphSize;

        if (glyphPaletteCanvas === undefined)
            this.glyphPaletteCanvas = new OffscreenCanvas(this.glyphSize * this.dpr, this.glyphSize * this.dpr);
        else
            this.glyphPaletteCanvas = glyphPaletteCanvas;

        if (this.glyphPaletteCanvas instanceof OffscreenCanvas)
            this.glyphPaletteCtx = this.glyphPaletteCanvas.getContext('2d');
        else
            this.glyphPaletteCtx = this.glyphPaletteCanvas.getContext('2d');


        // Some default glyphs
        for (const glyphFn of GLYPH_FUNCTIONS)
            this.addGlyph(glyphFn.name, glyphFn.fn)

        this.setGlyphSize(this.glyphSize);
    }

    setGlyphPalletteCanvas(glyphPaletteCanvas: HTMLCanvasElement) {
        this.glyphPaletteCanvas = glyphPaletteCanvas;
        this.glyphPaletteCtx = this.glyphPaletteCanvas.getContext('2d');

        this.setGlyphSize(this.glyphSize);
    }

    addGlyph(glyphName: string, drawFn: GlyphDrawFn) {
        this.glyphFunctions[glyphName] = drawFn;
    }

    glyphForColour(colour: Colour): ImageBitmap | null {
        if (this.palette.length == 0)
            return null;

        const colourKey = (colour[0] & 0xF0) << 4 | (colour[1] & 0xF0) | (colour[2] >> 4);
        if (this.glyphCache.has(colourKey))
            return this.glyphCache.get(colourKey) as ImageBitmap;

        let best = this.palette[0];
        let bestDist = Infinity;

        for (const entry of this.palette) {
            const dist = colourDistSquared(entry.rgb, colour);
            if (dist < bestDist) {
                bestDist = dist;
                best = entry;
            }
        }

        if (best.bitmap) {
            this.glyphCache.set(colourKey, best.bitmap);
            return best.bitmap;
        }

        return null;
    }

    async setGlyphSize(newSize: number) {
        this.glyphSize = newSize;

        // Re-render the glyph palette
        for (const entry of this.palette) {
            const { glyphName, fg, bg } = entry;
            entry.bitmap = await createGlyph(this.glyphSize * this.dpr, this.glyphFunctions[glyphName], fg, bg);
        }

        this.glyphCache.clear();
        this.renderGlyphPalette();
    }

    renderGlyphPalette() {
        const gs = this.glyphSize * this.dpr;
        this.glyphPaletteCanvas.width = 2 * gs;
        this.glyphPaletteCanvas.height = this.palette.length * gs;

        if (this.glyphPaletteCtx == null)
            return;

        for (let i = 0; i < this.palette.length; i++) {
            const { rgb, bitmap } = this.palette[i];
            this.glyphPaletteCtx.fillStyle = colourToString(rgb);
            this.glyphPaletteCtx.fillRect(0, i * gs, gs, gs);

            if (bitmap != null)
                this.glyphPaletteCtx.drawImage(bitmap, gs, i * gs);
        }
    }
};

export class MapRaseriser {
    private glyphOverlayCanvas: HTMLCanvasElement;
    private mapCanvas: HTMLCanvasElement;
    private glyphOverlayCtx: CanvasRenderingContext2D | null;

    private offscreenCanvas: HTMLCanvasElement | OffscreenCanvas;
    private offscreenCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

    private glyphSize: number;
    private dpr: number = 1;

    private rows: number = 1;
    private cols: number = 1;

    private pixels: Uint32Array | null = null;
    private prevPixels: Uint32Array | null = null;
    private imageData: ImageData | null = null;

    public rasterPalette: RasteriserPalette;

    private capturingFrame = false;
    private useAsyncCapture = false;
    // Synchronous WebGL-canvas readback is fast in some browsers (Firefox) and
    // very slow in others (Chrome, 15-70ms/call). Rather than hardcode a
    // browser check, measure it: only fall back to the async path (which adds
    // a frame or two of lag between the raster overlay and the live map) once
    // the sync path proves too slow on this machine/browser.
    private static readonly SYNC_SLOW_THRESHOLD_MS = 100;

    constructor(
        glyphOverlayCanvas: HTMLCanvasElement,
        mapCanvas: HTMLCanvasElement,
        offscreenCanvas?: HTMLCanvasElement | OffscreenCanvas,
        glyphPaletteCanvas?: HTMLCanvasElement | OffscreenCanvas,
        glyphSize: number = 10
    ) {

        this.mapCanvas = mapCanvas;

        this.dpr = window.devicePixelRatio || 1;
        this.glyphSize = glyphSize;
        this.glyphOverlayCanvas = glyphOverlayCanvas;


        this.pixels = new Uint32Array(this.cols * this.rows);

        if (offscreenCanvas === undefined)
            this.offscreenCanvas = new OffscreenCanvas(1, 1);
        else
            this.offscreenCanvas = offscreenCanvas;

        this.glyphOverlayCtx = this.glyphOverlayCanvas.getContext('2d');
        if (this.glyphOverlayCtx)
            this.glyphOverlayCtx.imageSmoothingEnabled = false;

        if (this.offscreenCanvas instanceof OffscreenCanvas)
            this.offscreenCtx = this.offscreenCanvas.getContext('2d', { alpha: false, willReadFrequently: true });
        else
            this.offscreenCtx = this.offscreenCanvas.getContext('2d', { alpha: false, willReadFrequently: true });

        if (this.offscreenCtx)
            this.offscreenCtx.imageSmoothingEnabled = false;

        this.rasterPalette = new RasteriserPalette(glyphPaletteCanvas, this.glyphSize, this.dpr);

        this.resize();
    }

    setOffscreenCanvas(offscreenCanvas: HTMLCanvasElement) {
        this.offscreenCanvas = offscreenCanvas;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        if (this.offscreenCtx)
            this.offscreenCtx.imageSmoothingEnabled = false;

        this.resize();
    }

    resize(width?: number, height?: number) {
        this.dpr = window.devicePixelRatio || 1;
        this.rasterPalette.dpr = this.dpr;

        if (width != undefined) {
            this.glyphOverlayCanvas.width = width;
            this.glyphOverlayCanvas.style.width = (width / this.dpr) + "px";
        }

        if (height != undefined) {
            this.glyphOverlayCanvas.height = height;
            this.glyphOverlayCanvas.style.height = (height / this.dpr) + "px";
        }

        this.cols = Math.ceil(this.glyphOverlayCanvas.width / (this.glyphSize * this.dpr));
        this.rows = Math.ceil(this.glyphOverlayCanvas.height / (this.glyphSize * this.dpr));

        this.offscreenCanvas.width = this.cols;
        this.offscreenCanvas.height = this.rows;

        this.imageData = null;
        this.prevPixels = null;
        this.pixels = null;

        this.glyphOverlayCtx?.clearRect(0, 0, this.glyphOverlayCanvas.width, this.glyphOverlayCanvas.height);

        this.renderGlyphs();
    }

    // Called from the map's "render" event, which can fire once per repaint.
    renderGlyphs() {
        if (this.offscreenCtx == null || this.glyphOverlayCtx == null) return;

        if (!this.useAsyncCapture) {
            const start = performance.now();
            this.offscreenCtx.drawImage(this.mapCanvas, 0, 0, this.cols, this.rows);
            this.readPixels();
            const readbackMs = performance.now() - start;

            this.drawGlyphsFromPixels();

            // Reading pixels back from a live WebGL canvas can force the browser
            // to synchronously flush and wait on the GPU pipeline (measured
            // 15-70ms/call in Chrome, but near-instant in Firefox). Only switch
            // to the async path — which trades a frame or two of lag between
            // the raster overlay and the live map for not blocking the main
            // thread — once we've actually observed this browser being slow.
            // Timed around the readback alone so a busy glyph-redraw frame
            // (many changed cells during a pan) can't itself trip the switch.
            if (readbackMs > MapRaseriser.SYNC_SLOW_THRESHOLD_MS) {
                this.useAsyncCapture = true;
            }
            return;
        }

        // No fixed-rate throttle here: `capturingFrame` already caps concurrency
        // to one in-flight capture, so this naturally runs as fast as captures
        // resolve.
        if (this.capturingFrame) return;
        this.capturingFrame = true;

        createImageBitmap(this.mapCanvas, {
            resizeWidth: this.cols,
            resizeHeight: this.rows,
            resizeQuality: "pixelated",
        }).then((bitmap) => {
            if (this.offscreenCtx) this.offscreenCtx.drawImage(bitmap, 0, 0);
            bitmap.close();
            this.readPixels();
            this.drawGlyphsFromPixels();
        }).catch(() => { }).finally(() => {
            this.capturingFrame = false;
        });
    }

    private readPixels() {
        if (this.offscreenCtx == null) return;

        if (!this.imageData) {
            this.imageData = this.offscreenCtx.getImageData(0, 0, this.cols, this.rows);
            this.pixels = new Uint32Array(this.imageData.data.buffer)
        } else {
            const fresh = this.offscreenCtx.getImageData(0, 0, this.cols, this.rows);
            this.imageData.data.set(fresh.data);
        }
    }

    private drawGlyphsFromPixels() {
        if (this.glyphOverlayCtx == null || !this.pixels)
            return;

        for (let i = 0, len = this.pixels.length; i < len; i++) {
            const px = this.pixels[i];

            // avoid drawing un-changed pixels
            if (this.prevPixels && this.prevPixels[i] === px) continue;

            const r = px & 0xFF;
            const g = (px >> 8) & 0xFF;
            const b = (px >> 16) & 0xFF;
            const col = Math.floor(i / this.cols);
            const row = i % this.cols;

            const glyph = this.rasterPalette.glyphForColour([r, g, b]);

            if (glyph) this.glyphOverlayCtx.drawImage(glyph, row * this.glyphSize * this.dpr, col * this.glyphSize * this.dpr);
        }

        this.prevPixels = new Uint32Array(this.pixels);
    }

    setGlyphSize(newSize: number) {
        if (newSize == this.glyphSize)
            return;

        this.glyphSize = newSize;
        this.rasterPalette.setGlyphSize(newSize).then(() => {
            this.resize();
        });
    }

    refresh() {
        this.rasterPalette.setGlyphSize(this.glyphSize).then(() => {
            this.renderGlyphs();
        });
    }

}
