import { 
  computePosition, 
  autoPlacement,
  autoUpdate, 
  offset, 
  shift, 
} from '@floating-ui/dom';

export function tooltip(node, opts = {
  text: '',
  placement: 'top',
}) {

  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = opts.text;
  
  document.body.appendChild(tooltip);
  
  let cleanup;
  
  function showTooltip() {
    tooltip.style.opacity = '1';

    cleanup = autoUpdate(
      node,
      tooltip,
      () => {
        computePosition(node, tooltip, {
          placement: opts.placement,
          middleware: [
            autoPlacement(),
            offset(8), 
            shift({ padding: 5 }) 
          ]
        }).then(({ x, y }) => {
          Object.assign(tooltip.style, {
            left: `${x}px`,
            top: `${y}px`
          });
        });
      }
    );
  }
  
  function hideTooltip() {
    tooltip.style.opacity = '0';
    if (cleanup) {
      cleanup();
      cleanup = undefined;
    }
  }
  
  node.addEventListener('mouseenter', showTooltip);
  node.addEventListener('mouseleave', hideTooltip);
  node.addEventListener('focus', showTooltip);
  node.addEventListener('blur', hideTooltip);
  
  return {
    update(newopts) {
      tooltip.textContent = newopts.text;
    },
    destroy() {
      hideTooltip();
      node.removeEventListener('mouseenter', showTooltip);
      node.removeEventListener('mouseleave', hideTooltip);
      node.removeEventListener('focus', showTooltip);
      node.removeEventListener('blur', hideTooltip);
      document.body.removeChild(tooltip);
    }
  };
}
