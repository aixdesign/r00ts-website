import type { GlyphParams } from './types.ts';

export const glyphSize = $state({ value: 6 });

export const glyphState: GlyphParams[] = $state.raw([
    {
        glyphName: "blank",
        label: "water",
        rgb: [0, 0, 0],
        bg: "#75CAFF",
        fg: "#FFF",
    },
    {
        glyphName: "line_h",
        label: "land",
        rgb: [0, 0, 255],
        bg: "#FFF",
        fg: "#FF65AD",
    },
    {
        glyphName: "wedge",
        label: "grass",
        rgb: [255, 0, 255],
        bg: "#FFF",
        fg: "#FFB7FF",
    },
    {
        glyphName: "triangle",
        label: "wood",
        rgb: [0, 255, 255],
        bg: "#FFF",
        fg: "#FF88A0",
    },
    {
        glyphName: "circle",
        label: "residential",
        rgb: [0, 255, 0],
        bg: "#FFF",
        fg: "#FFB7FF",
    }
]);
