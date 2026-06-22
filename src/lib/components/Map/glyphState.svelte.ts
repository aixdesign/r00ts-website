import type { GlyphParams } from './types.ts';

export const glyphSize = $state({ value: 10 });

export const glyphState: GlyphParams[] = $state.raw([
    {
        glyphName: "blank",
        label: "water",
        rgb: [0, 0, 0],
        bg: "#75CAFF",
        fg: "#FFF",
    },
    {
        glyphName: "triangle",
        label: "grass",
        rgb: [255, 0, 255],
        bg: "#FFF",
        fg: "#FF88A0",
    },
    {
        glyphName: "cross",
        label: "land",
        rgb: [0, 0, 255],
        bg: "#FFF",
        fg: "#FF65AD",
    },

    {
        glyphName: "slash",
        label: "wood",
        rgb: [0, 255, 255],
        bg: "#FFF",
        fg: "#FFB7FF",
    },
    {
        glyphName: "circle",
        label: "residential",
        rgb: [0, 255, 0],
        bg: "#FFF",
        fg: "#FFB7FF",
    }
]);
