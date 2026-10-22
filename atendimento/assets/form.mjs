import { flows, validate, buildWhatsAppUrl } from './flow-core.mjs';

const flowName = document.body.dataset.flow;
const flow = flows[flowName] || flows.orcamento;
const fields = flow.fields;
const values = Object.fromEntries(fields.map(field => [field.id, '']));
let step = 0;
let lastActionWasAdvance = false;
let cleanupPicker = () => {};
const form = document.querySelector('#intake-form');
const stepContainer = document.querySelector('#step-container');
const back = document.querySelector('#back');
const next = document.querySelector('#next');
const nextLabel = document.querySelector('#next-label');
const progress = document.querySelector('#progress');
const progressFill = document.querySelector('#progress-fill');
const count = document.querySelector('#step-count');
const success = document.querySelector('#success');

function setText(selector, text) {
  const element = document.querySelector(selector);
  if (element) element.textContent = text;
}

setText('#flow-title', flow.title);
setText('#flow-subtitle', flow.subtitle);
setText('#form-kicker', flow.kicker);
progress.setAttribute('aria-valuemax', fields.length);

function updateAnswerState(field) {
  const hasAnswer = Boolean(values[field.id].trim());
  setText('#answer-state', hasAnswer ? 'Resposta preenchida' : field.type === 'select' ? 'Toque para escolher' : 'Preencha para continuar');
  const state = document.querySelector('#answer-state');
  if (state) state.dataset.filled = String(hasAnswer);
}

function updateProgress() {
  count.replaceChildren();
  const current = document.createElement('b');
  current.textContent = String(step + 1).padStart(2, '0');
  count.append(current, ` / ${String(fields.length).padStart(2, '0')}`);
  progress.setAttribute('aria-valuenow', step + 1);
  progress.setAttribute('aria-valuetext', `Etapa ${step + 1} de ${fields.length}`);
  progressFill.style.width = `${(step + 1) / fields.length * 100}%`;
  setText('#step-watermark', String(step + 1).padStart(2, '0'));
  setText('#chapter-label', step < 2 ? 'SEU CONTATO' : flowName === 'mentoria' ? 'SUA MENTORIA' : 'SEU PROJETO');
  const dots = document.querySelector('#progress-dots');
  if (dots) {
    dots.replaceChildren();
    fields.forEach((field, index) => {
      const dot = document.createElement('span');
      dot.className = `progress-dot${index === step ? ' is-active' : index < step ? ' is-done' : ''}`;
      dot.setAttribute('aria-hidden', 'true');
      dots.append(dot);
    });
  }
}

function makePicker(field, clearError) {
  const picker = document.createElement('div');
  picker.className = 'choice-picker';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.id = 'answer';
  trigger.name = field.id;
  trigger.className = 'field-control choice-trigger';
  trigger.value = values[field.id];
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-controls', 'answer-options');
  trigger.setAttribute('aria-required', 'true');
  trigger.setAttribute('aria-labelledby', 'field-label choice-value');
  const valueLabel = document.createElement('span');
  valueLabel.className = 'choice-value';
  valueLabel.id = 'choice-value';
  const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  chevron.classList.add('choice-chevron');
  chevron.setAttribute('viewBox', '0 0 24 24');
  chevron.setAttribute('fill', 'none');
  chevron.setAttribute('stroke', 'currentColor');
  chevron.setAttribute('stroke-width', '1.5');
  chevron.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'm6 9 6 6 6-6');
  chevron.append(path);
  trigger.append(valueLabel, chevron);
  const list = document.createElement('div');
  list.id = 'answer-options';
  list.className = 'choice-list';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-labelledby', 'field-label');
  list.hidden = true;
  let highlighted = -1;
  let expanded = false;
  const options = field.options.map((value, index) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.id = `answer-option-${index}`;
    option.className = 'choice-option';
    option.setAttribute('role', 'option');
    option.tabIndex = -1;
    const number = document.createElement('span');
    number.className = 'choice-number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = String(index + 1).padStart(2, '0');
    const label = document.createElement('span');
    label.className = 'choice-label';
    label.textContent = value;
    const check = document.createElement('span');
    check.className = 'choice-check';
    check.setAttribute('aria-hidden', 'true');
    check.textContent = '✓';
    option.append(number, label, check);
    option.addEventListener('pointerdown', event => {
      // Keep keyboard focus on the combobox while activating a list option.
      if (event.button === 0) event.preventDefault();
    });
    option.addEventListener('click', () => select(index));
    option.addEventListener('pointermove', () => highlight(index, false));
    list.append(option);
    return option;
  });

  function updateSelection() {
    const selected = Boolean(trigger.value);
    valueLabel.textContent = trigger.value || 'Escolha uma opção';
    trigger.classList.toggle('has-value', selected);
    options.forEach((option, index) => {
      const isSelected = field.options[index] === trigger.value;
      option.classList.toggle('is-selected', isSelected);
      option.setAttribute('aria-selected', String(isSelected));
    });
  }

  function highlight(index, scroll = true) {
    highlighted = Math.max(0, Math.min(index, options.length - 1));
    options.forEach((option, position) => option.classList.toggle('is-highlighted', position === highlighted));
    trigger.setAttribute('aria-activedescendant', options[highlighted].id);
    if (scroll) {
      const option = options[highlighted];
      const top = option.offsetTop;
      const bottom = top + option.offsetHeight;
      if (top < list.scrollTop) list.scrollTop = top;
      else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
    }
  }

  function close(restoreFocus = false) {
    expanded = false;
    list.hidden = true;
    picker.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    if (restoreFocus) trigger.focus({ preventScroll: true });
  }

  function open(preferredIndex) {
    expanded = true;
    list.hidden = false;
    picker.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    const bounds = trigger.getBoundingClientRect();
    const viewportTop = window.visualViewport?.offsetTop ?? 0;
    const viewportBottom = viewportTop + (window.visualViewport?.height ?? window.innerHeight);
    const above = bounds.top - viewportTop - 16;
    const below = viewportBottom - bounds.bottom - 16;
    picker.dataset.placement = below < list.offsetHeight + 9 && above > below ? 'up' : 'down';
    const selected = field.options.indexOf(trigger.value);
    highlight(preferredIndex ?? (selected < 0 ? 0 : selected));
  }

  function select(index) {
    lastActionWasAdvance = false;
    trigger.value = field.options[index];
    values[field.id] = trigger.value;
    updateSelection();
    clearError(trigger);
    updateAnswerState(field);
    close(true);
  }

  trigger.addEventListener('click', () => expanded ? close() : open());
  trigger.addEventListener('keydown', event => {
    const key = event.key;
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!expanded) open(key === 'ArrowUp' ? options.length - 1 : undefined);
      else highlight(highlighted + (key === 'ArrowDown' ? 1 : -1));
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault();
      const index = key === 'Home' ? 0 : options.length - 1;
      if (!expanded) open(index); else highlight(index);
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (event.repeat) return;
      if (expanded) select(highlighted); else open();
    } else if (key === 'Escape' && expanded) {
      event.preventDefault();
      close();
    } else if (key === 'Tab') {
      close();
    }
  });
  picker.addEventListener('focusout', event => {
    if (!picker.contains(event.relatedTarget)) close();
  });
  const outsideClick = event => {
    if (!picker.contains(event.target)) close();
  };
  document.addEventListener('pointerdown', outsideClick);
  cleanupPicker = () => {
    document.removeEventListener('pointerdown', outsideClick);
    close();
  };
  picker.append(trigger, list);
  updateSelection();
  return { element: picker, input: trigger };
}

function render(focus = true, direction = 'forward') {
  cleanupPicker();
  cleanupPicker = () => {};
  form.hidden = false;
  success.hidden = true;
  document.body.dataset.complete = 'false';
  const field = fields[step];
  updateProgress();
  setText('#step-announcement', `Etapa ${step + 1} de ${fields.length}: ${field.label}`);
  stepContainer.dataset.direction = direction;
  stepContainer.replaceChildren();
  const wrapper = document.createElement('div');
  wrapper.className = 'field-step';
  const label = document.createElement('label');
  label.htmlFor = 'answer';
  label.id = 'field-label';
  label.tabIndex = -1;
  label.textContent = field.label;
  const required = document.createElement('span');
  required.className = 'required-star';
  required.textContent = '*';
  required.setAttribute('aria-hidden', 'true');
  label.append(required);
  const description = document.createElement('p');
  description.className = 'field-description';
  description.id = 'field-description';
  description.textContent = field.description;
  const error = document.createElement('p');
  error.className = 'field-error';
  error.id = 'field-error';
  error.setAttribute('aria-live', 'polite');
  function clearError(input) {
    error.textContent = '';
    input.removeAttribute('aria-invalid');
  }
  let input;
  let control;
  if (field.type === 'select') {
    const picker = makePicker(field, clearError);
    input = picker.input;
    control = picker.element;
  } else {
    input = document.createElement(field.type === 'textarea' ? 'textarea' : 'input');
    input.id = 'answer';
    input.name = field.id;
    input.className = 'field-control';
    input.required = true;
    if (field.type !== 'textarea') input.type = field.type;
    if (field.type === 'tel') input.inputMode = 'tel';
    input.placeholder = field.placeholder;
    input.maxLength = field.maxLength;
    input.autocomplete = field.autocomplete || 'off';
    if (field.id === 'nome') input.autocapitalize = 'words';
    input.value = values[field.id];
    input.classList.toggle('has-value', Boolean(input.value));
    input.addEventListener('input', () => {
      lastActionWasAdvance = false;
      values[field.id] = input.value;
      input.classList.toggle('has-value', Boolean(input.value));
      clearError(input);
      updateAnswerState(field);
    });
    input.addEventListener('change', () => {
      lastActionWasAdvance = false;
      values[field.id] = input.value;
      updateAnswerState(field);
    });
    control = input;
  }
  const help = document.createElement('p');
  help.className = 'field-help';
  help.id = 'field-help';
  help.textContent = field.help || '';
  help.hidden = !field.help;
  input.setAttribute('aria-describedby', `field-description ${field.help ? 'field-help ' : ''}field-error`);
  wrapper.append(label, description, control, help, error);
  stepContainer.append(wrapper);
  back.disabled = step === 0;
  nextLabel.textContent = step === fields.length - 1 ? 'Concluir' : 'Continuar';
  updateAnswerState(field);
  // Focus the question, never an interactive field. Opening a keyboard or the
  // options list is always a separate, intentional action from the visitor.
  if (focus) label.focus({ preventScroll: true });
}

function complete() {
  cleanupPicker();
  const summary = document.querySelector('#response-summary');
  summary.replaceChildren();
  for (const field of fields) {
    const row = document.createElement('div');
    row.className = 'summary-row';
    const term = document.createElement('dt');
    term.textContent = field.summary;
    const value = document.createElement('dd');
    value.textContent = values[field.id].trim();
    row.append(term, value);
    summary.append(row);
  }
  document.querySelector('#whatsapp-link').href = buildWhatsAppUrl(flow, values);
  form.hidden = true;
  success.hidden = false;
  document.body.dataset.complete = 'true';
  setText('#chapter-label', 'PRONTO PARA CONVERSAR');
  document.querySelector('#success-title').focus({ preventScroll: true });
  setText('#step-announcement', 'Formulário concluído. Sua mensagem está pronta para enviar pelo WhatsApp.');
}

// A double click must never skip a question whose previous response is retained.
next.addEventListener('click', event => {
  if (event.detail > 1 && lastActionWasAdvance && values[fields[step].id].trim()) event.preventDefault();
});
form.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.repeat) event.preventDefault();
});
form.addEventListener('submit', event => {
  event.preventDefault();
  if (form.hidden) return;
  const input = document.querySelector('#answer');
  const field = fields[step];
  values[field.id] = input.value.trim();
  const error = validate(field, values[field.id]);
  if (error) {
    lastActionWasAdvance = false;
    document.querySelector('#field-error').textContent = error;
    input.setAttribute('aria-invalid', 'true');
    input.focus({ preventScroll: true });
    return;
  }
  if (step < fields.length - 1) {
    step++;
    render(true, 'forward');
    lastActionWasAdvance = true;
  } else complete();
});
back.addEventListener('click', event => {
  if (step > 0 && event.detail < 2) {
    lastActionWasAdvance = false;
    step--;
    render(true, 'back');
  }
});
document.querySelector('#review').addEventListener('click', () => {
  lastActionWasAdvance = false;
  step = 0;
  render(true, 'back');
});
render(false);
