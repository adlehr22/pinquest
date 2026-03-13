'use client'

import { memo, useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { RoundResult, Location } from '@/types'
import { useTheme } from 'next-themes'

// Fix Leaflet default icon bug
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function makeTeardropIcon(color: string): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="48">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 8.25 12 24 12 24S24 20.25 24 12C24 5.373 18.627 0 12 0z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="4.5" fill="white" opacity="0.85"/>
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: 'leaflet-teardrop-icon',
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -48],
  })
}

// Icons created once — stable references prevent Leaflet re-renders
const GUESS_ICON  = makeTeardropIcon('#F59E0B')
const ANSWER_ICON = makeTeardropIcon('#38BDF8')

// Shortest-path polyline across the antimeridian
function shortPathPositions(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): [[number, number], [number, number]] {
  let a = lng1
  let b = lng2
  if (Math.abs(b - a) > 180) {
    if (b > a) a += 360; else b += 360
  }
  return [[lat1, a], [lat2, b]]
}

// ── Sub-components ───────────────────────────────────────

interface ClickHandlerProps {
  locked: boolean
  onMapClick: (lat: number, lng: number) => void
  onFirstInteraction: () => void
}

const ClickHandler = memo(function ClickHandler({ locked, onMapClick, onFirstInteraction }: ClickHandlerProps) {
  const interacted = useRef(false)
  useMapEvents({
    click(e) {
      if (!interacted.current) {
        interacted.current = true
        onFirstInteraction()
      }
      if (!locked) onMapClick(e.latlng.lat, e.latlng.lng)
    },
    zoomstart() {
      if (!interacted.current) { interacted.current = true; onFirstInteraction() }
    },
    dragstart() {
      if (!interacted.current) { interacted.current = true; onFirstInteraction() }
    },
  })
  return null
})

interface FlyControllerProps {
  guessLat: number | null
  guessLng: number | null
  targetLat: number
  targetLng: number
  shouldFly: boolean
  hintActive: boolean
}

const FlyController = memo(function FlyController({
  guessLat, guessLng, targetLat, targetLng, shouldFly, hintActive,
}: FlyControllerProps) {
  const map = useMap()
  const hasFlewRef   = useRef(false)
  const hintFlewRef  = useRef(false)

  useEffect(() => {
    if (shouldFly && !hasFlewRef.current && guessLat !== null && guessLng !== null) {
      hasFlewRef.current = true
      const bounds = L.latLngBounds([guessLat, guessLng], [targetLat, targetLng])
      map.flyToBounds(bounds, { padding: [80, 80], duration: 1.2 })
    }
    if (!shouldFly) hasFlewRef.current = false
  }, [shouldFly, guessLat, guessLng, targetLat, targetLng, map])

  useEffect(() => {
    if (hintActive && !hintFlewRef.current) {
      hintFlewRef.current = true
      map.flyTo([targetLat, targetLng], 4, { duration: 1.5 })
    }
  }, [hintActive, targetLat, targetLng, map])

  return null
})

const ResetView = memo(function ResetView({ trigger }: { trigger: number }) {
  const map = useMap()
  useEffect(() => { map.setView([20, 0], 2) }, [trigger, map])
  return null
})

// ── Tile layer that reacts to theme changes ────────────

const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
const DARK_TILES  = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
const TILE_ATTR   = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

// Wrapper so TileLayer key changes when theme flips, forcing a fresh layer
const ThemedTileLayer = memo(function ThemedTileLayer({ isDark }: { isDark: boolean }) {
  return (
    <TileLayer
      key={isDark ? 'dark' : 'light'}
      url={isDark ? DARK_TILES : LIGHT_TILES}
      attribution={TILE_ATTR}
      subdomains="abcd"
      maxZoom={19}
    />
  )
})

// ── Final pair — memoized, only re-renders if props change ──

const MapFinalPair = memo(function MapFinalPair({
  result, location,
}: { result: RoundResult; location: Location }) {
  return (
    <>
      <Marker position={[result.guessLat, result.guessLng]} icon={GUESS_ICON} />
      <Marker position={[location.latitude, location.longitude]} icon={ANSWER_ICON} />
      <Polyline
        positions={shortPathPositions(result.guessLat, result.guessLng, location.latitude, location.longitude)}
        pathOptions={{ color: '#EF4444', dashArray: '8, 8', weight: 2, opacity: 0.7 }}
      />
    </>
  )
})

// ── Main Map component ───────────────────────────────────

interface MapProps {
  targetLocation: Location
  guessLat: number | null
  guessLng: number | null
  locked: boolean
  revealed: boolean
  onGuess: (lat: number, lng: number) => void
  roundKey: number
  hintActive?: boolean
  finalMode?: boolean
  allResults?: RoundResult[]
  allLocations?: Location[]
}

const GameMap = memo(function GameMap({
  targetLocation,
  guessLat,
  guessLng,
  locked,
  revealed,
  onGuess,
  roundKey,
  hintActive = false,
  finalMode = false,
  allResults = [],
  allLocations = [],
}: MapProps) {
  const [showHint, setShowHint] = useState(true)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const handleFirstInteraction = useCallback(() => setShowHint(false), [])
  const handleMapClick = useCallback((lat: number, lng: number) => onGuess(lat, lng), [onGuess])

  useEffect(() => { setShowHint(true) }, [roundKey])

  return (
    <div
      className="relative w-full h-full"
      style={{ touchAction: 'none' }}
    >
      {/* Hint overlay */}
      {showHint && !finalMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
            Pinch or scroll to zoom · Tap to place pin
          </div>
        </div>
      )}

      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={true}
        key={`map-${roundKey}`}
      >
        <ThemedTileLayer isDark={isDark} />

        {!finalMode && (
          <>
            <ClickHandler
              locked={locked}
              onMapClick={handleMapClick}
              onFirstInteraction={handleFirstInteraction}
            />
            <ResetView trigger={roundKey} />
            <FlyController
              guessLat={guessLat}
              guessLng={guessLng}
              targetLat={targetLocation.latitude}
              targetLng={targetLocation.longitude}
              shouldFly={revealed}
              hintActive={hintActive}
            />

            {guessLat !== null && guessLng !== null && (
              <Marker position={[guessLat, guessLng]} icon={GUESS_ICON} />
            )}
            {revealed && (
              <Marker position={[targetLocation.latitude, targetLocation.longitude]} icon={ANSWER_ICON} />
            )}
            {revealed && guessLat !== null && guessLng !== null && (
              <Polyline
                positions={shortPathPositions(guessLat, guessLng, targetLocation.latitude, targetLocation.longitude)}
                pathOptions={{ color: '#EF4444', dashArray: '8, 8', weight: 2, opacity: 0.9 }}
              />
            )}
          </>
        )}

        {finalMode && allResults.map((result, i) => {
          const loc = allLocations.find((l) => l.id === result.locationId)
          if (!loc) return null
          return <MapFinalPair key={i} result={result} location={loc} />
        })}
      </MapContainer>
    </div>
  )
})

export default GameMap
