import * as THREE from '../three.module.js';
import { CUBE, ROTATION } from './config.js';
import { state } from './state.js';

let matrixCube = null;

export function createMatrixCube() {
  const group = new THREE.Group();
  const lineMaterial = new THREE.LineBasicMaterial({
    color: CUBE.color,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
  });

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: CUBE.edgeColor,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
  });

  addMatrixLines(group, lineMaterial);
  group.add(createCubeEdges(edgeMaterial));
  group.add(createMatrixParticles());

  matrixCube = group;
  return group;
}

export function updateMatrixCube() {
  const { controls } = state;
  if (!controls.dragging) {
    controls.targetRotationX += ROTATION.idleX;
    controls.targetRotationY += ROTATION.idleY;
  }

  matrixCube.rotation.x += (controls.targetRotationX - matrixCube.rotation.x) * ROTATION.ease;
  matrixCube.rotation.y += (controls.targetRotationY - matrixCube.rotation.y) * ROTATION.ease;
}

function addMatrixLines(group, material) {
  for (let a = -CUBE.size / 2; a <= CUBE.size / 2; a += CUBE.step) {
    for (let b = -CUBE.size / 2; b <= CUBE.size / 2; b += CUBE.step) {
      group.add(createLine([-CUBE.size / 2, a, b], [CUBE.size / 2, a, b], material));
      group.add(createLine([a, -CUBE.size / 2, b], [a, CUBE.size / 2, b], material));
      group.add(createLine([a, b, -CUBE.size / 2], [a, b, CUBE.size / 2], material));
    }
  }
}

function createLine(start, end, material) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ]);

  return new THREE.Line(geometry, material);
}

function createCubeEdges(material) {
  const geometry = new THREE.BoxGeometry(CUBE.size, CUBE.size, CUBE.size);
  return new THREE.LineSegments(new THREE.EdgesGeometry(geometry), material);
}

function createMatrixParticles() {
  const positions = [];
  const half = CUBE.size / 2;

  for (let i = 0; i < 260; i += 1) {
    positions.push(
      THREE.MathUtils.randFloatSpread(CUBE.size),
      THREE.MathUtils.randFloatSpread(CUBE.size),
      THREE.MathUtils.randFloatSpread(CUBE.size)
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeBoundingBox();

  const material = new THREE.PointsMaterial({
    color: CUBE.color,
    transparent: true,
    opacity: 0.58,
    size: half * 0.015,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geometry, material);
}
