# Tippecanoe: place names → PMTiles

Convert Natural Earth populated places into a vector PMTiles archive for MapLibre.

```text
ne_10m_populated_places.geojson
  → public/places/places.pmtiles
```

## Prerequisites

```bash
brew install tippecanoe
tippecanoe -v
```

## Build

```bash
mkdir -p public/places

tippecanoe \
  -o public/places/places.pmtiles \
  -l places \
  -Z0 -z10 \
  --drop-densest-as-needed \
  --order-by=+SCALERANK \
  -P \
  --force \
  src/data/raw/land-polygons-split-4326/ne_10m_populated_places.geojson
```

| Flag | Meaning |
| --- | --- |
| `-o …pmtiles` | Output PMTiles archive |
| `-l places` | Vector layer id (`source-layer` in MapLibre) |
| `-Z0 -z10` | Min/max zoom (don’t rely on `-zg` alone for sparse global points) |
| `--drop-densest-as-needed` | Thin crowded points at low zooms |
| `--order-by=+SCALERANK` | Prefer keeping lower SCALERANK (more important places) when dropping |
| `-P` | Parallel processing |
| `--force` | Overwrite existing output |

## Use in MapLibre

1. Install `pmtiles` and register the protocol once.
2. Add a `vector` source with `url: 'pmtiles://' + origin + '/places/places.pmtiles'`.
3. Add `circle` / `symbol` layers with `'source-layer': 'places'` and `text-field: ['get', 'NAME']`.

Serve the file from `public/places/` (static HTTP + Range requests). See `src/lib/addPlacesPmtiles.ts`.
