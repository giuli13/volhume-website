import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const DEFAULT_LIGHTING = {
  exposure: 1,
  sun: 0.8,
  softness: 0.45,
  sky: 0.6,
  ambient: 0.8,
};

type RiggedModelViewerProps = {
  src?: string;
  animationSrc?: string;
  className?: string;
};

function disposeMaterial(material: any) {
  Object.values(material).forEach((value: any) => {
    if (value?.isTexture) {
      value.dispose();
    }
  });
  material.dispose();
}

function disposeObject(object: any) {
  object.traverse((child: any) => {
    if (child.geometry) child.geometry.dispose();
    if (Array.isArray(child.material)) {
      child.material.forEach(disposeMaterial);
    } else if (child.material) {
      disposeMaterial(child.material);
    }
  });
}

export function RiggedModelViewer({ src, animationSrc, className = '' }: RiggedModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const loadedSceneRef = useRef<any>(null);
  const gridRef = useRef<any>(null);
  const floorRef = useRef<any>(null);
  const mixerRef = useRef<any>(null);
  const actionRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const durationRef = useRef(0);
  const currentTimeRef = useRef(0);
  const speedRef = useRef(1);
  const loopRef = useRef(true);
  const autoFollowRef = useRef(false);
  const followFrameRef = useRef(0);
  const lastBoundsUpdateFrameRef = useRef(0);
  const stableFollowTargetRef = useRef<any>(null);
  const smoothedTargetRef = useRef<any>(null);
  const smoothedRadiusRef = useRef(1);
  const smoothedHeightRef = useRef(1);
  const followDirectionRef = useRef<any>(null);
  const boundsFallbackWarnedRef = useRef(false);
  const userInteractingRef = useRef(false);
  const skeletonRefs = useRef<any[]>([]);
  const [mode, setMode] = useState<'apose' | 'animation'>('apose');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [hasSkeleton, setHasSkeleton] = useState(false);
  const [hasAnimation, setHasAnimation] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loopAnimation, setLoopAnimation] = useState(true);
  const [autoFollow, setAutoFollow] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const currentSrc = mode === 'animation' ? animationSrc : src;

  const renderScene = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (renderer && scene && camera) renderer.render(scene, camera);
  };

  const disposeFloor = () => {
    const scene = sceneRef.current;
    if (!floorRef.current) return;
    scene?.remove(floorRef.current);
    floorRef.current.traverse((child: any) => {
      child.geometry?.dispose?.();
      if (Array.isArray(child.material)) {
        child.material.forEach((material: any) => material.dispose?.());
      } else {
        child.material?.dispose?.();
      }
    });
    floorRef.current = null;
    gridRef.current = null;
  };

  const createFloor = (size: number, y: number) => {
    const scene = sceneRef.current;
    if (!scene) return;
    disposeFloor();
    const floorSize = Math.max(size * 2.4, 2.5);
    const group = new THREE.Group();
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(floorSize, floorSize),
      new THREE.MeshStandardMaterial({
        color: 0xf6f7f8,
        roughness: 0.95,
        metalness: 0,
        transparent: true,
        opacity: 0.86,
        side: THREE.DoubleSide,
      }),
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = y - 0.002;
    const grid = new THREE.GridHelper(floorSize, 24, 0xb8c2cc, 0xd8dee5);
    grid.position.y = y;
    grid.material.opacity = 0.48;
    grid.material.transparent = true;
    group.add(plane, grid);
    group.visible = showGrid;
    gridRef.current = group;
    floorRef.current = group;
    scene.add(group);
  };

  const clearSkeletonHelpers = (scene?: any) => {
    skeletonRefs.current.forEach((helper) => {
      helper.parent?.remove(helper);
      if (scene) scene.remove(helper);
      helper.geometry?.dispose?.();
      if (Array.isArray(helper.material)) {
        helper.material.forEach((material: any) => material.dispose?.());
      } else {
        helper.material?.dispose?.();
      }
    });
    skeletonRefs.current = [];
  };

  const clearAnimation = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    actionRef.current?.stop();
    mixerRef.current?.stopAllAction();
    actionRef.current = null;
    mixerRef.current = null;
    currentTimeRef.current = 0;
    durationRef.current = 0;
  };

  const setAnimationTime = (time: number) => {
    const durationValue = durationRef.current;
    const clampedTime = Math.min(Math.max(time, 0), durationValue || 0);
    currentTimeRef.current = clampedTime;
    mixerRef.current?.setTime(clampedTime);
    setCurrentTime(clampedTime);
    followCharacter();
    renderScene();
  };

  const findSkeletonTargets = (model: any) => {
    const skinnedMeshes: any[] = [];
    let hasBone = false;
    model.traverse((child: any) => {
      if (child.isSkinnedMesh) skinnedMeshes.push(child);
      if (child.isBone) hasBone = true;
    });

    return hasBone ? [model] : skinnedMeshes;
  };

  const createSkeletonHelpers = (model: any, scene: any) => {
    clearSkeletonHelpers(scene);
    const targets = findSkeletonTargets(model);

    targets.forEach((target) => {
      const helper = new THREE.SkeletonHelper(target);
      const material = helper.material as any;
      material.color?.set?.(0x00aeef);
      material.transparent = true;
      material.opacity = 1;
      material.depthTest = false;
      material.depthWrite = false;
      helper.frustumCulled = false;
      helper.renderOrder = 999;
      helper.visible = false;
      helper.updateMatrixWorld(true);
      scene.add(helper);
      skeletonRefs.current.push(helper);
    });

    if (import.meta.env.DEV && targets.length === 0) {
      console.warn('VolHuMe rigged viewer: no SkinnedMesh or Bone found for skeleton display.');
    }

    return targets.length;
  };

  const prepareGlbForPreview = (model: any) => {
    model.traverse((child: any) => {
      if (!child.isMesh) return;
      child.frustumCulled = true;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material: any) => {
        if (!material) return;
        if (material.map && THREE.SRGBColorSpace) {
          material.map.colorSpace = THREE.SRGBColorSpace;
          material.map.needsUpdate = true;
        }
        material.needsUpdate = true;
      });
    });
  };

  const findStableFollowTarget = (model: any) => {
    let skeletonRoot: any = null;
    let rootBone: any = null;

    model.traverse((child: any) => {
      if (!skeletonRoot && child.isSkinnedMesh && child.skeleton?.bones?.length) {
        skeletonRoot = child.skeleton.bones.find((bone: any) => !bone.parent?.isBone) ?? child.skeleton.bones[0];
      }
      if (!rootBone && child.isBone && !child.parent?.isBone) {
        rootBone = child;
      }
    });

    return skeletonRoot ?? rootBone ?? null;
  };

  const updateFollowDirectionFromCamera = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const direction = camera.position.clone().sub(controls.target);
    if (direction.lengthSq() < 0.0001) direction.set(0.25, 0.16, 1);
    followDirectionRef.current = direction.normalize();
  };

  const followCharacter = () => {
    const model = loadedSceneRef.current;
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    if (!model || !controls || !camera || !autoFollowRef.current || mode !== 'animation') return;

    followFrameRef.current += 1;
    if (userInteractingRef.current) {
      updateFollowDirectionFromCamera();
      return;
    }

    // Auto camera uses smoothed target/radius updates to avoid flicker from animated bounding boxes.
    const shouldUpdateBounds = followFrameRef.current - lastBoundsUpdateFrameRef.current >= 10;
    if (shouldUpdateBounds || !smoothedTargetRef.current) {
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const measuredTarget = new THREE.Vector3();
      let measuredRadius = smoothedRadiusRef.current || 1;
      let measuredHeight = smoothedHeightRef.current || 1;

      if (!box.isEmpty()) {
        const size = box.getSize(new THREE.Vector3());
        measuredRadius = Math.max(size.length() * 0.5, 1);
        measuredHeight = Math.max(size.y, 1);
      }

      const stableTarget = stableFollowTargetRef.current;
      if (stableTarget) {
        stableTarget.getWorldPosition(measuredTarget);
        measuredTarget.y += measuredHeight * 0.32;
      } else if (!box.isEmpty()) {
        box.getCenter(measuredTarget);
        measuredTarget.y += measuredHeight * 0.18;
      } else {
        model.getWorldPosition(measuredTarget);
      }

      if (!stableTarget && import.meta.env.DEV && !boundsFallbackWarnedRef.current) {
        console.warn('VolHuMe rigged viewer: no root bone found; Auto Camera is using smoothed Box3 fallback.');
        boundsFallbackWarnedRef.current = true;
      }

      if (!smoothedTargetRef.current) {
        smoothedTargetRef.current = measuredTarget.clone();
      } else {
        smoothedTargetRef.current.lerp(measuredTarget, 0.1);
      }

      const radiusRatio = measuredRadius / Math.max(smoothedRadiusRef.current, 0.001);
      const radiusLerp = radiusRatio > 2.2 || radiusRatio < 0.45 ? 0.035 : 0.1;
      smoothedRadiusRef.current = THREE.MathUtils.lerp(smoothedRadiusRef.current || measuredRadius, measuredRadius, radiusLerp);
      smoothedHeightRef.current = THREE.MathUtils.lerp(smoothedHeightRef.current || measuredHeight, measuredHeight, 0.08);
      lastBoundsUpdateFrameRef.current = followFrameRef.current;
    }

    if (!followDirectionRef.current) {
      updateFollowDirectionFromCamera();
    }

    const target = smoothedTargetRef.current ?? controls.target;
    const desiredDistance = Math.max(smoothedRadiusRef.current * 3.6, 5);
    const desiredPosition = target.clone().add(followDirectionRef.current.clone().multiplyScalar(desiredDistance));
    controls.target.lerp(target, 0.06);
    camera.position.lerp(desiredPosition, 0.025);
    camera.near = Math.max(desiredDistance / 100, 0.01);
    camera.far = desiredDistance * 20;
    camera.updateProjectionMatrix();
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let disposed = false;
    if (!currentSrc) {
      setStatus('error');
      return undefined;
    }

    setStatus('loading');
    setHasAnimation(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    followFrameRef.current = 0;
    lastBoundsUpdateFrameRef.current = 0;
    stableFollowTargetRef.current = null;
    smoothedTargetRef.current = null;
    smoothedRadiusRef.current = 1;
    smoothedHeightRef.current = 1;
    followDirectionRef.current = null;
    boundsFallbackWarnedRef.current = false;
    clearAnimation();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f8f8);
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.15));
    renderer.setClearColor(0xf7f8f8, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = DEFAULT_LIGHTING.exposure;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 1000);
    camera.position.set(0, 1.1, 4);
    cameraRef.current = camera;

    const ambientLight = new THREE.AmbientLight(0xffffff, DEFAULT_LIGHTING.ambient);
    const skyLight = new THREE.HemisphereLight(0xf0f8ff, 0xf3d7bd, DEFAULT_LIGHTING.sky);
    const sunLight = new THREE.DirectionalLight(0xffffff, DEFAULT_LIGHTING.sun);
    const fillLight = new THREE.DirectionalLight(0xdff6ff, DEFAULT_LIGHTING.softness);
    sunLight.position.set(3, 5, 4);
    fillLight.position.set(-4, 3, -3);
    scene.add(ambientLight, skyLight, sunLight, fillLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableDamping = false;
    const handleControlsStart = () => {
      userInteractingRef.current = true;
    };
    const handleControlsEnd = () => {
      userInteractingRef.current = false;
      if (autoFollowRef.current) updateFollowDirectionFromCamera();
    };
    controls.addEventListener('change', renderScene);
    controls.addEventListener('start', handleControlsStart);
    controls.addEventListener('end', handleControlsEnd);
    controlsRef.current = controls;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const safeWidth = Math.max(width, 1);
      const safeHeight = Math.max(height, 1);
      renderer.setSize(safeWidth, safeHeight, false);
      camera.aspect = safeWidth / safeHeight;
      camera.updateProjectionMatrix();
      renderScene();
    };

    let resizeObserver: ResizeObserver | null = null;
    const ResizeObserverCtor = window.ResizeObserver;
    if (typeof ResizeObserverCtor === 'function') {
      resizeObserver = new ResizeObserverCtor(resize);
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', resize);
    }
    resize();

    const frameModel = (model: any) => {
      const initialBox = new THREE.Box3().setFromObject(model);
      const initialCenter = initialBox.getCenter(new THREE.Vector3());
      model.position.x -= initialCenter.x;
      model.position.y -= initialBox.min.y;
      model.position.z -= initialCenter.z;
      if (gridRef.current) {
        gridRef.current.visible = showGrid;
      }

      const framedBox = new THREE.Box3().setFromObject(model);
      const center = framedBox.getCenter(new THREE.Vector3());
      const size = framedBox.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z, 1);
      createFloor(maxDimension, framedBox.min.y);
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
      const distanceY = size.y / (2 * Math.tan(verticalFov / 2));
      const distanceX = size.x / (2 * Math.tan(horizontalFov / 2));
      const distance = Math.max(distanceX, distanceY, maxDimension) * 1.35;

      camera.position.set(center.x + distance * 0.32, center.y + distance * 0.16, center.z + distance);
      camera.near = Math.max(distance / 120, 0.01);
      camera.far = distance * 120;
      camera.updateProjectionMatrix();
      controls.target.copy(center);
      controls.update();
      controls.saveState();
      stableFollowTargetRef.current = findStableFollowTarget(model);
      smoothedTargetRef.current = center.clone();
      smoothedRadiusRef.current = Math.max(size.length() * 0.5, 1);
      smoothedHeightRef.current = Math.max(size.y, 1);
      followDirectionRef.current = camera.position.clone().sub(center).normalize();
      followFrameRef.current = 0;
      lastBoundsUpdateFrameRef.current = 0;
    };

    const timeout = window.setTimeout(() => {
      if (!disposed) setStatus('error');
    }, 20000);

    new GLTFLoader().load(
      currentSrc,
      (gltf: any) => {
        if (disposed) return;
        window.clearTimeout(timeout);
        setHasSkeleton(false);
        setShowSkeleton(false);
        setHasAnimation(false);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        clearAnimation();

        const model = gltf.scene;
        prepareGlbForPreview(model);
        loadedSceneRef.current = model;
        scene.add(model);
        frameModel(model);

        setHasSkeleton(findSkeletonTargets(model).length > 0);
        if (gltf.animations?.length) {
          const mixer = new THREE.AnimationMixer(model);
          const clip = gltf.animations[0];
          const action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.clampWhenFinished = false;
          action.play();
          action.paused = true;
          mixerRef.current = mixer;
          actionRef.current = action;
          durationRef.current = clip.duration;
          currentTimeRef.current = 0;
          setDuration(clip.duration);
          setCurrentTime(0);
          setHasAnimation(true);
        }

        setStatus('ready');
        renderScene();
      },
      undefined,
      () => {
        if (!disposed) {
          window.clearTimeout(timeout);
          setStatus('error');
          renderScene();
        }
      },
    );

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      controls.removeEventListener('change', renderScene);
      controls.removeEventListener('start', handleControlsStart);
      controls.removeEventListener('end', handleControlsEnd);
      clearAnimation();
      controls.dispose();
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', resize);
      }
      clearSkeletonHelpers(scene);
      disposeFloor();
      if (loadedSceneRef.current) {
        scene.remove(loadedSceneRef.current);
        disposeObject(loadedSceneRef.current);
      }
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [currentSrc]);

  useEffect(() => {
    const action = actionRef.current;
    const mixer = mixerRef.current;
    if (!action || !mixer || !isPlaying || status !== 'ready') {
      if (action) action.paused = true;
      return undefined;
    }

    action.paused = false;
    clockRef.current.getDelta();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const durationValue = durationRef.current;
      const delta = clockRef.current.getDelta() * speedRef.current;
      let nextTime = currentTimeRef.current + delta;

      if (durationValue > 0 && nextTime >= durationValue) {
        if (loopRef.current) {
          nextTime %= durationValue;
        } else {
          nextTime = durationValue;
          setIsPlaying(false);
        }
      }

      currentTimeRef.current = nextTime;
      mixer.setTime(nextTime);
      setCurrentTime(nextTime);
      followCharacter();
      controlsRef.current?.update();
      renderScene();
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      action.paused = true;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, status]);

  useEffect(() => {
    speedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    loopRef.current = loopAnimation;
  }, [loopAnimation]);

  useEffect(() => {
    autoFollowRef.current = autoFollow;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (autoFollow && camera && controls) {
      updateFollowDirectionFromCamera();
      smoothedTargetRef.current = controls.target.clone();
      followFrameRef.current = 0;
      lastBoundsUpdateFrameRef.current = -10;
    }
    if (!autoFollow) {
      followDirectionRef.current = null;
    }
  }, [autoFollow]);

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.visible = showGrid;
      renderScene();
    }
  }, [showGrid]);

  const resetView = () => {
    controlsRef.current?.reset();
    controlsRef.current?.update();
    renderScene();
  };

  const toggleSkeleton = () => {
    const nextValue = !showSkeleton;
    setShowSkeleton(nextValue);
    if (nextValue && skeletonRefs.current.length === 0 && loadedSceneRef.current && sceneRef.current) {
      createSkeletonHelpers(loadedSceneRef.current, sceneRef.current);
    }
    skeletonRefs.current.forEach((helper) => {
      helper.visible = nextValue;
      helper.updateMatrixWorld(true);
    });
    renderScene();
  };

  const selectMode = (nextMode: 'apose' | 'animation') => {
    if (nextMode === 'animation' && !animationSrc) return;
    setIsPlaying(false);
    setAutoFollow(false);
    setMode(nextMode);
  };

  const toggleAnimation = () => {
    if (!hasAnimation || !actionRef.current) return;
    setIsPlaying((value) => !value);
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  };

  return (
    <div className={`rigged-model-viewer ${className}`} data-status={status}>
      <div className="actorshq-canvas-wrap" ref={containerRef}>
        <div className="viewer-panel viewer-panel-camera">
          <strong>Camera</strong>
          <span>Left Click - Rotate</span>
          <span>Right Click - Pan</span>
          <span>Mouse Scroll - Zoom</span>
          <button type="button" onClick={resetView} aria-label="Reset camera view">Reset View</button>
        </div>
        <div className="viewer-panel viewer-panel-render">
          <strong>Options</strong>
          <button type="button" onClick={() => selectMode('apose')} aria-pressed={mode === 'apose'}>
            A-Pose
          </button>
          <button
            type="button"
            onClick={() => selectMode('animation')}
            disabled={!animationSrc}
            aria-pressed={mode === 'animation'}
          >
            Animation
          </button>
          {!animationSrc ? <span className="viewer-muted-note">Animation unavailable</span> : null}
          {mode === 'animation' && status === 'ready' && !hasAnimation ? (
            <span className="viewer-muted-note">No animation clips</span>
          ) : null}
          <button type="button" onClick={() => setShowGrid((value) => !value)} aria-pressed={showGrid}>
            {showGrid ? 'Hide Grid' : 'Show Grid'}
          </button>
          <button type="button" onClick={toggleSkeleton} disabled={!hasSkeleton} aria-pressed={showSkeleton}>
            {showSkeleton ? 'Hide Skeleton' : 'Show Skeleton'}
          </button>
          {mode === 'animation' && hasAnimation ? (
            <button type="button" onClick={() => setAutoFollow((value) => !value)} aria-pressed={autoFollow}>
              {autoFollow ? 'Manual Camera' : 'Auto Camera'}
            </button>
          ) : null}
          {!hasSkeleton && status === 'ready' ? <span className="viewer-muted-note">Skeleton unavailable</span> : null}
        </div>
        {status === 'loading' ? <div className="actorshq-fallback">Loading preview...</div> : null}
        {status === 'error' ? <div className="actorshq-fallback">Preview unavailable</div> : null}
        {mode === 'animation' && hasAnimation ? (
          <div className="rigged-timeline-bar" aria-label="Rigged mesh animation timeline">
            <button
              type="button"
              onClick={toggleAnimation}
              aria-label={isPlaying ? 'Pause rigged mesh animation' : 'Play rigged mesh animation'}
              aria-pressed={isPlaying}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.001"
              value={currentTime}
              onChange={(event) => {
                setIsPlaying(false);
                setAnimationTime(Number(event.currentTarget.value));
              }}
              aria-label="Rigged mesh animation timeline"
            />
            <span className="rigged-time-label">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <div className="rigged-speed-group" aria-label="Playback speed">
              {[0.5, 1, 2].map((speed) => (
                <button
                  type="button"
                  key={speed}
                  className={playbackSpeed === speed ? 'is-active' : ''}
                  onClick={() => setPlaybackSpeed(speed)}
                  aria-label={`Set playback speed to ${speed}x`}
                  aria-pressed={playbackSpeed === speed}
                >
                  {speed}x
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setLoopAnimation((value) => !value)} aria-pressed={loopAnimation}>
              {loopAnimation ? 'Loop On' : 'Loop Off'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
