# GDAL: GEBCO GeoTIFF → blue bathymetry PMTiles

Convert the GEBCO 2026 sub-ice topo/bathy GeoTIFF quadrants into a single raster PMTiles archive for MapLibre.

```text
src/data/raw/gebco_2026_sub_ice_topo_geotiff/*.tif
  → data/gdal/gebco.vrt
  → data/gdal/gebco-lo.tif          (downsampled elevation)
  → data/gdal/gebco-rgb.tif         (blue color-relief + alpha)
  → data/gdal/gebco-3857.tif
  → data/gdal/gebco.mbtiles
  → public/gebco/gebco.pmtiles      (z0–5 PNG; keep under GitHub’s 100 MB limit)
```

Ocean (elevation &lt; 0) is shaded blue; land and nodata are transparent so `/land` can sit on top.

## Prerequisites

```bash
brew install gdal
# pmtiles CLI (go-pmtiles) — used only to convert MBTiles → PMTiles
# https://github.com/protomaps/go-pmtiles/releases
```

## Steps

### 1. Mosaic

```bash
gdalbuildvrt -overwrite data/gdal/gebco.vrt \
  src/data/raw/gebco_2026_sub_ice_topo_geotiff/*.tif
```

### 2. Downsample (keeps disk/time sane)

```bash
gdalwarp -overwrite \
  -tr 0.02 0.02 \
  -r average \
  -ot Int16 \
  -dstnodata -32767 \
  -co TILED=YES -co COMPRESS=DEFLATE -co BIGTIFF=IF_SAFER \
  data/gdal/gebco.vrt \
  data/gdal/gebco-lo.tif
```

~0.02° is enough detail for zoom 0–5.

### 3. Color-relief (depth → blues)

Ramp file: `data/gdal/gebco-blues.txt` (elevation metres → RGBA).

```bash
gdaldem color-relief \
  data/gdal/gebco-lo.tif \
  data/gdal/gebco-blues.txt \
  data/gdal/gebco-rgb.tif \
  -alpha \
  -co TILED=YES -co COMPRESS=DEFLATE -co BIGTIFF=IF_SAFER
```

### 4. Web Mercator → MBTiles → PMTiles

```bash
gdalwarp -overwrite -t_srs EPSG:3857 -r bilinear \
  -co TILED=YES -co COMPRESS=DEFLATE -co BIGTIFF=IF_SAFER \
  data/gdal/gebco-rgb.tif data/gdal/gebco-3857.tif

gdal_translate -of MBTILES -co TILE_FORMAT=PNG \
  data/gdal/gebco-3857.tif data/gdal/gebco.mbtiles

gdaladdo -r average data/gdal/gebco.mbtiles 2 4 8 16 32

mkdir -p public/gebco
pmtiles convert --force data/gdal/gebco.mbtiles /tmp/gebco-full.pmtiles
# Drop z6 if needed so the file stays under GitHub’s 100 MB soft limit:
pmtiles extract /tmp/gebco-full.pmtiles public/gebco/gebco.pmtiles --maxzoom=5
```


## MapLibre

Raster source (needs `pmtiles` npm package + protocol registration — see `src/lib/addGebcoPmtiles.ts`):

```ts
url: `pmtiles://${origin}/gebco/gebco.pmtiles`
```

Add the layer **under** land so beige land masks ocean under continents.
