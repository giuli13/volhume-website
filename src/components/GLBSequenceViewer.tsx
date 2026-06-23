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

type GLBSequenceViewerProps = {
  frames: string[];
  title?: string;
  materialColor?: string;
  modelRotationX?: number;
  showWireframeControl?: boolean;
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
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (Array.isArray(child.material)) {
      child.material.forEach(disposeMaterial);
    } else if (child.material) {
      disposeMaterial(child.material);
    }
  });
}

export function GLBSequenceViewer({
  frames,
  title = 'Frame Sequence',
  materialColor,
  modelRotationX = 0,
  showWireframeControl = true,
  className = '',
}: GLBSequenceViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const loadedSceneRef = useRef<any>(null);
  const gridRef = useRef<any>(null);
  const floorRef = useRef<any>(null);
  const ambientLightRef = useRef<any>(null);
  const skyLightRef = useRef<any>(null);
  const sunLightRef = useRef<any>(null);
  const fillLightRef = useRef<any>(null);
  const wireframeRefs = useRef<any[]>([]);
  const frameRef = useRef<number>(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [showGrid, setShowGrid] = useState(true);
  const [showWireframe, setShowWireframe] = useState(false);

  const frameCount = frames.length;
  const selectedFrame = frames[frameIndex];

  const clearWireframes = () => {
    wireframeRefs.current.forEach((wireframe) => {
      wireframe.parent?.remove(wireframe);
      wireframe.geometry?.dispose();
      wireframe.material?.dispose();
    });
    wireframeRefs.current = [];
  };

  const addWireframes = (model: any) => {
    const scene = sceneRef.current;
    if (!scene) return;
    clearWireframes();
    model.updateMatrixWorld(true);
    model.traverse((child: any) => {
      if (!child.isMesh || !child.geometry) return;
      const geometry = new THREE.WireframeGeometry(child.geometry);
      const material = new THREE.LineBasicMaterial({
        color: 0x111111,
        transparent: true,
        opacity: 0.72,
        depthTest: false,
        depthWrite: false,
      });
      const wireframe = new THREE.LineSegments(geometry, material);
      wireframe.matrixAutoUpdate = false;
      wireframe.matrix.copy(child.matrixWorld);
      wireframe.renderOrder = 50;
      scene.add(wireframe);
      wireframeRefs.current.push(wireframe);
    });
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

  const renderScene = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
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
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

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

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
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

    let resizeObserver: ResizeObserver | null = null;
    let resizeFallbackTimer: number | null = null;
    let fallbackWidth = 0;
    let fallbackHeight = 0;
    if (typeof window.ResizeObserver === 'function') {
      resizeObserver = new window.ResizeObserver(resize);
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', resize);
      fallbackWidth = container.clientWidth;
      fallbackHeight = container.clientHeight;
      resizeFallbackTimer = window.setInterval(() => {
        const nextWidth = container.clientWidth;
        const nextHeight = container.clientHeight;
        if (nextWidth === fallbackWidth && nextHeight === fallbackHeight) return;
        fallbackWidth = nextWidth;
        fallbackHeight = nextHeight;
        resize();
      }, 500);
    }
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
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', resize);
        if (resizeFallbackTimer !== null) {
          window.clearInterval(resizeFallbackTimer);
        }
      }
      if (loadedSceneRef.current) {
        clearWireframes();
        scene.remove(loadedSceneRef.current);
        disposeObject(loadedSceneRef.current);
      }
      disposeFloor();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      loadedSceneRef.current = null;
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
    if (!loadedSceneRef.current) return;
    if (showWireframeControl && showWireframe) {
      addWireframes(loadedSceneRef.current);
    } else {
      clearWireframes();
    }
    renderScene();
  }, [showWireframe, showWireframeControl]);

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

    if (loadedSceneRef.current) {
      clearWireframes();
      scene.remove(loadedSceneRef.current);
      disposeObject(loadedSceneRef.current);
      loadedSceneRef.current = null;
    }

    const frameModel = (model: any) => {
      if (modelRotationX) {
        // VolHuMe point cloud frames are stored with a different up-axis; rotate for web viewer display.
        model.rotation.x = modelRotationX;
        model.updateMatrixWorld(true);
      }

      if (materialColor) {
        const overrideMaterial = new THREE.MeshStandardMaterial({
          color: materialColor,
          roughness: 0.72,
          metalness: 0.02,
        });

        model.traverse((child: any) => {
          if (child.isMesh) {
            if (Array.isArray(child.material)) {
              child.material.forEach(disposeMaterial);
            } else if (child.material) {
              disposeMaterial(child.material);
            }
            child.material = overrideMaterial.clone();
          }
        });
        overrideMaterial.dispose();
      }

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
      if (showWireframeControl && showWireframe) addWireframes(model);
      renderScene();
    };

    const timeout = window.setTimeout(() => {
      if (!disposed) {
        setStatus('error');
        renderScene();
      }
    }, 20000);

    new GLTFLoader().load(
      selectedFrame,
      (gltf: any) => {
        if (disposed) return;
        window.clearTimeout(timeout);
        loadedSceneRef.current = gltf.scene;
        scene.add(gltf.scene);
        frameModel(gltf.scene);
        setStatus('ready');
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
  }, [materialColor, modelRotationX, selectedFrame, showWireframeControl]);

  const stepFrame = (direction: -1 | 1) => {
    setFrameIndex((value) => Math.min(Math.max(value + direction, 0), frameCount - 1));
  };

  const resetView = () => {
    controlsRef.current?.reset();
    controlsRef.current?.update();
    renderScene();
  };

  return (
    <div className={`model-sequence-viewer glb-sequence-viewer ${className}`} data-status={status}>
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
          {showWireframeControl ? (
            <button type="button" onClick={() => setShowWireframe((value) => !value)} aria-pressed={showWireframe}>
              {showWireframe ? 'Hide Wireframe' : 'Show Wireframe'}
            </button>
          ) : null}
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
