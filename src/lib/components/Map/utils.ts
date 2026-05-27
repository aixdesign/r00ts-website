import type { Map } from "maplibre-gl";
import type { Colour } from "./types";

export function colourToString(c: Colour | string): string {
    if (typeof c === "string")
        return c
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function colourDistSquared(a: Colour, b: Colour) {
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}


export function syncMaps(...maps: Map[]) {
    // Create all the movement functions, because if they're created every time
    // they wouldn't be the same and couldn't be removed.
    let fns: Parameters<Map["on"]>[1][] = [];
    maps.forEach((map, index) => {
        // When one map moves, we turn off the movement listeners
        // on all the maps, move it, then turn the listeners on again
        fns[index] = () => {
            off();

            const center = map.getCenter();
            const zoom = map.getZoom();
            const bearing = map.getBearing();
            const pitch = map.getPitch();
            const padding = map.getPadding();

            const clones = maps.filter((_o, i) => i !== index);
            clones.forEach((clone) => {
                clone.jumpTo({
                    center: center,
                    zoom: zoom,
                    bearing: bearing,
                    pitch: pitch,
                    padding: padding
                });
            });

            on();
        };
    });

    const on = () => {
        maps.forEach((map, index) => {
            map.on("move", fns[index]);
        });
    };

    const off = () => {
        maps.forEach((map, index) => {
            map.off("move", fns[index]);
        });
    };

    on();

    return () => {
        off();
        fns = [];
        maps = [];
    };
}
