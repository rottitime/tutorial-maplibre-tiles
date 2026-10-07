# GDAL: GeoJSON → WebP raster tiles

Convert heavy building footprints into slippy-map tiles for MapLibre.

```text
RhodeIsland.geojson
  → buildings.tif          (colored raster)
  → buildings-rgba.tif     (with alpha)
  → public/tiles/{z}/{x}/{y}.webp
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
mkdir -p data/gdal
```

---

## Step 1 — Inspect the GeoJSON

```bash
ogrinfo -so src/data/raw/RhodeIsland.geojson
```

| Part | Meaning |
| --- | --- |
| `ogrinfo` | OGR vector inspector (comes with GDAL) |
| `-so` | Summary only (don’t dump every feature) |
| path | Input GeoJSON |

Use this to confirm geometry type, feature count, and extent before rasterizing.

---

## Step 2 — Rasterize polygons → GeoTIFF

```bash
gdal_rasterize \
  -ot Byte \
  -burn 196 -burn 92 -burn 38 \
  -ts 4096 4096 \
  -a_nodata 0 \
  src/data/raw/RhodeIsland.geojson \
  data/gdal/buildings.tif
```

| Param | Meaning |
| --- | --- |
| `gdal_rasterize` | Draw vector polygons onto a raster grid |
| `-ot Byte` | Pixel type 0–255. **Required** on GDAL 3.13+ (otherwise Float64 → `gdal2tiles` PNG/WebP fails) |
| `-burn 196 -burn 92 -burn 38` | Fill buildings with RGB orange (`#c45c26`) — one value per band |
| `-ts 4096 4096` | Output width × height in pixels (detail vs file size) |
| `-a_nodata 0` | Treat background value `0` as nodata |
| input `.geojson` | Source polygons |
| output `.tif` | Georeferenced GeoTIFF |

Check:

```bash
gdalinfo data/gdal/buildings.tif
```

Expect 3 `Byte` bands and `NoData Value=0`.

---

## Step 3 — Add an alpha channel (transparency)

```bash
gdalwarp -overwrite -dstalpha \
  data/gdal/buildings.tif \
  data/gdal/buildings-rgba.tif
```

| Param | Meaning |
| --- | --- |
| `gdalwarp` | Reproject/convert rasters; here used to add alpha |
| `-overwrite` | Replace output if it exists |
| `-dstalpha` | Create an alpha band from nodata (empty → transparent) |
| input / output | RGB GeoTIFF → RGBA GeoTIFF |

**Why this step:** tiling with only `-a 0,0,0` left many empty pixels as opaque black `(0,0,0,255)`. An explicit alpha band fixes that so MapLibre’s beige/basemap shows through.

---

## Step 4 — Cut into WebP XYZ tiles

```bash
gdal2tiles.py \
  -z 8-14 \
  -r near \
  --xyz \
  --tiledriver=WEBP \
  --webp-lossless \
  data/gdal/buildings-rgba.tif \
  public/tiles
```

| Param | Meaning |
| --- | --- |
| `gdal2tiles.py` | Build a zoom pyramid of map tiles |
| `-z 8-14` | Generate only zooms 8 through 14 |
| `-r near` | Nearest-neighbor resampling (keeps sharp building edges) |
| `--xyz` | OSM/MapLibre Y numbering (not TMS). Without this, use `scheme: 'tms'` in MapLibre |
| `--tiledriver=WEBP` | Write `.webp` instead of `.png` |
| `--webp-lossless` | Lossless WebP (good for crisp polygons + alpha) |
| input `.tif` | RGBA GeoTIFF |
| output dir | e.g. `public/tiles/{z}/{x}/{y}.webp` |

Faster test: use `-z 8-12`.

Optional PNG (for comparison):

```bash
gdal2tiles.py \
  -z 8-14 \
  -r near \
  --xyz \
  data/gdal/buildings-rgba.tif \
  public/tiles-png
```

---

## Step 5 — Use in the app

Static files under `public/` are served by Next.js:

```text
/tiles/{z}/{x}/{y}.webp
```

MapLibre source example:

```ts
map.addSource('buildings', {
  type: 'raster',
  tiles: ['/tiles/{z}/{x}/{y}.webp'],
  tileSize: 256,
  minzoom: 8,
  maxzoom: 14,
})
```

---

## Notes learned in this project

1. **Always set `-ot Byte`** before tiling to PNG/WebP.
2. **`--xyz`** matches MapLibre; default `gdal2tiles` is TMS (flipped Y).
3. **`-a 0,0,0` alone was not enough** for clean transparency → use `gdalwarp -dstalpha`.
4. **Missing tiles (404)** for neighbors outside the data extent are normal; `gdal2tiles` only writes tiles that intersect the raster.
5. Zooms outside `-z` have no dedicated files (MapLibre may overzoom the max zoom).
