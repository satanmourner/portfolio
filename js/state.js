import * as THREE from '../three.module.js';
import { CAMERA, PAN } from './config.js';

export const state = {
  pointer: new THREE.Vector2(),
  pointerScreen: { x: 0, y: 0 },
  hoveredStar: null,
  controls: {
    dragging: false,
    panning: false,
    moved: false,
    lastX: 0,
    lastY: 0,
    targetRotationX: -0.45,
    targetRotationY: 0.65,
    targetDistance: CAMERA.startDistance,
  },
  pan: { x: 0, y: 0, limit: PAN.limit },
  pinchState: { span: 0, startDistance: 0, midX: 0, midY: 0 },
  activePointers: new Map(),
};

let starDialogOpen = false;
let terminalDialogOpen = false;

export function isDialogOpen() {
  return starDialogOpen || terminalDialogOpen;
}

export function setStarDialogOpen(value) {
  starDialogOpen = value;
}

export function setTerminalDialogOpen(value) {
  terminalDialogOpen = value;
}
