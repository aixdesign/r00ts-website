export interface Props {
    zoom?: number;
    center?: [number, number];
    geoJSON?: any;
    glyphSize?: number;
}

export interface DatacenterInfo {
    type: string;
    properties: {
        description: string;
        url: string;
        id: number;
    };
    geometry: {
        type: string;
        coordinates: [number, number];
    };
    marker?: maplibregl.Marker;
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
