import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * PLATEAU 3Dビューアの描画エンジン(Three.js)。
 * 旧`ui-src/dashboard-3d.html`の実装(影シミュレーション、建物レイキャスト、
 * テーマ追従)をコンテナ内で動作するクラスとして移植したもの。
 *
 * PLATEAU 3D viewer rendering engine (Three.js). Ported from the former
 * `ui-src/dashboard-3d.html` standalone page (shadow simulation, building
 * raycasting, theme tracking) into a container-scoped class.
 *
 * Mesin rendering PLATEAU 3D viewer (Three.js). Dipindahkan dari halaman
 * mandiri `ui-src/dashboard-3d.html` (simulasi bayangan, raycasting bangunan,
 * pelacakan tema) menjadi kelas yang berjalan di dalam container.
 */

interface BuildingRecord {
  name: string;
  city: string;
  district: string;
  height: number;
  floors: number;
  lat: number;
  lng: number;
  use: 'office' | 'commercial' | 'residential';
  built: number;
  shadow: 'high' | 'medium' | 'low';
}

const BUILDINGS: BuildingRecord[] = [
  { name: 'ミッドランドスクエア', city: '名古屋市中区', district: '名駅', height: 247, floors: 47, lat: 35.1709, lng: 136.8816, use: 'office', built: 2007, shadow: 'high' },
  { name: 'JRセントラルタワーズ', city: '名古屋市中区', district: '名駅', height: 245, floors: 51, lat: 35.1706, lng: 136.8826, use: 'office', built: 1999, shadow: 'high' },
  { name: 'モード学園スパイラルタワーズ', city: '名古屋市中区', district: '名駅', height: 170, floors: 36, lat: 35.17, lng: 136.8808, use: 'commercial', built: 2008, shadow: 'high' },
  { name: '大名古屋ビルヂング', city: '名古屋市中区', district: '名駅', height: 174, floors: 34, lat: 35.1712, lng: 136.883, use: 'office', built: 2016, shadow: 'high' },
  { name: 'JPタワー名古屋', city: '名古屋市中区', district: '名駅', height: 196, floors: 40, lat: 35.1715, lng: 136.8835, use: 'office', built: 2016, shadow: 'high' },
  { name: '名古屋ルーセントタワー', city: '名古屋市中区', district: '名駅', height: 180, floors: 40, lat: 35.172, lng: 136.88, use: 'office', built: 2007, shadow: 'high' },
  { name: 'グローバルゲート', city: '名古屋市中区', district: '名駅', height: 170, floors: 36, lat: 35.1688, lng: 136.878, use: 'office', built: 2017, shadow: 'high' },
  { name: 'ミッドランドスクエアシネマ棟', city: '名古屋市中区', district: '名駅', height: 85, floors: 18, lat: 35.1707, lng: 136.8812, use: 'commercial', built: 2007, shadow: 'medium' },
  { name: '名古屋プライムセントラルタワー', city: '名古屋市中村区', district: '名駅南', height: 148, floors: 33, lat: 35.168, lng: 136.8845, use: 'office', built: 2009, shadow: 'high' },
  { name: '名古屋テレビ塔', city: '名古屋市中区', district: '栄', height: 180, floors: 5, lat: 35.1713, lng: 136.9088, use: 'commercial', built: 1954, shadow: 'low' },
  { name: '中日ビル', city: '名古屋市中区', district: '栄', height: 158, floors: 33, lat: 35.169, lng: 136.908, use: 'office', built: 2024, shadow: 'high' },
  { name: '錦三丁目25番街区ビル', city: '名古屋市中区', district: '錦', height: 110, floors: 22, lat: 35.1695, lng: 136.902, use: 'office', built: 2022, shadow: 'medium' },
  { name: '松坂屋名古屋店', city: '名古屋市中区', district: '栄', height: 58, floors: 11, lat: 35.1665, lng: 136.9075, use: 'commercial', built: 1936, shadow: 'medium' },
  { name: '三越名古屋栄店', city: '名古屋市中区', district: '栄', height: 60, floors: 10, lat: 35.1698, lng: 136.9068, use: 'commercial', built: 1954, shadow: 'medium' },
  { name: '名古屋ガーデンパレス', city: '名古屋市東区', district: '葵', height: 65, floors: 16, lat: 35.1748, lng: 136.9142, use: 'residential', built: 1998, shadow: 'medium' },
  { name: '今池ガスビル', city: '名古屋市千種区', district: '今池', height: 72, floors: 15, lat: 35.1668, lng: 136.934, use: 'office', built: 1989, shadow: 'medium' },
  { name: 'オアシス21', city: '名古屋市中区', district: '栄', height: 40, floors: 3, lat: 35.1708, lng: 136.9095, use: 'commercial', built: 2002, shadow: 'low' },
  { name: '名古屋パルコ', city: '名古屋市中区', district: '栄', height: 52, floors: 11, lat: 35.1658, lng: 136.9045, use: 'commercial', built: 1989, shadow: 'medium' },
];

const CENTER_LAT = 35.1709;
const CENTER_LNG = 136.8816;
const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LNG = 111320 * Math.cos((CENTER_LAT * Math.PI) / 180);
const SCALE = 0.1;

function latLngToXZ(lat: number, lng: number): [number, number] {
  const dx = (lng - CENTER_LNG) * M_PER_DEG_LNG * SCALE;
  const dz = -(lat - CENTER_LAT) * M_PER_DEG_LAT * SCALE;
  return [dx, dz];
}

const USE_COLORS: Record<string, number> = { office: 0x6366f1, commercial: 0xf59e0b, residential: 0x10b981 };

export type SunPresetKey = 'morning' | 'noon' | 'evening';

const SUN_PRESETS: Record<SunPresetKey, { azimuth: number; altitude: number; label: string }> = {
  morning: { azimuth: 120, altitude: 20, label: '朝 8:00' },
  noon: { azimuth: 180, altitude: 65, label: '正午 12:00' },
  evening: { azimuth: 240, altitude: 15, label: '夕方 17:00' },
};

export interface PlateauStats {
  count: number;
  maxHeight: number;
  avgHeight: number;
  highShadowCount: number;
  avgShadowLength: number;
}

export interface PlateauSceneCallbacks {
  onLoaded?: () => void;
  onStatsUpdate?: (stats: PlateauStats) => void;
  onBuildingSelect?: (building: BuildingRecord) => void;
  onHover?: (building: BuildingRecord | null, clientX: number, clientY: number) => void;
}

function getCurrentTheme(): 'light' | 'dark' {
  const rootTheme = document.documentElement.getAttribute('data-theme');
  if (rootTheme === 'light' || rootTheme === 'dark') return rootTheme;
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

export class PlateauScene {
  private container: HTMLElement;
  private callbacks: PlateauSceneCallbacks;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private sunLight!: THREE.DirectionalLight;
  private groundMesh!: THREE.Mesh;
  private roadEWMesh!: THREE.Mesh;
  private roadNSMesh!: THREE.Mesh;
  private groundMat!: THREE.MeshStandardMaterial;
  private roadMat!: THREE.MeshStandardMaterial;
  private gridHelper: THREE.GridHelper | null = null;
  private readonly buildingMeshes: THREE.Mesh[] = [];
  private readonly raycaster = new THREE.Raycaster();
  private readonly mouse = new THREE.Vector2();
  private hoveredMesh: THREE.Mesh | null = null;
  private currentPreset: SunPresetKey = 'noon';
  private animationFrame = 0;
  private resizeObserver: ResizeObserver | null = null;
  private themeObserver: MutationObserver | null = null;
  private mediaQuery: MediaQueryList | null = null;
  private disposed = false;

  constructor(container: HTMLElement, callbacks: PlateauSceneCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
  }

  init(): void {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 2000);
    this.camera.position.set(40, 35, 50);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.domElement.style.display = 'block';
    this.container.prepend(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 300;
    this.controls.target.set(0, 8, 0);

    this.scene.add(new THREE.AmbientLight(0x4466aa, 0.5));
    this.scene.add(new THREE.HemisphereLight(0x88aaff, 0x443322, 0.4));

    this.sunLight = new THREE.DirectionalLight(0xffeedd, 1.8);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 4096;
    this.sunLight.shadow.mapSize.height = 4096;
    this.sunLight.shadow.camera.left = -120;
    this.sunLight.shadow.camera.right = 120;
    this.sunLight.shadow.camera.top = 120;
    this.sunLight.shadow.camera.bottom = -120;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 400;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.createGround();
    this.createBuildings();

    const theme = getCurrentTheme();
    const initialBg = theme === 'light' ? 0xf8fafc : 0x0f0f23;
    this.scene.background = new THREE.Color(initialBg);
    this.scene.fog = new THREE.FogExp2(initialBg, 0.0015);

    this.updateSceneTheme();
    this.emitStats();
    this.callbacks.onLoaded?.();

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('click', this.onClickBuilding);

    this.themeObserver = new MutationObserver(() => this.updateSceneTheme());
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    if (window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      this.mediaQuery.addEventListener('change', this.updateSceneTheme);
    }

    this.animate();
  }

  setTimePreset(preset: SunPresetKey): void {
    this.currentPreset = preset;
    this.updateSunPosition(preset);
    this.emitStats();
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.themeObserver?.disconnect();
    this.mediaQuery?.removeEventListener('change', this.updateSceneTheme);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.removeEventListener('click', this.onClickBuilding);
    this.controls.dispose();
    this.renderer.dispose();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
    this.renderer.domElement.remove();
  }

  private createGround(): void {
    const theme = getCurrentTheme();
    this.groundMat = new THREE.MeshStandardMaterial({
      color: theme === 'light' ? 0xe2e8f0 : 0x1a2233,
      roughness: 0.95,
      metalness: 0.05,
    });
    this.groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), this.groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -0.01;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    this.roadMat = new THREE.MeshStandardMaterial({
      color: theme === 'light' ? 0xcbd5e1 : 0x252d40,
      roughness: 0.9,
    });
    this.roadEWMesh = new THREE.Mesh(new THREE.PlaneGeometry(300, 1.2), this.roadMat);
    this.roadEWMesh.rotation.x = -Math.PI / 2;
    this.roadEWMesh.position.y = 0.005;
    this.scene.add(this.roadEWMesh);

    this.roadNSMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 300), this.roadMat);
    this.roadNSMesh.rotation.x = -Math.PI / 2;
    this.roadNSMesh.position.y = 0.005;
    this.scene.add(this.roadNSMesh);
  }

  private createBuildings(): void {
    for (const b of BUILDINGS) {
      const [x, z] = latLngToXZ(b.lat, b.lng);
      const h = b.height * SCALE;
      const footprint = Math.sqrt(b.height) * 0.3;

      const geo = new THREE.BoxGeometry(footprint, h, footprint);
      geo.translate(0, h / 2, 0);

      const mat = new THREE.MeshStandardMaterial({
        color: USE_COLORS[b.use] ?? 0x94a3b8,
        roughness: 0.5,
        metalness: 0.3,
        transparent: true,
        opacity: 0.92,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = b;
      this.scene.add(mesh);
      this.buildingMeshes.push(mesh);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 }),
      );
      edges.position.copy(mesh.position);
      this.scene.add(edges);
    }
  }

  private updateSceneTheme = (): void => {
    if (!this.scene || this.disposed) return;
    const theme = getCurrentTheme();

    if (this.gridHelper) this.scene.remove(this.gridHelper);
    const gridColor = theme === 'light' ? 0xcbd5e1 : 0x2d3548;
    const gridLineColor = theme === 'light' ? 0xe2e8f0 : 0x1e2636;
    this.gridHelper = new THREE.GridHelper(600, 120, gridColor, gridLineColor);
    this.gridHelper.position.y = 0;
    this.scene.add(this.gridHelper);

    this.groundMat.color.setHex(theme === 'light' ? 0xe2e8f0 : 0x1a2233);
    this.roadMat.color.setHex(theme === 'light' ? 0xcbd5e1 : 0x252d40);

    this.updateSunPosition(this.currentPreset);
  };

  private updateSunPosition(preset: SunPresetKey): void {
    const params = SUN_PRESETS[preset];
    const azRad = (params.azimuth * Math.PI) / 180;
    const altRad = (params.altitude * Math.PI) / 180;
    const dist = 150;

    const sx = dist * Math.cos(altRad) * Math.sin(azRad);
    const sy = dist * Math.sin(altRad);
    const sz = -dist * Math.cos(altRad) * Math.cos(azRad);

    this.sunLight.position.set(sx, sy, sz);
    this.sunLight.target.position.set(0, 0, 0);
    this.sunLight.intensity = preset === 'noon' ? 1.8 : preset === 'morning' ? 1.2 : 0.9;
    this.sunLight.color.set(preset === 'evening' ? 0xffaa66 : preset === 'morning' ? 0xffeebb : 0xffeedd);

    const theme = getCurrentTheme();
    const bgColors = theme === 'light'
      ? { morning: 0xf1f5f9, noon: 0xf8fafc, evening: 0xfee2e2 }
      : { morning: 0x0d1220, noon: 0x0f0f23, evening: 0x15101a };

    const chosenColor = bgColors[preset];
    if (this.scene.background instanceof THREE.Color) this.scene.background.setHex(chosenColor);
    if (this.scene.fog instanceof THREE.FogExp2) this.scene.fog.color.setHex(chosenColor);
  }

  private emitStats(): void {
    const count = BUILDINGS.length;
    const maxHeight = Math.max(...BUILDINGS.map((b) => b.height));
    const avgHeight = Math.round(BUILDINGS.reduce((s, b) => s + b.height, 0) / count);
    const highShadowCount = BUILDINGS.filter((b) => b.shadow === 'high').length;
    const preset = SUN_PRESETS[this.currentPreset];
    const altRad = (preset.altitude * Math.PI) / 180;
    const avgShadowLength = Math.round(avgHeight / Math.tan(altRad));
    this.callbacks.onStatsUpdate?.({ count, maxHeight, avgHeight, highShadowCount, avgShadowLength });
  }

  private onMouseMove = (e: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.buildingMeshes);

    if (this.hoveredMesh && this.hoveredMesh !== (hits[0]?.object ?? null)) {
      (this.hoveredMesh.material as THREE.MeshStandardMaterial).emissive.set(0x000000);
      this.hoveredMesh = null;
    }

    if (hits.length > 0) {
      const mesh = hits[0].object as THREE.Mesh;
      if (mesh !== this.hoveredMesh) {
        this.hoveredMesh = mesh;
        (mesh.material as THREE.MeshStandardMaterial).emissive.set(0x222244);
      }
      this.renderer.domElement.style.cursor = 'pointer';
      this.callbacks.onHover?.(mesh.userData as BuildingRecord, e.clientX, e.clientY);
    } else {
      this.renderer.domElement.style.cursor = 'grab';
      this.callbacks.onHover?.(null, e.clientX, e.clientY);
    }
  };

  private onClickBuilding = (e: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.buildingMeshes);
    if (hits.length > 0) {
      this.callbacks.onBuildingSelect?.(hits[0].object.userData as BuildingRecord);
    }
  };

  private onResize(): void {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate = (): void => {
    if (this.disposed) return;
    this.animationFrame = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}

export type { BuildingRecord };
export { SUN_PRESETS };
