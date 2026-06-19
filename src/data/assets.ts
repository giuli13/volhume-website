export const assetPaths = {
  hero: {
    heroTeaser: '/assets/hero/hero_teaser.webp',
    heroVideo: '/assets/hero/hero_capture_video.mp4',
  },
  paper: {
    overviewTeaser: '/assets/paper/teaser_overview.webp',
    overviewTeaserVideo: '/assets/videos/teaser.mp4',
    meshCloseups: '/assets/paper/mesh_closeups.webp',
    comparison: '/assets/paper/comparison.webp',
    benchmarkView: '/assets/paper/benchmark_view.webp',
    benchmark4d: '/assets/paper/benchmark_4d.webp',
  },
  subjects: {
    subject001: '/assets/subjects/subject_001.webp',
    subject002: '/assets/subjects/subject_002.webp',
    subject003: '/assets/subjects/subject_003.webp',
    subject004: '/assets/subjects/subject_004.webp',
    subject005: '/assets/subjects/subject_005.webp',
    subject006: '/assets/subjects/subject_006.webp',
    subject007: '/assets/subjects/subject_007.webp',
    subject008: '/assets/subjects/subject_008.webp',
  },
  models: {
    subject001Anim: '/assets/models/subject_001_anim.glb',
    subject002Anim: '/assets/models/subject_002_anim.glb',
  },
  icons: {},
} as const;

export const subjectAssetPaths = [
  assetPaths.subjects.subject001,
  assetPaths.subjects.subject002,
  assetPaths.subjects.subject003,
  assetPaths.subjects.subject004,
  assetPaths.subjects.subject005,
  assetPaths.subjects.subject006,
  assetPaths.subjects.subject007,
  assetPaths.subjects.subject008,
] as const;

export const subjectModelPaths = {
  '01': assetPaths.models.subject001Anim,
  '02': assetPaths.models.subject002Anim,
} as const;

export { modalitySamples } from './modalityAssets';

export function assetUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
}
