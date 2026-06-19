Place actor-specific Dataset Contents viewer assets here.

Expected structure:

- actor_01/textured_mesh/      GLB frame sequence
- actor_01/point_cloud/        colored GLB frame sequence
- actor_01/smplx/              GLB frame sequence
- actor_01/rigged_mesh/A_pose.glb      rigged GLB A-pose model
- actor_01/rigged_mesh/animation.glb   rigged GLB animation sample
- actor_01/mosaico_rgb_*.mp4   RGB videos
- actor_01/mosaico_depth*.mp4  depth videos
- actor_01/mosaico_mask*.mp4   mask videos

Repeat the same structure for actor_02 and actor_03.

Update src/data/modalityAssets.ts after adding files because GitHub Pages cannot enumerate public folders at runtime.
