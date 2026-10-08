import maplibregl from 'maplibre-gl'
import { Protocol } from 'pmtiles'

let protocolRegistered = false

/** Register the `pmtiles://` protocol once for the app. */
export function ensurePmtilesProtocol() {
  if (protocolRegistered) return
  const protocol = new Protocol()
  maplibregl.addProtocol('pmtiles', protocol.tile)
  protocolRegistered = true
}
