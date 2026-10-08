import type { Map } from 'maplibre-gl'
import { ensurePmtilesProtocol } from '@/lib/pmtilesProtocol'

/** GEBCO bathymetry (color-relief → public/gebco/gebco.pmtiles). */
export function addGebcoPmtiles(map: Map) {
  if (map.getSource('gebco')) return

  ensurePmtilesProtocol()

  map.addSource('gebco', {
    type: 'raster',
    url: `pmtiles://${window.location.origin}/gebco/gebco.pmtiles`,
    tileSize: 256,
  })

  // Under land / buildings / labels.
  const beforeId =
    map.getLayer('land-tile-layer')?.id ??
    map.getStyle().layers?.find((layer) => layer.type === 'symbol')?.id

  map.addLayer(
    {
      id: 'gebco-layer',
      type: 'raster',
      source: 'gebco',
    },
    beforeId,
  )
}
