export type VideoAsset = {
  label: string;
  mp4?: string;
  webm?: string;
  poster?: string;
};

export type ModalityId =
  | 'texturedMesh'
  | 'pointCloud'
  | 'rgbData'
  | 'depthMaps'
  | 'masks'
  | 'riggedMesh'
  | 'smplx';

export type ModalityDefinition = {
  id: ModalityId;
  label: string;
};

export type GLBSequenceModality = {
  type: 'glbSequence';
  frames: readonly string[];
};

export type VideoSetModality = {
  type: 'videoSet';
  videos: readonly VideoAsset[];
};

export type RiggedModelModality = {
  type: 'riggedModel';
  src?: string;
  animationSrc?: string;
};

export type ActorModality = GLBSequenceModality | VideoSetModality | RiggedModelModality;

export type DatasetActor = {
  id: 'actor_01' | 'actor_02' | 'actor_03';
  label: string;
  basePath: string;
  modalities: Partial<Record<ModalityId, ActorModality>>;
};

export const modalityDefinitions: readonly ModalityDefinition[] = [
  { id: 'texturedMesh', label: 'Textured Mesh' },
  { id: 'pointCloud', label: 'Point Cloud Data' },
  { id: 'rgbData', label: 'RGB Data' },
  { id: 'depthMaps', label: 'Depth Maps' },
  { id: 'masks', label: 'Masks' },
  { id: 'riggedMesh', label: 'Rigged Mesh' },
  { id: 'smplx', label: 'SMPL-X Fittings' },
] as const;

const actor01 = {
  basePath: '/assets/dataset_viewer/actor_01',
  texturedMesh: [
    '/assets/dataset_viewer/actor_01/textured_mesh/7b51f75_00044.glb',
    '/assets/dataset_viewer/actor_01/textured_mesh/7b51f75_00230.glb',
    '/assets/dataset_viewer/actor_01/textured_mesh/7b51f75_00412.glb',
    '/assets/dataset_viewer/actor_01/textured_mesh/7b51f75_00522.glb',
    '/assets/dataset_viewer/actor_01/textured_mesh/7b51f75_00600.glb',
  ],
  pointCloud: [
    '/assets/dataset_viewer/actor_01/point_cloud/7b51f75_merged_00088.glb',
    '/assets/dataset_viewer/actor_01/point_cloud/7b51f75_merged_00460.glb',
    '/assets/dataset_viewer/actor_01/point_cloud/7b51f75_merged_00824.glb',
    '/assets/dataset_viewer/actor_01/point_cloud/7b51f75_merged_01044.glb',
    '/assets/dataset_viewer/actor_01/point_cloud/7b51f75_merged_01200.glb',
  ],
  smplx: [
    '/assets/dataset_viewer/actor_01/smplx/Frame000044.glb',
    '/assets/dataset_viewer/actor_01/smplx/Frame000230.glb',
    '/assets/dataset_viewer/actor_01/smplx/Frame000412.glb',
    '/assets/dataset_viewer/actor_01/smplx/Frame000522.glb',
    '/assets/dataset_viewer/actor_01/smplx/Frame000600.glb',
  ],
} as const;

const actor02 = {
  basePath: '/assets/dataset_viewer/actor_02',
  texturedMesh: [
    '/assets/dataset_viewer/actor_02/textured_mesh/7a92173_00073.glb',
    '/assets/dataset_viewer/actor_02/textured_mesh/7a92173_00293.glb',
    '/assets/dataset_viewer/actor_02/textured_mesh/7a92173_00504.glb',
    '/assets/dataset_viewer/actor_02/textured_mesh/7a92173_00670.glb',
    '/assets/dataset_viewer/actor_02/textured_mesh/7a92173_00760.glb',
  ],
  pointCloud: [
    '/assets/dataset_viewer/actor_02/point_cloud/7a92173_merged_00146.glb',
    '/assets/dataset_viewer/actor_02/point_cloud/7a92173_merged_00586.glb',
    '/assets/dataset_viewer/actor_02/point_cloud/7a92173_merged_01008.glb',
    '/assets/dataset_viewer/actor_02/point_cloud/7a92173_merged_01340.glb',
    '/assets/dataset_viewer/actor_02/point_cloud/7a92173_merged_01520.glb',
  ],
  smplx: [
    '/assets/dataset_viewer/actor_02/smplx/Frame000073.glb',
    '/assets/dataset_viewer/actor_02/smplx/Frame000293.glb',
    '/assets/dataset_viewer/actor_02/smplx/Frame000504.glb',
    '/assets/dataset_viewer/actor_02/smplx/Frame000670.glb',
    '/assets/dataset_viewer/actor_02/smplx/Frame000760.glb',
  ],
} as const;

const actor03 = {
  basePath: '/assets/dataset_viewer/actor_03',
  texturedMesh: [
    '/assets/dataset_viewer/actor_03/textured_mesh/f566702_00043.glb',
    '/assets/dataset_viewer/actor_03/textured_mesh/f566702_00314.glb',
    '/assets/dataset_viewer/actor_03/textured_mesh/f566702_00402.glb',
    '/assets/dataset_viewer/actor_03/textured_mesh/f566702_00579.glb',
    '/assets/dataset_viewer/actor_03/textured_mesh/f566702_00778.glb',
  ],
  pointCloud: [
    '/assets/dataset_viewer/actor_03/point_cloud/f566702_merged_00086.glb',
    '/assets/dataset_viewer/actor_03/point_cloud/f566702_merged_00628.glb',
    '/assets/dataset_viewer/actor_03/point_cloud/f566702_merged_00804.glb',
    '/assets/dataset_viewer/actor_03/point_cloud/f566702_merged_01158.glb',
    '/assets/dataset_viewer/actor_03/point_cloud/f566702_merged_01556.glb',
  ],
  smplx: [
    '/assets/dataset_viewer/actor_03/smplx/Frame00043.glb',
    '/assets/dataset_viewer/actor_03/smplx/Frame00314.glb',
    '/assets/dataset_viewer/actor_03/smplx/Frame00402.glb',
    '/assets/dataset_viewer/actor_03/smplx/Frame00579.glb',
    '/assets/dataset_viewer/actor_03/smplx/Frame00778.glb',
  ],
} as const;

const videosFor = (basePath: string): Record<'rgbData' | 'depthMaps' | 'masks', VideoSetModality> => ({
  rgbData: {
    type: 'videoSet',
    videos: [
      { label: 'View 1', mp4: `${basePath}/mosaico_rgb_1.mp4` },
      { label: 'View 2', mp4: `${basePath}/mosaico_rgb_2.mp4` },
    ],
  },
  depthMaps: {
    type: 'videoSet',
    videos: [{ label: 'Depth 1', mp4: `${basePath}/mosaico_depth.mp4` }],
  },
  masks: {
    type: 'videoSet',
    videos: [
      { label: 'Mask 1', mp4: `${basePath}/mosaico_mask_1.mp4` },
      { label: 'Mask 2', mp4: `${basePath}/mosaico_mask_2.mp4` },
    ],
  },
});

const actorModalities = (
  actor: typeof actor01 | typeof actor02 | typeof actor03,
): Record<ModalityId, ActorModality> => ({
  texturedMesh: { type: 'glbSequence', frames: actor.texturedMesh },
  pointCloud: { type: 'glbSequence', frames: actor.pointCloud },
  ...videosFor(actor.basePath),
  riggedMesh: {
    type: 'riggedModel',
    src: `${actor.basePath}/rigged_mesh/A_pose.glb`,
    animationSrc: `${actor.basePath}/rigged_mesh/animation.glb`,
  },
  smplx: { type: 'glbSequence', frames: actor.smplx },
});

export const datasetActors: readonly DatasetActor[] = [
  {
    id: 'actor_01',
    label: 'Actor 1',
    basePath: actor01.basePath,
    modalities: actorModalities(actor01),
  },
  {
    id: 'actor_02',
    label: 'Actor 2',
    basePath: actor02.basePath,
    modalities: actorModalities(actor02),
  },
  {
    id: 'actor_03',
    label: 'Actor 3',
    basePath: actor03.basePath,
    modalities: actorModalities(actor03),
  },
] as const;

export const modalitySamples = modalityDefinitions.map((definition) => ({
  ...definition,
  ...actorModalities(actor01)[definition.id],
}));
