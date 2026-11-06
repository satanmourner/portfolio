import * as THREE from '../three.module.js';
import { CAMERA, STAR, STAR_LAYOUT } from './config.js';
import { getStarTexture } from './star-texture.js';
import { state, isDialogOpen } from './state.js';

const _worldPosition = new THREE.Vector3();
const _cameraSpace = new THREE.Vector3();
const _projected = new THREE.Vector3();

let starGroups = [];

export function generateStarPositions(count) {
  const positions = [];
  let separation = STAR_LAYOUT.minSeparation;
  let attempts = 0;

  while (positions.length < count) {
    const candidate = randomStarPosition();
    const isFarEnough = positions.every(
      (position) => position.distanceTo(candidate) >= separation
    );

    if (isFarEnough) {
      positions.push(candidate);
      attempts = 0;
      continue;
    }

    attempts += 1;
    if (attempts >= STAR_LAYOUT.maxAttempts) {
      separation = Math.max(separation * 0.6, 7);
      attempts = 0;
    }
  }

  return positions;
}

export function createStarField(scene, starsData) {
  const positions = generateStarPositions(starsData.length);

  starGroups = starsData.map((star, index) => {
    const group = createStar();
    group.position.copy(positions[index]);
    group.userData.star = star;
    group.userData.core = group.children[0];
    group.userData.appear = 0;
    group.userData.twinkle = Math.random() * Math.PI * 2;
    scene.add(group);
    return group;
  });

  return starGroups;
}

export function pickStar(camera) {
  if (isDialogOpen() || !state.pointerOnCanvas) return null;

  // Screen-space picking keeps stars clickable at every camera angle. Raycasting
  // an invisible sphere failed when the camera moved inside it (back-face cull).
  camera.updateMatrixWorld();

  const pointerX = state.pointerScreen.x;
  const pointerY = state.pointerScreen.y;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const pixelScale = viewportHeight
    / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));

  let closestStar = null;
  let closestDistance = Infinity;

  for (const star of starGroups) {
    if (star.userData.appear <= STAR.pickMinAppear) continue;

    star.getWorldPosition(_worldPosition);
    _cameraSpace.copy(_worldPosition).applyMatrix4(camera.matrixWorldInverse);

    // Skip stars that are behind the camera or inside the near plane.
    if (_cameraSpace.z >= -camera.near) continue;

    _projected.copy(_worldPosition).project(camera);

    const screenX = (_projected.x * 0.5 + 0.5) * viewportWidth;
    const screenY = (-_projected.y * 0.5 + 0.5) * viewportHeight;
    const distance = Math.hypot(screenX - pointerX, screenY - pointerY);

    const depth = Math.max(-_cameraSpace.z, camera.near);
    const radius = THREE.MathUtils.clamp(
      (STAR.pickRadiusWorld * star.scale.x * pixelScale) / depth,
      STAR.pickRadiusPx,
      STAR.pickRadiusMaxPx
    );

    if (distance <= radius && distance < closestDistance) {
      closestStar = star;
      closestDistance = distance;
    }
  }

  return closestStar;
}

export function updateStars(camera, elapsed) {
  starGroups.forEach((star) => updateStar(camera, star, elapsed));
}

function randomStarPosition() {
  const { minRadius, maxRadius } = STAR_LAYOUT;
  const radius = Math.cbrt(
    THREE.MathUtils.randFloat(minRadius ** 3, maxRadius ** 3)
  );
  const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
  const phi = Math.acos(THREE.MathUtils.randFloat(-1, 1));
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function createStar() {
  const group = new THREE.Group();
  const texture = getStarTexture();

  const coreMaterial = new THREE.SpriteMaterial({
    map: texture,
    color: 0xfff6c8,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const core = new THREE.Sprite(coreMaterial);
  core.scale.set(4.2, 4.2, 1);

  group.add(core);
  return group;
}

function updateStar(camera, star, elapsed) {
  const zoomProgress = THREE.MathUtils.mapLinear(
    camera.position.z,
    CAMERA.minDistance,
    CAMERA.maxDistance,
    0,
    1
  );
  const pulse = THREE.MathUtils.clamp(
    0.5
      + Math.sin(elapsed * 5 + star.userData.twinkle) * 0.35
      + Math.sin(elapsed * 13 + star.userData.twinkle * 2.7) * 0.15,
    0,
    1
  );
  const appear = THREE.MathUtils.clamp(
    THREE.MathUtils.mapLinear(
      camera.position.distanceTo(star.position),
      STAR.appearFar,
      STAR.appearNear,
      0,
      1
    ),
    0,
    1
  );
  star.userData.appear += (appear - star.userData.appear) * 0.14;

  const visible = star.userData.appear > 0.02;
  star.visible = visible;

  const targetScale = THREE.MathUtils.lerp(1, STAR.hoverScale, 1 - zoomProgress)
    * (state.hoveredStar === star ? 1.35 : 1)
    * star.userData.appear
    + pulse * 0.08 * star.userData.appear;

  star.scale.setScalar(Math.max(star.scale.x + (targetScale - star.scale.x) * 0.18, 0.001));
  star.rotation.x += 0.018;
  star.rotation.y += 0.024;
  star.userData.core.material.opacity = THREE.MathUtils.clamp(
    (0.55 + pulse * 0.45) * star.userData.appear,
    0,
    1
  );
}
