# GDAL: land polygons → WebP raster tiles

Convert OSM land polygons into slippy-map tiles for MapLibre (global land mask).

Source data: [OSM land polygons (split, WGS84)](https://osmdata.openstreetmap.de/data/land-polygons.html)

```text
land_polygons.shp  (or .geojson)
  → land.tif              (colored raster)
  → land-rgba.tif         (with alpha)
  → public/land/{z}/{x}/{y}.webp
```

## Prerequisites

```bash
brew install gdal
gdalinfo --version
ogrinfo --version
```

From the project root:

```bash
cd /Users/jaspaul/repos/tutorials/tutorial-maplibre-tiles
mkdir -p data/gdal public/land
```

---

## Step 1 — Inspect the vector data

Prefer the shapefile for GDAL (same data as the GeoJSON, faster to read):

```bash
ogrinfo -so src/data/raw/land-polygons-split-4326/land_polygons.shp
```

Or the GeoJSON:

```bash
ogrinfo -so src/data/raw/land-polygons-split-4326/land_polygons.geojson
```

| Part | Meaning |
| --- | --- |
| `ogrinfo` | OGR vector inspector (comes with GDAL) |
| `-so` | Summary only |
| path | Input shapefile or GeoJSON |

Expect polygons, EPSG:4326, global extent, on the order of ~870k features.

---

## Step 2 — Rasterize polygons → GeoTIFF

```bash
gdal_rasterize \
  -ot Byte \
  -burn 197 -burn 217 -burn 168 \
  -ts 8192 8192 \
  -a_nodata 0 \
  src/data/raw/land-polygons-split-4326/land_polygons.shp \
  data/gdal/land.tif
```

| Param | Meaning |
| --- | --- |
| `gdal_rasterize` | Draw vector polygons onto a raster grid |
| `-ot Byte` | Pixel type 0–255 (required for WebP/PNG tiling on GDAL 3.13+) |
| `-burn 197 -burn 217 -burn 168` | Land fill color RGB (`#c5d9a8`, muted green) |
| `-ts 8192 8192` | Output width × height in pixels (larger than buildings because extent is global) |
| `-a_nodata 0` | Background / ocean = nodata |
| input `.shp` | Land polygons (`.geojson` also works; shapefile is faster) |
| output `.tif` | Georeferenced GeoTIFF |

Check:

```bash
gdalinfo data/gdal/land.tif
```

Expect 3 `Byte` bands and `NoData Value=0`.

---

## Step 3 — Add an alpha channel (transparency)

```bash
gdalwarp -overwrite -dstalpha \
  data/gdal/land.tif \
  data/gdal/land-rgba.tif
```

| Param | Meaning |
| --- | --- |
| `gdalwarp` | Convert/warp rasters; here used to add alpha |
| `-overwrite` | Replace output if it exists |
| `-dstalpha` | Alpha from nodata (ocean/empty → transparent) |
| input / output | RGB → RGBA GeoTIFF |

Without this, empty areas often become opaque black in tiles.

---

## Step 4 — Cut into WebP XYZ tiles

```bash
gdal2tiles.py \
  -z 0-8 \
  -r near \
  --xyz \
  --tiledriver=WEBP \
  --webp-lossless \
  data/gdal/land-rgba.tif \
  public/land
```

| Param | Meaning |
| --- | --- |
| `gdal2tiles.py` | Build a zoom pyramid of map tiles |
| `-z 0-8` | Zooms 0–8 (global coverage; z8–14 for the whole world would be enormous) |
| `-r near` | Nearest-neighbor resampling |
| `--xyz` | MapLibre / OSM tile numbering |
| `--tiledriver=WEBP` | Write `.webp` |
| `--webp-lossless` | Lossless WebP (edges + alpha) |
| input `.tif` | RGBA land GeoTIFF |
| output dir | `public/land/{z}/{x}/{y}.webp` |

Typical result: on the order of ~40k tiles / ~160 MB (exact size varies).

---

## Step 5 — Use in the app

Next.js serves `public/` statically:

```text
/land/{z}/{x}/{y}.webp
```

MapLibre example:

```ts
map.addSource('land', {
  type: 'raster',
  tiles: ['/land/{z}/{x}/{y}.webp'],
  tileSize: 256,
  minzoom: 0,
  maxzoom: 8,
})

map.addLayer({
  id: 'land',
  type: 'raster',
  source: 'land',
})
```

Add this **under** building tiles so buildings draw on top.

---

## How this differs from the buildings pipeline

| | Buildings (`docs/gdal-raster-tiles.md`) | Land (this doc) |
| --- | --- | --- |
| Input | `RhodeIsland.geojson` | World `land_polygons.shp` |
| Extent | Rhode Island | Global |
| `-ts` | `4096 4096` | `8192 8192` |
| Color | Orange `#c45c26` | Green `#c5d9a8` |
| Zooms | `8-14` | `0-8` |
| Output | `public/tiles` | `public/land` |

---

## Notes

1. Prefer **shapefile** for rasterize when both `.shp` and `.geojson` exist — same geometries, less I/O.
2. Global z8–14 raster pyramids are usually impractical; raise maxzoom only if you **clip** to a region (e.g. `-te` on `gdal_rasterize`).
3. Missing ocean tiles (404) are normal — only tiles that intersect land are written.
4. Always use `-ot Byte`, `--xyz`, and `gdalwarp -dstalpha` for the same reasons as the buildings doc.
