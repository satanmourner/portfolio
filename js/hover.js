import { state, isDialogOpen } from './state.js';
import { pickStar } from './stars.js';

const tooltip = document.querySelector('#starTooltip');
const tooltipLabel = document.querySelector('#starTooltipLabel');

export function updateHover(camera) {
  state.hoveredStar = isDialogOpen() ? null : pickStar(camera);
  document.body.classList.toggle('is-star-hover', state.hoveredStar !== null);

  if (state.hoveredStar) {
    tooltipLabel.textContent = state.hoveredStar.userData.star.label;
    tooltip.style.transform = `translate(${state.pointerScreen.x}px, ${state.pointerScreen.y}px)`;
    tooltip.classList.add('is-visible');
  } else {
    tooltip.classList.remove('is-visible');
  }
}
