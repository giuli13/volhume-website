export type HighlightImage = {
  src: string;
  alt: string;
  caption?: string;
  captionStrong?: string;
  captionStrongPosition?: 'before' | 'after';
};

export type HighlightCard = {
  id: string;
  title: string;
  text: string;
  images: HighlightImage[];
  placeholder?: string;
};

export const highlights: HighlightCard[] = [
  {
    id: 'dataset-comparison',
    title: 'Complete 4D Human Ground Truth',
    text: 'VolHuMe is designed to bring together the ground truth needed for 4D human reconstruction in one dataset: RGB-D views, high-resolution meshes, dense point clouds, normal maps, rigged assets, and SMPL-X fittings. It combines rich supervision with a diverse set of 104 captured subjects.',
    images: [
      {
        src: '/assets/highlights/dataset_comparison/datasets_table.png',
        alt: 'Comparison table of VolHuMe with existing 3D and 4D human datasets.',
      },
    ],
  },
  {
    id: 'high-quality-data',
    title: 'High-Quality Volumetric Assets',
    text: 'Captured with a professional close-range volumetric studio, VolHuMe preserves details that distant full-body setups often miss. Clothing texture, hands, face, and local geometry are captured with high fidelity, enabling realistic reconstruction, animation, and avatar research.',
    images: [
      {
        src: '/assets/highlights/high_quality_data/high_quality1.jpg',
        alt: 'High-quality VolHuMe volumetric asset examples.',
      },
      {
        src: '/assets/highlights/high_quality_data/high_quality2.jpg',
        alt: 'Close-up VolHuMe mesh and geometry detail examples.',
      },
    ],
  },
  {
    id: 'smplx-pipeline',
    title: 'A Novel SMPL-X Registration Pipeline',
    text: 'VolHuMe introduces a semi-automatic SMPL-X registration pipeline for aligning body pose, hands, and face to high-resolution scans. The resulting fits reach 4.73 mm skin error, supporting accurate parametric ground truth for dynamic human modeling.',
    images: [
      {
        src: '/assets/highlights/smplx_pipeline/image_01.png',
        alt: 'SMPL-X fitting process from images to optimized body, hand, and face registration.',
      },
    ],
  },
  {
    id: 'smplx-accuracy',
    title: 'Qualitative SMPL-X Comparison',
    text: "VolHuMe's SMPL-X fits are cleaner than those of existing datasets, especially around hands, limbs, and challenging poses. The registrations reduce unnatural deformation and mesh interpenetration, making them more reliable for evaluation and downstream modeling.",
    images: [
      {
        src: '/assets/highlights/smplx_accuracy/smplx_comparison1.jpg',
        alt: 'SMPL-X fitting qualitative comparison on VolHuMe, example one.',
      },
      {
        src: '/assets/highlights/smplx_accuracy/smplx_comparison2.jpg',
        alt: 'SMPL-X fitting qualitative comparison on VolHuMe, example two.',
      },
      {
        src: '/assets/highlights/smplx_accuracy/smplx_comparison3.jpg',
        alt: 'SMPL-X fitting qualitative comparison on VolHuMe, example three.',
      },
    ],
  },
  {
    id: 'dataset-quality-comparison',
    title: 'Fine Detail Compared to Prior Datasets',
    text: 'VolHuMe offers a strong balance between subject diversity, mesh quality, texture resolution, and annotation completeness. Its scans are cleaner in local regions such as hands and face, supporting better SMPL-X fitting and animation-ready 4D assets.',
    images: [
      {
        src: '/assets/highlights/dataset_quality_comparison/dataset_comparison1.jpg',
        alt: 'VolHuMe quality comparison with prior datasets, example one.',
      },
      {
        src: '/assets/highlights/dataset_quality_comparison/dataset_comparison2.jpg',
        alt: 'VolHuMe quality comparison with prior datasets, example two.',
      },
      {
        src: '/assets/highlights/dataset_quality_comparison/dataset_comparison3.jpg',
        alt: 'VolHuMe quality comparison with prior datasets, example three.',
      },
      {
        src: '/assets/highlights/dataset_quality_comparison/dataset_comparison4.jpg',
        alt: 'VolHuMe quality comparison with prior datasets, example four.',
      },
    ],
  },
  {
    id: 'benchmark-quantitative-4d',
    title: 'Quantitative Results for 4D Human Reconstruction',
    text: "VolHuMe delivers competitive 4D reconstruction performance despite using a much sparser capture setup. Animatable Gaussians achieves results comparable to ActorHQ, even though ActorHQ uses 160 cameras while VolHuMe uses only 32 sparse camera modules. This highlights the value of close-range capture: fewer cameras, stronger spatial sampling, and finer geometric supervision.",
    images: [
      {
        src: '/assets/highlights/quantitative_results/results_4d_human.png',
        alt: 'Quantitative 4D human reconstruction results for VolHuMe.',
      },
    ],
  },
];
