import * as THREE from '../three.module.js';

let starTexture = null;

export function getStarTexture() {
  if (!starTexture) {
    starTexture = createStarTexture();
  }
  return starTexture;
}

function createStarTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const halo = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  halo.addColorStop(0, 'rgba(255, 255, 255, 1)');
  halo.addColorStop(0.1, 'rgba(255, 246, 200, 0.85)');
  halo.addColorStop(0.28, 'rgba(173, 255, 214, 0.28)');
  halo.addColorStop(1, 'rgba(173, 255, 214, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  ctx.globalCompositeOperation = 'lighter';
  const spike = (rotation, length, width, alpha) => {
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(rotation);
    const gradient = ctx.createLinearGradient(-length, 0, length, 0);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.5, `rgba(255, 250, 224, ${alpha})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(-length, -width / 2, length * 2, width);
    ctx.restore();
  };

  spike(0, size * 0.48, size * 0.03, 0.9);
  spike(Math.PI / 2, size * 0.48, size * 0.03, 0.9);
  spike(Math.PI / 4, size * 0.38, size * 0.016, 0.35);
  spike(-Math.PI / 4, size * 0.38, size * 0.016, 0.35);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
