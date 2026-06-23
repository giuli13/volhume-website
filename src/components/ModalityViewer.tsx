import { lazy, Suspense, useMemo, useState } from 'react';
import { assetUrl } from '../data/assets';
import { datasetActors, modalityDefinitions, type ActorModality, type ModalityId } from '../data/modalityAssets';
import { VideoSetViewer } from './VideoSetViewer';

const GLBSequenceViewer = lazy(() =>
  import('./GLBSequenceViewer').then((module) => ({ default: module.GLBSequenceViewer })),
);
const RiggedModelViewer = lazy(() =>
  import('./RiggedModelViewer').then((module) => ({ default: module.RiggedModelViewer })),
);

export function ModalityViewer() {
  const modalityEntries = useMemo(() => modalityDefinitions, []);
  const actorEntries = useMemo(() => datasetActors, []);
  const [selectedActorId, setSelectedActorId] = useState<(typeof datasetActors)[number]['id']>('actor_01');
  const [selectedId, setSelectedId] = useState<ModalityId>('texturedMesh');
  const selectedActor = actorEntries.find((actor) => actor.id === selectedActorId) ?? actorEntries[0];
  const selectedDefinition = modalityEntries.find((modality) => modality.id === selectedId) ?? modalityEntries[0];
  const selected = selectedActor.modalities[selectedDefinition.id] as ActorModality | undefined;
  const viewerKey = `${selectedActor.id}-${selectedDefinition.id}`;

  return (
    <div className="modality-viewer actorshq-modality-viewer">
      <div className="dataset-viewer-controls">
        <div className="viewer-control-group">
          <span>Choose Actor</span>
          <div className="actor-tabs" role="tablist" aria-label="Dataset actor selector">
            {actorEntries.map((actor) => (
              <button
                className={actor.id === selectedActor.id ? 'is-active' : ''}
                type="button"
                key={actor.id}
                onClick={() => setSelectedActorId(actor.id)}
                role="tab"
                aria-selected={actor.id === selectedActor.id}
                aria-pressed={actor.id === selectedActor.id}
              >
                {actor.label}
              </button>
            ))}
          </div>
        </div>

        <div className="viewer-control-group viewer-control-group-wide">
          <span>Choose Ground Truth</span>
          <div className="modality-tabs" role="tablist" aria-label="Dataset modality selector">
            {modalityEntries.map((modality) => (
              <button
                className={modality.id === selectedDefinition.id ? 'is-active' : ''}
                type="button"
                key={modality.id}
                onClick={() => setSelectedId(modality.id)}
                role="tab"
                aria-selected={modality.id === selectedDefinition.id}
                aria-pressed={modality.id === selectedDefinition.id}
              >
                {modality.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="modality-preview actorshq-stage">
        {!selected ? <div className="actorshq-fallback">Preview unavailable</div> : null}

        {selected?.type === 'glbSequence' ? (
          <Suspense fallback={<div className="actorshq-fallback">Loading preview...</div>}>
            <GLBSequenceViewer
              key={viewerKey}
              frames={selected.frames.map(assetUrl)}
              materialColor={selectedDefinition.id === 'smplx' ? '#69727e' : undefined}
              modelRotationX={selectedDefinition.id === 'pointCloud' ? -Math.PI / 2 : 0}
              showWireframeControl={selectedDefinition.id !== 'pointCloud'}
              className="modality-sequence-viewer"
            />
          </Suspense>
        ) : null}

        {selected?.type === 'riggedModel' && selected.src ? (
          <Suspense fallback={<div className="actorshq-fallback">Loading preview...</div>}>
            <RiggedModelViewer
              key={viewerKey}
              src={assetUrl(selected.src)}
              animationSrc={selected.animationSrc ? assetUrl(selected.animationSrc) : undefined}
            />
          </Suspense>
        ) : null}

        {selected?.type === 'riggedModel' && !selected.src ? <div className="actorshq-fallback">Preview unavailable</div> : null}

        {selected?.type === 'videoSet' ? (
          <VideoSetViewer
            key={viewerKey}
            videos={selected.videos.map((video) => ({
              ...video,
              mp4: video.mp4 ? assetUrl(video.mp4) : undefined,
              webm: video.webm ? assetUrl(video.webm) : undefined,
              poster: video.poster ? assetUrl(video.poster) : undefined,
            }))}
          />
        ) : null}
      </div>
    </div>
  );
}
