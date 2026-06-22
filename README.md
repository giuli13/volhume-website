# VolHuMe Website

Static landing website for **VolHuMe: A High-Resolution Large Scale Dataset of Volumetric Human Meshes**.

Built with Vite, React, and TypeScript. The site is fully static and can be deployed on GitHub Pages with no backend.

## Local Development

```bash
npm install
npm run dev
```

The development server will print a local URL, usually `http://localhost:5173`.

## Build

```bash
npm run build
```

The production files are generated in `dist/`.

## Preview Production Build

```bash
npm run preview
```

## Placeholder Assets

Place the following files under `public/assets/`:

```text
public/assets/hero_video.mp4
public/assets/overview_teaser.png
public/assets/mesh_closeups.png
public/assets/actors/actor_01.png
public/assets/actors/actor_02.png
public/assets/actors/actor_03.png
public/assets/actors/actor_04.png
public/assets/actors/actor_05.png
public/assets/actors/actor_06.png
public/assets/actors/actor_07.png
public/assets/actors/actor_08.png
public/assets/benchmark_view_synthesis.png
public/assets/benchmark_4d.png
```

The React app references assets through `import.meta.env.BASE_URL`, so it works from a GitHub Pages project subpath.

## GitHub Pages Deployment

This repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

1. Push the project to GitHub.
2. In the repository settings, go to **Pages**.
3. Set **Source** to **GitHub Actions**.
4. If needed, run the **Deploy to GitHub Pages** workflow manually from the Actions tab (`workflow_dispatch`).

The workflow installs dependencies, builds the Vite site, and publishes `dist/` to GitHub Pages.

## Manual Deployment

You can also deploy the `dist/` folder with any static host:

```bash
npm install
npm run build
```

Upload the contents of `dist/`.
