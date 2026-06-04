import type { Datacenter, Weather } from "$lib/types";

export interface Props {
    zoom?: number;
    center?: [number, number];
    geoJSON?: any;
    datacenters?: Datacenter[];
    weatherData?: { [key: number]: Weather };
    glyphSize?: number;
    showDebug?: boolean;
    children?: any
}

export type Colour = [number, number, number];

export type GlyphDrawFn = {
    (
        ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
        s: number,
        c: Colour | string,
    ): void;
};

export type PaletteItem = {
    name: string,
    label: string,
    rgb: Colour,
    fg?: Colour | string,
    bg?: Colour | string,
    canvas: OffscreenCanvas | null,
};

export type GlyphParams = {
    glyphName: string;
    label: string;
    rgb: Colour;
    bg?: string | Colour;
    fg?: string | Colour;
    canvas?: OffscreenCanvas | null;
};
