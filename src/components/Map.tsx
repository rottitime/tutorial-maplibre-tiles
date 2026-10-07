'use client'

import { useEffect, useRef, useState } from 'react'
import type { FeatureCollection, GeoJSON } from 'geojson'
import maplibregl, {
  type GeoJSONSource,
  type StyleSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

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

export default function Map() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('Starting map…')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false

    const map = new maplibregl.Map({
      container,
      style: createLocalStyle(),
      center: [-71.1173, 41.5001],
      zoom: 18,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('error', (event) => {
      setStatus(`Map error: ${event.error?.message ?? 'Unknown map error'}`)
      console.error(event.error)
    })

    map.once('load', () => {
      if (cancelled) return

      setStatus('Sample building loaded — fetching full 105 MB GeoJSON…')

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
            `${count.toLocaleString()} buildings — orange fills on beige (no basemap)`,
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

    map.on('load', () => {
      console.log('map loaded')
      map.addSource('raster-tile-examples', {
        type: 'raster',
        tiles: ['/tiles/{z}/{x}/{y}.webp'],
        // tiles: ['/tiles-png/{z}/{x}/{y}.png'],
        tileSize: 256,
        minzoom: 8,
        maxzoom: 14,
      })

      map.addLayer({
        id: 'raster-tile-examples-layer',
        type: 'raster',
        source: 'raster-tile-examples',
      })
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
