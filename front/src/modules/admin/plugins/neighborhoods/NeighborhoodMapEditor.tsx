import { useEffect, useMemo, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  Polygon,
  Polyline,
  TileLayer,
  useMapEvents,
} from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import { useTranslation } from 'react-i18next'

export type LngLat = [number, number]

type Props = {
  value: LngLat[]
  onChange: (next: LngLat[]) => void
  otherPolygons?: { id: string; name: string; ring: LngLat[] }[]
  center?: [number, number]
}

const DEFAULT_CENTER: [number, number] = [48.8578, 2.3812]

function toLatLngs(ring: LngLat[]): LatLngExpression[] {
  return ring.map(([lng, lat]) => [lat, lng] as LatLngExpression)
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lng: number, lat: number) => void
}) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lng, event.latlng.lat)
    },
  })
  return null
}

export function NeighborhoodMapEditor({ value, onChange, otherPolygons, center }: Props) {
  const { t } = useTranslation()
  const [activeVertex, setActiveVertex] = useState<number | null>(null)

  const mapCenter = useMemo<[number, number]>(() => {
    if (value.length > 0) {
      const sumLng = value.reduce((s, [lng]) => s + lng, 0)
      const sumLat = value.reduce((s, [, lat]) => s + lat, 0)
      return [sumLat / value.length, sumLng / value.length]
    }
    return center ?? DEFAULT_CENTER
  }, [value, center])

  useEffect(() => {
    if (activeVertex !== null && activeVertex >= value.length) {
      setActiveVertex(null)
    }
  }, [activeVertex, value.length])

  const handleAddPoint = (lng: number, lat: number) => {
    onChange([...value, [lng, lat]])
  }

  const handleRemoveLast = () => {
    if (value.length === 0) return
    onChange(value.slice(0, -1))
  }

  const handleClear = () => {
    onChange([])
    setActiveVertex(null)
  }

  const handleRemoveVertex = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
    setActiveVertex(null)
  }

  const isClosable = value.length >= 3
  const polygonLatLngs = isClosable ? toLatLngs(value) : []
  const polylineLatLngs = !isClosable ? toLatLngs(value) : []

  return (
    <div className="map-editor">
      <div className="map-editor__toolbar">
        <span className="eyebrow">{t('admin.neighborhoods.editor.toolbarLabel')}</span>
        <div className="map-editor__actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={handleRemoveLast}
            disabled={value.length === 0}
          >
            ↶ {t('admin.neighborhoods.editor.undo')}
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={handleClear}
            disabled={value.length === 0}
          >
            🗑️ {t('admin.neighborhoods.editor.clear')}
          </button>
        </div>
      </div>

      <p className="map-editor__hint">
        {value.length === 0
          ? t('admin.neighborhoods.editor.hintEmpty')
          : value.length < 3
            ? t('admin.neighborhoods.editor.hintAddMore', { needed: 3 - value.length })
            : t('admin.neighborhoods.editor.hintReady', { count: value.length })}
      </p>

      <MapContainer
        center={mapCenter}
        zoom={14}
        className="map-editor__canvas"
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {otherPolygons?.map((other) => (
          <Polygon
            key={other.id}
            positions={toLatLngs(other.ring)}
            pathOptions={{
              color: '#8a8aa3',
              weight: 1.5,
              fillColor: '#8a8aa3',
              fillOpacity: 0.12,
              dashArray: '4 6',
            }}
          />
        ))}

        {isClosable ? (
          <Polygon
            positions={polygonLatLngs}
            pathOptions={{
              color: '#7eb0ff',
              weight: 3,
              fillColor: '#4e89ff',
              fillOpacity: 0.25,
            }}
          />
        ) : value.length >= 2 ? (
          <Polyline
            positions={polylineLatLngs}
            pathOptions={{ color: '#7eb0ff', weight: 3, dashArray: '6 6' }}
          />
        ) : null}

        {value.map(([lng, lat], index) => (
          <CircleMarker
            key={`${index}-${lng}-${lat}`}
            center={[lat, lng]}
            radius={7}
            pathOptions={{
              color: activeVertex === index ? '#b45309' : '#ffffff',
              weight: 2,
              fillColor: activeVertex === index ? '#ffb347' : '#4e89ff',
              fillOpacity: 1,
            }}
            eventHandlers={{
              click(e) {
                e.originalEvent.stopPropagation()
                setActiveVertex(index)
              },
              dblclick(e) {
                e.originalEvent.stopPropagation()
                handleRemoveVertex(index)
              },
            }}
          />
        ))}

        <MapClickHandler onMapClick={handleAddPoint} />
      </MapContainer>

      <p className="map-editor__legend">{t('admin.neighborhoods.editor.legend')}</p>
    </div>
  )
}
