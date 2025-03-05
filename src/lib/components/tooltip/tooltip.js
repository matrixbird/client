import { 
  computePosition, 
  autoPlacement,
  autoUpdate, 
  offset, 
  shift, 
} from '@floating-ui/dom';

export function tooltip(node, opts = {
  disabled: false,
  text: '',
  placement: 'top',
  theme: 'light',
  classes: null,
  ofset: 8,
  delay: 0,
}) {

  let tooltip = null;
  let cleanup = null;
  let showTimeout = null;
  let hideTimeout = null;

  let className = `tooltip`;
  if(opts?.theme === 'dark') {
    className += ' tooltip-dark';
  }

  if(opts?.classes) {
    className += ` ${opts.classes}`
  }

  function createTooltip() {

    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = className;
      tooltip.textContent = opts.text;
      tooltip.setAttribute('role', 'tooltip');
      document.body.appendChild(tooltip);
    }
    return tooltip;
  }

  function removeTooltip() {
    if (tooltip) {
      document.body.removeChild(tooltip);
      tooltip = null;
    }
  }

  function showTooltip() {
    // Clear any pending hide timeout
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    // Apply delay if specified
    if (opts.delay && !showTimeout) {
      showTimeout = setTimeout(() => {
        actuallyShowTooltip();
        showTimeout = null;
      }, opts.delay);
    } else {
      actuallyShowTooltip();
    }
  }

  function actuallyShowTooltip() {

    const tooltipEl = createTooltip();

    tooltipEl.style.visibility = 'visible';
    if(opts?.disabled) {
      tooltipEl.style.opacity = '0.2';
    } else {
      tooltipEl.style.opacity = '1';
    }

    let _offset = {
      mainAxis: 10,
      crossAxis: 0
    }

    if(!Array.isArray(opts.offset) && opts.offset !== NaN) {
      if(opts.offset > 0) {
        _offset.mainAxis = opts.offset;
      }
    }

    if(Array.isArray(opts.offset) && opts.offset?.length == 2) {
      _offset.mainAxis = opts.offset[0];
      _offset.crossAxis = opts.offset[1];
    }

    cleanup = autoUpdate(
      node,
      tooltipEl,
      () => {
        computePosition(node, tooltipEl, {
          placement: opts.placement,
          middleware: [
            offset(_offset), 
            shift({ mainAxis: true, crossAxis: true}) 
          ]
        }).then(({ x, y }) => {
            Object.assign(tooltipEl.style, {
              left: `${x}px`,
              top: `${y}px`
            });
          });
      }
    );
  }

  function hideTooltip() {

    if (showTimeout) {
      clearTimeout(showTimeout);
      showTimeout = null;
    }

    if (tooltip) {
      tooltip.style.opacity = '0';

      hideTimeout = setTimeout(() => {
        if (cleanup) {
          cleanup();
          cleanup = null;
        }

        if (tooltip) {
          tooltip.style.visibility = 'hidden';

          setTimeout(removeTooltip, 100);
        }

        hideTimeout = null;
      }, 150);
    }
  }

  node.addEventListener('mouseenter', showTooltip);
  node.addEventListener('mouseleave', hideTooltip);
  node.addEventListener('focus', showTooltip);
  node.addEventListener('blur', hideTooltip);

  document.addEventListener('click', removeTooltip);

  return {
    update(newopts) {
      opts = newopts;

      if (tooltip) {
        tooltip.textContent = newopts.text;
        tooltip.className = `tooltip`;
      }
    },
    destroy() {

      if (showTimeout) clearTimeout(showTimeout);
      if (hideTimeout) clearTimeout(hideTimeout);


      if (cleanup) cleanup();


      node.removeEventListener('mouseenter', showTooltip);
      node.removeEventListener('mouseleave', hideTooltip);
      node.removeEventListener('focus', showTooltip);
      node.removeEventListener('blur', hideTooltip);
      document.removeEventListener('click', removeTooltip);


      removeTooltip();
    }
  };
}
