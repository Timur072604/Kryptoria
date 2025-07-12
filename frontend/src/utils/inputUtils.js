export const allowOnlyNumericInputOnKeyDown = (event) => {
  const { key, ctrlKey, metaKey } = event;

  if (key >= '0' && key <= '9') {
    return;
  }

  const allowedControlKeys = [
    'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End'
  ];
  if (allowedControlKeys.includes(key)) {
    return;
  }

  if ((ctrlKey || metaKey) && ['a', 'c', 'v', 'x', 'r', 'z', 'y'].includes(key.toLowerCase())) {
    return;
  }
  
  if (key.startsWith('F') && !isNaN(parseInt(key.substring(1), 10))) {
      return;
  }

  event.preventDefault();
};

export const sanitizeNumericInput = (value) => {
  if (typeof value !== 'string') return '';
  return value.replace(/[^0-9]/g, '');
};