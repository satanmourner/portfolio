import { TERMINAL_PROMPT, TERMINAL_HELP, TERMINAL_FILES, TERMINAL_OPEN_TARGETS } from './content.js';
import { setTerminalDialogOpen } from './state.js';

const terminalTrigger = document.querySelector('#terminalTrigger');
const terminalDialog = document.querySelector('#terminalDialog');
const terminalOutput = document.querySelector('#terminalOutput');
const terminalForm = document.querySelector('#terminalForm');
const terminalInput = document.querySelector('#terminalInput');
const terminalClose = document.querySelector('#terminalClose');

const TERMINAL_BANNER = [
  'Portfolio Shell — Sanaz Mahmoudi, Senior Front-End developer',
  'type help to list commands, ls to see files.',
];

let terminalHistory = [];
let terminalHistoryIndex = 0;

export function initTerminal() {
  terminalTrigger.addEventListener('click', openTerminal);
  terminalClose.addEventListener('click', closeTerminal);

  terminalForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = terminalInput.value;
    terminalInput.value = '';
    runCommand(value);
    if (value.trim()) {
      terminalHistory.push(value.trim());
      terminalHistoryIndex = terminalHistory.length;
    }
    terminalInput.focus();
  });

  terminalInput.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      completeInput();
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!terminalHistory.length) return;
      terminalHistoryIndex = Math.max(0, terminalHistoryIndex - 1);
      terminalInput.value = terminalHistory[terminalHistoryIndex];
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!terminalHistory.length) return;
      terminalHistoryIndex = Math.min(terminalHistory.length, terminalHistoryIndex + 1);
      terminalInput.value = terminalHistory[terminalHistoryIndex] ?? '';
    }
  });

  terminalDialog.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const rect = terminalDialog.getBoundingClientRect();
    const insideDialog = event.clientX >= rect.left
      && event.clientX <= rect.right
      && event.clientY >= rect.top
      && event.clientY <= rect.bottom;
    if (!insideDialog) {
      closeTerminal();
      return;
    }
    if (event.target === terminalOutput) terminalInput.focus();
  });

  terminalDialog.addEventListener('close', () => {
    setTerminalDialogOpen(false);
    document.documentElement.style.setProperty('--keyboard-inset', '0px');
  });

  if (window.visualViewport) {
    const syncKeyboardInset = () => {
      const offset = Math.max(
        0,
        window.innerHeight - window.visualViewport.height
      );
      document.documentElement.style.setProperty(
        '--keyboard-inset',
        `${Math.round(offset)}px`
      );
    };

    window.visualViewport.addEventListener('resize', syncKeyboardInset);
    window.visualViewport.addEventListener('scroll', syncKeyboardInset);
    terminalInput.addEventListener('focus', () => {
      setTimeout(syncKeyboardInset, 120);
    });
    terminalInput.addEventListener('blur', () => {
      setTimeout(syncKeyboardInset, 120);
    });
  }
}

function printLines(lines, cls) {
  const fragment = document.createDocumentFragment();
  for (const line of lines) {
    const row = document.createElement('div');
    row.className = 'terminal-line' + (cls ? ` ${cls}` : '');
    row.textContent = line;
    fragment.appendChild(row);
  }
  terminalOutput.appendChild(fragment);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function echoInput(raw) {
  const row = document.createElement('div');
  row.className = 'terminal-line';
  const prompt = document.createElement('span');
  prompt.className = 'terminal-echo-prompt';
  prompt.textContent = `${TERMINAL_PROMPT} `;
  const text = document.createElement('span');
  text.textContent = raw;
  row.append(prompt, text);
  terminalOutput.appendChild(row);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function runCommand(raw) {
  const input = raw.trim();
  echoInput(raw);
  if (!input) return;

  const words = input.toLowerCase().split(/\s+/);
  const cmd = words[0];
  const arg = words.slice(1).join(' ');

  switch (cmd) {
    case 'help':
      printLines(TERMINAL_HELP, 'is-dim');
      break;
    case 'ls':
      printLines([Object.keys(TERMINAL_FILES).join('   ')]);
      printLines(['', 'tip: cat <file> to read — cat links.txt or cat skills.txt'], 'is-dim');
      break;
    case 'pwd':
      printLines(['/portfolio/starfield']);
      break;
    case 'whoami':
      printLines(['Sanaz Mahmoudi — Senior Front-End Developer']);
      break;
    case 'clear':
      terminalOutput.textContent = '';
      break;
    case 'cat':
      catFile(arg);
      break;
    case 'open':
      openTarget(arg);
      break;
    case 'sudo':
      printLines(['nice try — guests have no sudo in the matrix'], 'is-warn');
      break;
    case 'exit':
    case 'quit':
    case 'close':
      closeTerminal();
      break;
    default:
      printLines([`command not found: ${cmd}`, 'type help to list commands'], 'is-error');
  }
}

function catFile(rawName) {
  const name = rawName.trim().replace(/^\.\//, '');
  if (!name) {
    printLines(['usage: cat <file>', 'run ls to see files'], 'is-warn');
    return;
  }
  const fileName = Object.keys(TERMINAL_FILES).includes(name) ? name : `${name}.txt`;
  if (TERMINAL_FILES[fileName]) {
    printLines(TERMINAL_FILES[fileName]);
    if (fileName === 'resume.pdf') {
      printLines(['tip: open resume to download it'], 'is-accent');
    }
    return;
  }
  printLines([`cat: ${name}: no such file`, 'run ls to see available files'], 'is-error');
}

function openTarget(rawName) {
  const key = rawName.trim().toLowerCase();
  if (!key) {
    printLines(['usage: open github | open linkedin | open email | open resume'], 'is-warn');
    return;
  }
  const target = TERMINAL_OPEN_TARGETS[key];
  if (!target) {
    printLines([`open: unknown target: ${key}`, 'try: github | linkedin | email | resume'], 'is-error');
    return;
  }

  if (target.download) {
    const anchor = document.createElement('a');
    anchor.href = target.href;
    anchor.setAttribute('download', 'SanazMahmoudi-CV-FrontendDeveloper.pdf');
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    printLines(['resume.pdf — download started'], 'is-accent');
    return;
  }

  if (target.href.startsWith('mailto:')) {
    window.location.href = target.href;
    printLines(['opening your mail client…'], 'is-accent');
    return;
  }

  window.open(target.href, '_blank', 'noopener');
  printLines([`opening ${key} in a new tab…`], 'is-accent');
}

function openTerminal() {
  if (terminalDialog.open) return;
  setTerminalDialogOpen(true);
  terminalDialog.showModal();
  if (!terminalOutput.childElementCount) {
    printLines(TERMINAL_BANNER, 'is-dim');
  }
  terminalInput.focus();
}

const TERMINAL_COMMANDS = ['cat', 'clear', 'close', 'exit', 'help', 'ls', 'open', 'pwd', 'quit', 'sudo', 'whoami'];

function getCompletionSource(parts) {
  if (parts.length <= 1) return TERMINAL_COMMANDS;
  const command = parts[0].toLowerCase();
  if (command === 'cat') return Object.keys(TERMINAL_FILES);
  if (command === 'open') return Object.keys(TERMINAL_OPEN_TARGETS);
  return [];
}

function completeInput() {
  const value = terminalInput.value;
  const parts = value.split(/\s+/);
  const token = (parts[parts.length - 1] ?? '').toLowerCase();
  const candidates = getCompletionSource(parts)
    .filter((name) => name.toLowerCase().startsWith(token));

  if (!candidates.length) return;

  if (candidates.length === 1) {
    parts[parts.length - 1] = candidates[0];
    terminalInput.value = parts.join(' ') + ' ';
    return;
  }

  const common = candidates.reduce((prefix, candidate) => {
    let shared = prefix;
    while (shared && !candidate.toLowerCase().startsWith(shared.toLowerCase())) {
      shared = shared.slice(0, -1);
    }
    return shared;
  });

  if (common && common.toLowerCase().length > token.length) {
    parts[parts.length - 1] = common;
    terminalInput.value = parts.join(' ');
    return;
  }

  printLines(['', candidates.join('   ')], 'is-dim');
}

function closeTerminal() {
  if (terminalDialog.open) terminalDialog.close();
}
