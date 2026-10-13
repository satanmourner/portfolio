import { setStarDialogOpen } from './state.js';

const dialog = document.querySelector('#starDialog');
const dialogKicker = document.querySelector('#dialogKicker');
const dialogTitle = document.querySelector('#dialogTitle');
const dialogDescription = document.querySelector('#dialogDescription');
const dialogAction = document.querySelector('#dialogAction');
const dialogClose = document.querySelector('#dialogClose');

export function initStarDialog() {
  dialogClose.addEventListener('click', closeDialog);

  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    const insideDialog = event.clientX >= rect.left
      && event.clientX <= rect.right
      && event.clientY >= rect.top
      && event.clientY <= rect.bottom;
    if (!insideDialog) closeDialog();
  });

  dialog.addEventListener('close', () => {
    setStarDialogOpen(false);
  });
}

export function openStarDialog(star) {
  const data = star.userData.star;
  setStarDialogOpen(true);
  dialogKicker.textContent = data.kicker;
  dialogTitle.textContent = data.title;
  dialogDescription.textContent = data.description;
  dialogAction.textContent = data.action.text;
  dialogAction.href = data.action.href;

  if (data.action.download) {
    dialogAction.setAttribute('download', data.action.download);
    dialogAction.removeAttribute('target');
  } else if (data.action.href.startsWith('mailto:')) {
    dialogAction.removeAttribute('download');
    dialogAction.removeAttribute('target');
  } else {
    dialogAction.removeAttribute('download');
    dialogAction.setAttribute('target', '_blank');
  }

  dialog.showModal();
}

function closeDialog() {
  dialog.close();
}
