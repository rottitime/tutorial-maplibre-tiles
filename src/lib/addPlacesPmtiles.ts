import type { Map } from 'maplibre-gl'
import { ensurePmtilesProtocol } from '@/lib/pmtilesProtocol'

/** Natural Earth populated places (tippecanoe → public/places/places.pmtiles). */
export function addPlacesPmtiles(map: Map) {
  if (map.getSource('places')) return

  ensurePmtilesProtocol()

  map.addSource('places', {
    type: 'vector',
    url: `pmtiles://${window.location.origin}/places/places.pmtiles`,
  })

  map.addLayer({
    id: 'places-dots',
    type: 'circle',
    source: 'places',
    'source-layer': 'places',
    paint: {
      'circle-radius': 3,
      'circle-color': '#111827',
      'circle-opacity': 0.7,
    },
  })

  map.addLayer({
    id: 'places-labels',
    type: 'symbol',
    source: 'places',
    'source-layer': 'places',
    layout: {
      'text-field': ['coalesce', ['get', 'NAME'], ['get', 'NAMEASCII']],
      // No style `glyphs` URL → MapLibre uses local/system fonts (GL JS 5.11+).
      'text-font': ['Arial', 'Helvetica', 'sans-serif'],
      'text-size': 12,
      'text-offset': [0, 0.8],
      'text-anchor': 'top',
      'text-optional': true,
    },
    paint: {
      'text-color': '#111827',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.2,
    },
  })
}
