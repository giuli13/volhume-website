import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type GLBViewerProps = {
  src: string;
  title?: string;
  subtitle?: string;
  poster?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  showAnimationTimeline?: boolean;
  className?: string;
};

type ViewerStatus = 'idle' | 'loading' | 'ready' | 'error';

const FRAME_RATE = 25;
const FRAME_STEP = 1 / FRAME_RATE;

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
    const mesh = child;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(disposeMaterial);
    } else if (mesh.material) {
      disposeMaterial(mesh.material);
    }
  });
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0.0s';
  return `${value.toFixed(1)}s`;
}

function wrapTime(value: number, duration: number) {
  if (!duration) return 0;
  return ((value % duration) + duration) % duration;
}

export function GLBViewer({
  src,
  title = '3D Animated Preview',
  subtitle,
  poster,
  autoPlay = true,
  showControls = true,
  showAnimationTimeline = true,
  className = '',
}: GLBViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerTargetRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);
  const mixerRef = useRef<any>(null);
  const actionRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const frameRef = useRef<number>(0);
  const durationRef = useRef(0);
  const currentTimeRef = useRef(0);
  const isPlayingRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const lastStateSyncRef = useRef(0);
  const [status, setStatus] = useState<ViewerStatus>('idle');
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isPlaying, setIsPlayingState] = useState(false);
  const [hasAnimation, setHasAnimation] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const setIsPlaying = (value: boolean) => {
    isPlayingRef.current = value;
    setIsPlayingState(value);
  };

  const renderScene = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  };

  const setAnimationTime = (time: number) => {
    const nextTime = wrapTime(time, durationRef.current);
    currentTimeRef.current = nextTime;
    mixerRef.current?.setTime(nextTime);
    setCurrentTime(nextTime);
    renderScene();
  };

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = reducedMotionQuery.matches;
  }, []);

  useEffect(() => {
    const node = observerTargetRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '180px 0px', threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shouldLoad) return undefined;

    let disposed = false;
    let loadedScene: any = null;
    const clock = new THREE.Clock();
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;
    setStatus('loading');
    setHasAnimation(false);
    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    durationRef.current = 0;
    currentTimeRef.current = 0;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: window.devicePixelRatio <= 1.5,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0xf8fbff, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 1000);
    camera.position.set(0, 1.1, 4);
    cameraRef.current = camera;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.45);
    const hemisphereLight = new THREE.HemisphereLight(0xf0f8ff, 0xf8d8bd, 1.15);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.65);
    directionalLight.position.set(3, 5, 4);
    scene.add(ambientLight, hemisphereLight, directionalLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = showControls;
    controls.enableZoom = showControls;
    controls.enablePan = showControls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.addEventListener('change', renderScene);
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

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const frameModel = (model: any) => {
      const initialBox = new THREE.Box3().setFromObject(model);
      const initialCenter = initialBox.getCenter(new THREE.Vector3());

      model.position.x -= initialCenter.x;
      model.position.y -= initialBox.min.y;
      model.position.z -= initialCenter.z;

      const framedBox = new THREE.Box3().setFromObject(model);
      const center = framedBox.getCenter(new THREE.Vector3());
      const size = framedBox.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z, 1);
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
      renderScene();
    };

    const loader = new GLTFLoader();
    const timeout = window.setTimeout(() => {
      if (!disposed) {
        setStatus('error');
        renderScene();
      }
    }, 20000);

    loader.load(
      src,
      (gltf: any) => {
        if (disposed) return;
        window.clearTimeout(timeout);
        loadedScene = gltf.scene;
        scene.add(gltf.scene);
        frameModel(gltf.scene);

        if (gltf.animations.length > 0) {
          const clip = gltf.animations[0];
          const mixer = new THREE.AnimationMixer(gltf.scene);
          const action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.clampWhenFinished = false;
          action.enabled = true;
          action.play();

          mixerRef.current = mixer;
          actionRef.current = action;
          durationRef.current = clip.duration;
          setDuration(clip.duration);
          setHasAnimation(true);
          setAnimationTime(0);

          if (autoPlay && !reducedMotionRef.current) {
            setIsPlaying(true);
          }
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

    const animate = () => {
      frameRef.current = window.requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);

      if (isPlayingRef.current && mixerRef.current && durationRef.current > 0) {
        mixerRef.current.update(delta);
        const nextTime = wrapTime(mixerRef.current.time, durationRef.current);
        if (nextTime !== mixerRef.current.time) {
          mixerRef.current.setTime(nextTime);
        }
        currentTimeRef.current = nextTime;

        const now = performance.now();
        if (now - lastStateSyncRef.current > 80) {
          lastStateSyncRef.current = now;
          setCurrentTime(nextTime);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(frameRef.current);
      actionRef.current?.stop();
      mixerRef.current?.stopAllAction();
      controls.removeEventListener('change', renderScene);
      controls.dispose();
      resizeObserver.disconnect();
      if (loadedScene) {
        scene.remove(loadedScene);
        disposeObject(loadedScene);
      }
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      controlsRef.current = null;
      mixerRef.current = null;
      actionRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      sceneRef.current = null;
      isPlayingRef.current = false;
    };
  }, [autoPlay, showControls, shouldLoad, src]);

  const canAnimate = showAnimationTimeline && status === 'ready' && hasAnimation && duration > 0;

  const togglePlayback = () => {
    if (!canAnimate) return;
    setIsPlaying(!isPlayingRef.current);
  };

  const stepFrame = (direction: -1 | 1) => {
    if (!canAnimate) return;
    setIsPlaying(false);
    setAnimationTime(currentTimeRef.current + FRAME_STEP * direction);
  };

  const scrubTimeline = (event: ChangeEvent<HTMLInputElement>) => {
    if (!canAnimate) return;
    setIsPlaying(false);
    setAnimationTime(Number(event.currentTarget.value));
  };

  const resetView = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.reset();
    controls.update();
    renderScene();
  };

  return (
    <div className={`glb-viewer ${className}`} data-status={status} ref={observerTargetRef}>
      <div className="glb-viewer-header">
        <div className="glb-viewer-title">
          <div className="glb-viewer-title-line">
            <span>{title}</span>
            <span className="glb-viewer-badge">
              {status === 'ready' ? (hasAnimation ? 'Animated GLB' : 'Static GLB') : 'GLB Preview'}
            </span>
          </div>
          {subtitle ? <small>{subtitle}</small> : null}
        </div>
        <div className="glb-viewer-actions">
          <div className="glb-help">
            <button className="glb-info-button" type="button" aria-label="3D navigation controls">
              !
            </button>
            <div className="glb-help-tooltip" role="tooltip">
              <span>Rotate: left click + drag</span>
              <span>Pan: right click + drag or Shift + drag</span>
              <span>Zoom: mouse wheel / pinch</span>
              <span>Reset: use Reset View</span>
            </div>
          </div>
          {showControls ? (
            <button type="button" onClick={resetView}>
              Reset View
            </button>
          ) : null}
        </div>
      </div>
      <div className="glb-canvas-wrap" ref={containerRef} style={poster ? { backgroundImage: `url(${poster})` } : undefined}>
        <div className="glb-chip-row" aria-hidden="true">
          <span>Mesh</span>
          <span>Motion</span>
          <span>GLB</span>
          <span>Interactive</span>
        </div>
        {status === 'idle' ? <div className="glb-status">3D sample ready to load</div> : null}
        {status === 'loading' ? <div className="glb-status">Loading 3D sample...</div> : null}
        {status === 'error' ? (
          <div className="glb-status glb-status-placeholder">
            <strong>Preview unavailable</strong>
            <span>{title}</span>
          </div>
        ) : null}
      </div>
      {showAnimationTimeline ? (
        <div className="glb-timeline-bar">
          <button type="button" onClick={() => stepFrame(-1)} disabled={!canAnimate} aria-label="Previous frame">
            Prev
          </button>
          <button
            type="button"
            onClick={togglePlayback}
            disabled={!canAnimate}
            aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={() => stepFrame(1)} disabled={!canAnimate} aria-label="Next frame">
            Next
          </button>
          <input
            type="range"
            min="0"
            max={duration || 1}
            step={FRAME_STEP}
            value={duration ? currentTime : 0}
            onChange={scrubTimeline}
            disabled={!canAnimate}
            aria-label="Animation timeline"
          />
          <span className="glb-time-label">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
