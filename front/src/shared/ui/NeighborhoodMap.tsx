import { MapContainer, Polygon, TileLayer } from 'react-leaflet'

const districtCenter: [number, number] = [48.8578, 2.3812]

const districtPolygon: [number, number][] = [
  [48.8685, 2.3688],
  [48.8676, 2.3842],
  [48.8622, 2.3974],
  [48.8537, 2.4004],
  [48.8469, 2.3918],
  [48.8482, 2.3722],
  [48.8571, 2.3638],
]

export function NeighborhoodMap() {
  return (
    <div className="neighborhood-map">
      <div className="neighborhood-map__header">
        <span className="eyebrow">Vue de quartier</span>
        <strong>Paris 11e arrondissement</strong>
      </div>

      <MapContainer
        center={districtCenter}
        zoom={14}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="neighborhood-map__canvas"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Polygon
          positions={districtPolygon}
          pathOptions={{
            color: '#7eb0ff',
            weight: 3,
            fillColor: '#4e89ff',
            fillOpacity: 0.25,
          }}
        />
      </MapContainer>

      <div className="neighborhood-map__footer">
        <span>Republique, Bastille, Nation</span>
        <span>Zone d'entraide locale</span>
      </div>
    </div>
  )
}
