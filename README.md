This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Data references

| Dataset | Source | Original | Optimised (served) |
| --- | --- | --- | --- |
| Rhode Island buildings | [USBuildingFootprints](https://github.com/microsoft/USBuildingFootprints) | ~105 MB GeoJSON | ~5.5 MB WebP tiles (`public/tiles`) |
| World land polygons | [OSM land polygons](https://osmdata.openstreetmap.de/data/land-polygons.html) (WGS84, split; shapefile ~1.9 GB) | ~1.9 GB GeoJSON | ~163 MB WebP tiles (`public/land`) |
| Place names | [Natural Earth populated places](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_populated_places.geojson) | ~18 MB GeoJSON | ~25 MB PMTiles (`public/places/places.pmtiles`) |
| GEBCO bathymetry | [GEBCO_2026 Grid (sub-ice topo/bathy)](https://www.gebco.net/data-products/gridded-bathymetry-data#toc-find-out-more) | ~7.0 GB GeoTIFF (8 tiles) | ~43 MB PMTiles z0–5 (`public/gebco/gebco.pmtiles`) |
