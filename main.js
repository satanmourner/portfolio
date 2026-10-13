import { createEnvironment } from './js/scene.js';
import { createMatrixCube, updateMatrixCube } from './js/cube.js';
import { createStarField, updateStars } from './js/stars.js';
import { initControls, updateCamera } from './js/controls.js';
import { initStarDialog, openStarDialog } from './js/star-dialog.js';
import { initTerminal } from './js/terminal.js';
import { updateHover } from './js/hover.js';
import { state } from './js/state.js';
import { STARS } from './js/content.js';

const { scene, camera, renderer, clock } = createEnvironment();
const matrixCube = createMatrixCube();
scene.add(matrixCube);
createStarField(scene, STARS);
initControls({ camera, renderer, onStarTap: openStarDialog });
initStarDialog();
initTerminal();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();
  updateCamera(camera);
  updateMatrixCube();
  updateStars(camera, elapsed);
  updateHover(camera);
  renderer.render(scene, camera);
}

animate();

if (window.location.search.includes('cube-debug')) {
  window.__cubeDebug = { pan: state.pan, controls: state.controls, camera, matrixCube };
}
