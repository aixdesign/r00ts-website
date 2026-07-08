import type { Datacenter } from "$lib/types";
import { selectDatacenter } from "./marker.svelte";

export const CLUSTER_MAX_ZOOM = 10;

let datacenters: Datacenter[];

export function addClusterSource(map: maplibregl.Map, dcs: Datacenter[]) {
    const fill = "#ff70b3";
    map.addImage("cluster-square-sm", createSquareImage(24, fill));
    map.addImage("cluster-square-md", createSquareImage(32, fill));

    datacenters = dcs;

    map.addSource("datacenters", {
        type: "geojson",
        data: toGeoJSON(datacenters),
        cluster: true,
        clusterMaxZoom: CLUSTER_MAX_ZOOM,
        clusterRadius: 50
    });

    map.addLayer({
        id: "clusters",
        type: "symbol",
        source: "datacenters",
        filter: ["has", "point_count"],
        layout: {
            "icon-image": "cluster-square-md",
            "icon-allow-overlap": true
        }
    });

    map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "datacenters",
        filter: ["has", "point_count"],
        layout: {
            "text-field": "{point_count_abbreviated}",
            "text-size": 12,
            "text-font": ["GT Pressura Mono", "monospace"],
            "icon-allow-overlap": true,
            "text-allow-overlap": true,
            "visibility": "none",
        }
    });

    map.addLayer({
        id: "unclustered-point",
        type: "symbol",
        source: "datacenters",
        filter: ["!", ["has", "point_count"]],
        layout: {
            "icon-image": "cluster-square-sm",
            "icon-allow-overlap": true
        }
    });

    map.on("click", "clusters", async (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = features[0].properties!.cluster_id;
        const source = map.getSource("datacenters") as maplibregl.GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.easeTo({ center: (features[0].geometry as any).coordinates, zoom });
    });

    map.on("click", "unclustered-point", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["unclustered-point"] });
        const { id } = features[0].properties;
        if (id != undefined) {
            for (const dc of datacenters) {
                if (dc.id != id) continue;

                selectDatacenter(map, dc);
                break;
            }
        }
    });

    map.on("mouseenter", ["clusters", "unclustered-point"], () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on("mouseleave", ["clusters", "unclustered-point"], () => {
        map.getCanvas().style.cursor = '';
    });
}

export function toGeoJSON(dcs: Datacenter[]): GeoJSON.FeatureCollection {
    datacenters = dcs;
    return {
        type: "FeatureCollection",
        features: datacenters.map(dc => ({
            type: "Feature",
            properties: { id: dc.id },
            geometry: {
                type: "Point",
                coordinates: [dc.lon, dc.lat]
            }
        }))
    }
}

function createSquareImage(size: number, fill: string): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, size, size);
    return ctx.getImageData(0, 0, size, size);
}
