'use client'

import { allContinents } from '@/utils/continents'

// Equirectangular: x = lng + 180, y = 90 - lat (viewBox 0 0 360 180)
function toPoint(lat: number, lng: number) {
  return `${(lng + 180).toFixed(1)},${(90 - lat).toFixed(1)}`
}

function ContinentPolygons({ offsetLng = 0 }: { offsetLng?: number }) {
  return (
    <>
      {allContinents.map((pts, ci) => (
        <polygon
          key={ci}
          fill="currentColor"
          points={pts.map(([lat, lng]) => toPoint(lat, lng + offsetLng)).join(' ')}
        />
      ))}
    </>
  )
}

export default function WorldMapBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <svg
        className="absolute h-full text-sky-900 dark:text-sky-300 opacity-[0.04] dark:opacity-[0.05]"
        style={{ width: '200%', animation: 'worldPan 120s linear infinite', top: '5%' }}
        viewBox="0 0 720 180"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {/* First copy */}
        <ContinentPolygons offsetLng={0} />
        {/* Second copy shifted +360° for seamless loop */}
        <ContinentPolygons offsetLng={360} />
      </svg>
    </div>
  )
}
