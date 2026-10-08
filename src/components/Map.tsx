'use client'

import { useEffect, useRef, useState } from 'react'
import type { FeatureCollection, GeoJSON } from 'geojson'
import maplibregl, {
  type GeoJSONSource,
  type StyleSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { addBoundsBox } from '@/lib/addBoundsBox'
import { addGebcoPmtiles } from '@/lib/addGebcoPmtiles'
import { addPlacesPmtiles } from '@/lib/addPlacesPmtiles'

/** OpenMapTiles-compatible basemap (OpenFreeMap). Toggle off to use local beige style only. */
const ENABLE_OPEN_MAP_TILES = false

const OPEN_MAP_TILES_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

const RHODE_ISLAND_CENTER: [number, number] = [-71.4774, 41.5801]

/** One real building from the dataset so the map paints immediately. */
const SAMPLE_BUILDING: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { sample: true },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-71.117228, 41.500115],
            [-71.117256, 41.500174],
            [-71.117362, 41.500146],
            [-71.117333, 41.500087],
            [-71.117228, 41.500115],
          ],
        ],
      },
    },
  ],
}

function createLocalStyle(): StyleSpecification {
  return {
    version: 8,
    name: 'Rhode Island Buildings',
    sources: {
      'rhode-island-buildings': {
        type: 'geojson',
        data: SAMPLE_BUILDING,
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#f0ebe3',
        },
      },
      {
        id: 'rhode-island-buildings-fill',
        type: 'fill',
        source: 'rhode-island-buildings',
        paint: {
          'fill-color': '#c45c26',
          'fill-opacity': 0.85,
        },
      },
      {
        id: 'rhode-island-buildings-outline',
        type: 'line',
        source: 'rhode-island-buildings',
        paint: {
          'line-color': '#5c2a0a',
          'line-width': 0.4,
          'line-opacity': 0.5,
        },
      },
    ],
  }
}

function ensureBuildingGeoJsonLayers(map: maplibregl.Map) {
  if (map.getSource('rhode-island-buildings')) return

  map.addSource('rhode-island-buildings', {
    type: 'geojson',
    data: SAMPLE_BUILDING,
  })

  map.addLayer({
    id: 'rhode-island-buildings-fill',
    type: 'fill',
    source: 'rhode-island-buildings',
    paint: {
      'fill-color': '#c45c26',
      'fill-opacity': 0.85,
    },
  })

  map.addLayer({
    id: 'rhode-island-buildings-outline',
    type: 'line',
    source: 'rhode-island-buildings',
    paint: {
      'line-color': '#5c2a0a',
      'line-width': 0.4,
      'line-opacity': 0.5,
    },
  })
}

function addRasterBuildingTiles(map: maplibregl.Map) {
  if (map.getSource('raster-tile-examples')) return

  //buildings

  map.addSource('raster-tile-examples', {
    type: 'raster',
    tiles: ['/tiles/{z}/{x}/{y}.webp'],
    tileSize: 256,
    minzoom: 8,
    maxzoom: 14,
  })

  map.addLayer(
    {
      id: 'raster-tile-examples-layer',
      type: 'raster',
      source: 'raster-tile-examples',
    },
    map.getStyle().layers?.find((layer) => layer.type === 'symbol')?.id,
  )

  map.addSource('land-tile', {
    type: 'raster',
    tiles: ['/land/{z}/{x}/{y}.webp'],
    tileSize: 256,
  })

  const beforeId = map
    .getStyle()
    .layers?.find((layer) => layer.type === 'symbol')?.id

  map.addLayer(
    {
      id: 'land-tile-layer',
      type: 'raster',
      source: 'land-tile',
    },
    beforeId,
  )
}

export default function Map() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('Starting map…')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false

    const map = new maplibregl.Map({
      container,
      style: ENABLE_OPEN_MAP_TILES ? OPEN_MAP_TILES_STYLE : createLocalStyle(),
      center: [-71.1173, 41.5001],
      zoom: 18,
      attributionControl: ENABLE_OPEN_MAP_TILES,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('error', (event) => {
      setStatus(`Map error: ${event.error?.message ?? 'Unknown map error'}`)
      console.error(event.error)
    })

    map.once('load', () => {
      if (cancelled) return

      addRasterBuildingTiles(map)
      addGebcoPmtiles(map)
      ensureBuildingGeoJsonLayers(map)
      addBoundsBox(map)
      addPlacesPmtiles(map)

      setStatus(
        ENABLE_OPEN_MAP_TILES
          ? 'Open map tiles on — fetching full 105 MB GeoJSON…'
          : 'Sample building loaded — fetching full 105 MB GeoJSON…',
      )

      void (async () => {
        try {
          const response = await fetch(
            new URL('/api/rhode-island', window.location.origin),
          )
          if (!response.ok) {
            throw new Error(`Failed to load GeoJSON (${response.status})`)
          }

          setStatus('Downloaded — parsing JSON…')
          const data = (await response.json()) as GeoJSON
          if (cancelled) return

          const count =
            data.type === 'FeatureCollection' ? data.features.length : 1

          setStatus(
            `Tiling ${count.toLocaleString()} polygons in MapLibre worker…`,
          )

          const source = map.getSource(
            'rhode-island-buildings',
          ) as GeoJSONSource
          await source.setData(data, true)
          if (cancelled) return

          map.jumpTo({ center: RHODE_ISLAND_CENTER, zoom: 9 })
          setStatus(
            ENABLE_OPEN_MAP_TILES
              ? `${count.toLocaleString()} buildings + open map tiles basemap`
              : `${count.toLocaleString()} buildings — orange fills on beige (no basemap)`,
          )
        } catch (error) {
          if (!cancelled) {
            setStatus(
              error instanceof Error ? error.message : 'Failed to load GeoJSON',
            )
            console.error(error)
          }
        }
      })()
    })

    return () => {
      cancelled = true
      map.remove()
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 1,
          maxWidth: 380,
          padding: '8px 12px',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.92)',
          color: '#222',
          fontFamily: 'var(--font-geist-sans), sans-serif',
          fontSize: 13,
          lineHeight: 1.35,
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }}
      >
        {status}
      </div>
    </div>
  )
}
