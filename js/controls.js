import * as THREE from '../three.module.js';
import { CAMERA, ROTATION } from './config.js';
import { state, isDialogOpen } from './state.js';
import { pickStar } from './stars.js';

export function initControls({ camera, renderer, onStarTap }) {
  const { controls, pan, pinchState, activePointers, pointer, pointerScreen } = state;

  function setPointerFromEvent(event) {
    pointerScreen.x = event.clientX;
    pointerScreen.y = event.clientY;
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  function worldPerPixel() {
    const visibleHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(CAMERA.fov / 2));
    return visibleHeight / window.innerHeight;
  }

  function startPinch() {
    const [a, b] = [...activePointers.values()];
    pinchState.span = Math.hypot(a.x - b.x, a.y - b.y);
    pinchState.startDistance = controls.targetDistance;
    pinchState.midX = (a.x + b.x) / 2;
    pinchState.midY = (a.y + b.y) / 2;
  }

  function panByDelta(screenX, screenY) {
    const dx = screenX - controls.lastX;
    const dy = screenY - controls.lastY;
    controls.lastX = screenX;
    controls.lastY = screenY;
    panByWorld(dx * worldPerPixel(), dy * worldPerPixel());
  }

  function panByWorld(worldX, worldY) {
    pan.x = THREE.MathUtils.clamp(pan.x - worldX, -pan.limit, pan.limit);
    pan.y = THREE.MathUtils.clamp(pan.y + worldY, -pan.limit, pan.limit);
  }

  function handleTwoFingerMove() {
    const [a, b] = [...activePointers.values()];
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const span = Math.hypot(a.x - b.x, a.y - b.y);

    if (pinchState.span > 0 && span > 0) {
      controls.targetDistance = THREE.MathUtils.clamp(
        pinchState.startDistance * (pinchState.span / span),
        CAMERA.minDistance,
        CAMERA.maxDistance
      );
      panByWorld(
        (midX - pinchState.midX) * worldPerPixel(),
        (midY - pinchState.midY) * worldPerPixel()
      );
    }

    pinchState.midX = midX;
    pinchState.midY = midY;
  }

  function zoomCamera(event) {
    if (isDialogOpen()) return;
    controls.targetDistance = THREE.MathUtils.clamp(
      controls.targetDistance + event.deltaY * CAMERA.zoomSpeed,
      CAMERA.minDistance,
      CAMERA.maxDistance
    );
  }

  window.addEventListener('pointerdown', (event) => {
    if (isDialogOpen()) return;
    if (event.target instanceof Element
      && (event.target.closest('.terminal-trigger') || event.target.closest('.terminal-dialog'))) return;

    if (event.pointerType === 'mouse' && (event.button === 2 || event.shiftKey)) {
      controls.panning = true;
      controls.lastX = event.clientX;
      controls.lastY = event.clientY;
      return;
    }

    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.size === 2) {
      controls.dragging = false;
      controls.moved = true;
      startPinch();
      return;
    }

    controls.dragging = true;
    controls.moved = false;
    controls.lastX = event.clientX;
    controls.lastY = event.clientY;
    setPointerFromEvent(event);
  });

  window.addEventListener('pointermove', (event) => {
    if (controls.panning) {
      panByDelta(event.clientX, event.clientY);
      return;
    }

    const tracked = activePointers.get(event.pointerId);
    if (!tracked) return;
    tracked.x = event.clientX;
    tracked.y = event.clientY;

    if (activePointers.size >= 2) {
      handleTwoFingerMove();
      return;
    }

    if (!controls.dragging) return;
    const dx = event.clientX - controls.lastX;
    const dy = event.clientY - controls.lastY;
    controls.lastX = event.clientX;
    controls.lastY = event.clientY;
    controls.moved = controls.moved || Math.abs(dx) + Math.abs(dy) > 3;
    controls.targetRotationY += dx * ROTATION.speed;
    controls.targetRotationX += dy * ROTATION.speed;
  });

  window.addEventListener('pointerup', (event) => {
    const wasPinching = activePointers.size >= 2;
    const wasDragging = controls.dragging;
    controls.panning = false;
    activePointers.delete(event.pointerId);

    if (isDialogOpen()) return;
    if (wasPinching) {
      pinchState.span = 0;
      controls.dragging = false;
      return;
    }
    if (!wasDragging) return;

    controls.dragging = false;
    setPointerFromEvent(event);
    if (event.target !== renderer.domElement) return;
    const star = pickStar(camera);
    if (!controls.moved && star) onStarTap(star);
  });

  window.addEventListener('pointercancel', (event) => {
    activePointers.delete(event.pointerId);
    pinchState.span = 0;
    controls.panning = false;
    controls.dragging = false;
  });

  window.addEventListener('pointermove', (event) => {
    if (activePointers.size > 0 || controls.panning) return;
    if (event.target !== renderer.domElement) {
      pointer.x = -2;
      pointer.y = -2;
      return;
    }
    setPointerFromEvent(event);
  });

  window.addEventListener('wheel', zoomCamera, { passive: true });
  window.addEventListener('contextmenu', (event) => event.preventDefault());
}

export function updateCamera(camera) {
  const { controls, pan } = state;
  camera.position.x += (pan.x - camera.position.x) * CAMERA.zoomEase;
  camera.position.y += (pan.y - camera.position.y) * CAMERA.zoomEase;
  camera.position.z += (controls.targetDistance - camera.position.z) * CAMERA.zoomEase;
  camera.lookAt(pan.x, pan.y, 0);
}
