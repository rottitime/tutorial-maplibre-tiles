'use client'

import dynamic from 'next/dynamic'

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        width: '100%',
        height: '100%',
        padding: '10px',
        color: '#666',
        fontFamily: 'var(--font-geist-sans), sans-serif',
      }}
    >
      Loading map…
    </div>
  ),
})

export default function MapLoader() {
  return <Map />
}
