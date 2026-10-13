import * as THREE from '../three.module.js';
import { CAMERA, STAR, STAR_LAYOUT } from './config.js';
import { getStarTexture } from './star-texture.js';
import { state, isDialogOpen } from './state.js';

const raycaster = new THREE.Raycaster();
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
    group.userData.glow = group.children[1];
    group.userData.appear = 0;
    group.userData.twinkle = Math.random() * Math.PI * 2;
    scene.add(group);
    return group;
  });

  return starGroups;
}

export function pickStar(camera) {
  if (isDialogOpen()) return null;

  raycaster.setFromCamera(state.pointer, camera);
  const hits = raycaster.intersectObjects(
    starGroups.map((group) => group.userData.glow),
    false
  );

  if (hits.length === 0) return null;
  return starGroups.find((group) => group.userData.glow === hits[0].object
    && group.userData.appear > 0.5) ?? null;
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

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(3.8, 16, 16),
    new THREE.MeshBasicMaterial({ visible: false })
  );

  group.add(core);
  group.add(glow);
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
  star.userData.glow.material.opacity = THREE.MathUtils.clamp(
    (0.18 + (1 - zoomProgress) * 0.5 + pulse * 0.12 + (state.hoveredStar === star ? 0.35 : 0))
      * star.userData.appear
      + 0.12 * star.userData.appear * (1 - star.userData.appear),
    0,
    0.95
  );
}
