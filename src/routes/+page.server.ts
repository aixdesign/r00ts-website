
export function load() {
    // TODO: load from database
    const datacentersGeoJson = {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': [
                {
                    'type': 'Feature',
                    'properties': {
                        'description': '<strong>A datacenter is here</strong>',
                        'url': 'img1.png',
                        'id': 1
                    },
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [4.9508, 52.3571]
                    }
                },
                {
                    'type': 'Feature',
                    'properties': {
                        'description': '<strong>Equinix AM3 - Amsterdam, Science Park</strong><p>Equinix, Inc.</p><p></p>',
                        'url': 'img2.png',
                        'id': 2
                    },
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [4.9614, 52.3546]
                    }
                }
            ]
        }
    }

    return datacentersGeoJson;
}
