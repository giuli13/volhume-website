import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';

type PLYSequenceViewerProps = {
  frames: string[];
  className?: string;
};

const POINT_CLOUD_Z_ROTATION = -Math.PI / 2;
const DEFAULT_LIGHTING = {
  exposure: 1,
  sun: 0.8,
  softness: 0.45,
  sky: 0.6,
  ambient: 0.8,
};

export function PLYSequenceViewer({ frames, className = '' }: PLYSequenceViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const pointsRef = useRef<any>(null);
  const gridRef = useRef<any>(null);
  const floorRef = useRef<any>(null);
  const ambientLightRef = useRef<any>(null);
  const skyLightRef = useRef<any>(null);
  const sunLightRef = useRef<any>(null);
  const fillLightRef = useRef<any>(null);
  const frameRef = useRef<number>(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [showGrid, setShowGrid] = useState(true);
  const [pointSize, setPointSize] = useState(0.012);

  const frameCount = frames.length;
  const selectedFrame = frames[frameIndex];

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f8f8);
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: window.devicePixelRatio <= 1.5,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0xf7f8f8, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = DEFAULT_LIGHTING.exposure;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 1000);
    camera.position.set(0, 1.1, 4);
    cameraRef.current = camera;

    const ambientLight = new THREE.AmbientLight(0xffffff, DEFAULT_LIGHTING.ambient);
    const skyLight = new THREE.HemisphereLight(0xf0f8ff, 0xf3d7bd, DEFAULT_LIGHTING.sky);
    const sunLight = new THREE.DirectionalLight(0xffffff, DEFAULT_LIGHTING.sun);
    const fillLight = new THREE.DirectionalLight(0xdff6ff, DEFAULT_LIGHTING.softness);
    sunLight.position.set(3, 5, 4);
    fillLight.position.set(-4, 3, -3);
    ambientLightRef.current = ambientLight;
    skyLightRef.current = skyLight;
    sunLightRef.current = sunLight;
    fillLightRef.current = fillLight;
    scene.add(ambientLight, skyLight, sunLight, fillLight);

    const controls = new TrackballControls(camera, renderer.domElement);
    controls.noRotate = false;
    controls.noZoom = false;
    controls.noPan = false;
    controls.rotateSpeed = 3.0;
    controls.zoomSpeed = 1.15;
    controls.panSpeed = 0.85;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.08;
    controls.addEventListener('change', renderScene);
    controlsRef.current = controls;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const safeWidth = Math.max(width, 1);
      const safeHeight = Math.max(height, 1);
      renderer.setSize(safeWidth, safeHeight, false);
      camera.aspect = safeWidth / safeHeight;
      camera.updateProjectionMatrix();
      controls.handleResize?.();
      renderScene();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const animate = () => {
      frameRef.current = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameRef.current);
      controls.removeEventListener('change', renderScene);
      controls.dispose();
      resizeObserver.disconnect();
      if (pointsRef.current) {
        scene.remove(pointsRef.current);
        pointsRef.current.geometry.dispose();
        pointsRef.current.material.dispose();
      }
      disposeFloor();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      pointsRef.current = null;
      gridRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.visible = showGrid;
      renderScene();
    }
  }, [showGrid]);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!selectedFrame) {
      setStatus('error');
      return undefined;
    }
    if (!scene || !camera || !controls) return undefined;

    let disposed = false;
    setStatus('loading');

    if (pointsRef.current) {
      scene.remove(pointsRef.current);
      pointsRef.current.geometry.dispose();
      pointsRef.current.material.dispose();
      pointsRef.current = null;
    }

    const framePoints = (geometry: any) => {
      geometry.rotateZ(POINT_CLOUD_Z_ROTATION);
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      geometry.translate(-center.x, -box.min.y, -center.z);
      geometry.computeBoundingBox();

      const framedBox = geometry.boundingBox;
      const framedCenter = framedBox.getCenter(new THREE.Vector3());
      const framedSize = framedBox.getSize(new THREE.Vector3());
      const maxDimension = Math.max(framedSize.x, framedSize.y, framedSize.z, 1);
      createFloor(maxDimension, framedBox.min.y);
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
      const distanceY = framedSize.y / (2 * Math.tan(verticalFov / 2));
      const distanceX = framedSize.x / (2 * Math.tan(horizontalFov / 2));
      const distance = Math.max(distanceX, distanceY, maxDimension) * 1.45;

      if (gridRef.current) {
        gridRef.current.visible = showGrid;
      }
      camera.position.set(framedCenter.x + distance * 0.32, framedCenter.y + distance * 0.16, framedCenter.z + distance);
      camera.near = Math.max(distance / 120, 0.01);
      camera.far = distance * 120;
      camera.updateProjectionMatrix();
      controls.target.copy(framedCenter);
      controls.update();
      controls.target0?.copy(controls.target);
      controls.position0?.copy(camera.position);
      controls.up0?.copy(camera.up);
      renderScene();
    };

    const timeout = window.setTimeout(() => {
      if (!disposed) {
        setStatus('error');
        renderScene();
      }
    }, 20000);

    const fileLoader = new THREE.FileLoader();
    fileLoader.setResponseType('arraybuffer');
    fileLoader.load(
      selectedFrame,
      (buffer: any) => {
        if (disposed) return;
        try {
          const geometry = new PLYLoader().parse(buffer);
          window.clearTimeout(timeout);
          const hasVertexColors = Boolean(geometry.getAttribute('color'));
          const material = new THREE.PointsMaterial({
            size: pointSize,
            sizeAttenuation: true,
            vertexColors: hasVertexColors,
            color: hasVertexColors ? 0xffffff : 0x1d6fe8,
          });
          const points = new THREE.Points(geometry, material);
          pointsRef.current = points;
          scene.add(points);
          framePoints(geometry);
          setStatus('ready');
        } catch {
          window.clearTimeout(timeout);
          setStatus('error');
          renderScene();
        }
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
    };
  }, [selectedFrame, showGrid]);

  useEffect(() => {
    if (pointsRef.current?.material) {
      pointsRef.current.material.size = pointSize;
      pointsRef.current.material.needsUpdate = true;
      renderScene();
    }
  }, [pointSize]);

  const stepFrame = (direction: -1 | 1) => {
    setFrameIndex((value) => Math.min(Math.max(value + direction, 0), frameCount - 1));
  };

  const resetView = () => {
    controlsRef.current?.reset();
    controlsRef.current?.update();
    renderScene();
  };

  return (
    <div className={`model-sequence-viewer ply-sequence-viewer ${className}`} data-status={status}>
      <div className="sequence-canvas-wrap" ref={containerRef}>
        <div className="viewer-panel viewer-panel-camera">
          <strong>Camera</strong>
          <span>Left Click - Rotate</span>
          <span>Right Click - Pan</span>
          <span>Mouse Scroll - Zoom</span>
          <button type="button" onClick={resetView} aria-label="Reset camera view">Reset View</button>
        </div>
        <div className="viewer-panel viewer-panel-render">
          <strong>Options</strong>
          <button type="button" onClick={() => setShowGrid((value) => !value)} aria-pressed={showGrid}>
            {showGrid ? 'Hide Grid' : 'Show Grid'}
          </button>
          <label className="point-size-control">
            Point size
            <input
              type="range"
              min="0.003"
              max="0.04"
              step="0.001"
              value={pointSize}
              onChange={(event) => setPointSize(Number(event.currentTarget.value))}
              aria-label="Point size"
            />
          </label>
        </div>
        {status === 'loading' ? <div className="glb-status">Loading frame...</div> : null}
        {status === 'error' ? <div className="actorshq-fallback">Preview unavailable</div> : null}
      </div>
      <div className="sequence-frame-bar">
        <button type="button" onClick={() => stepFrame(-1)} disabled={frameIndex === 0} aria-label="Previous frame">
          Prev
        </button>
        <span>Frame {frameIndex + 1} / {frameCount}</span>
        <button
          type="button"
          onClick={() => stepFrame(1)}
          disabled={frameIndex >= frameCount - 1}
          aria-label="Next frame"
        >
          Next
        </button>
      </div>
    </div>
  );
}
