import type { Map } from 'maplibre-gl'

/** west, south, east, north — Rhode Island buildings extent */
export const RHODE_ISLAND_BOUNDS: [number, number, number, number] = [
  -71.86237, 41.147808, -71.115557, 42.022976,
]

export function addBoundsBox(
  map: Map,
  bounds: [number, number, number, number] = RHODE_ISLAND_BOUNDS,
) {
  if (map.getSource('bounds')) return

  const [w, s, e, n] = bounds
  map.addSource('bounds', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
      },
    },
  })
  map.addLayer({
    id: 'bounds-line',
    type: 'line',
    source: 'bounds',
    paint: {
      'line-color': '#1d4ed8',
      'line-width': 2,
      'line-dasharray': [2, 1],
    },
  })
}
