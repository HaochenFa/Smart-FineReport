/**
 * @file resizable.js
 * @author Haochen (Billy) Fa
 * @description Svelte action for making an element resizable.
 */

export function resizable(node) {
  let x, y, width, height;

  const handles = [
    {class: 'resizer top-left', cursor: 'nwse-resize', direction: 'tl'},
    {class: 'resizer top-right', cursor: 'nesw-resize', direction: 'tr'},
    {class: 'resizer bottom-left', cursor: 'nesw-resize', direction: 'bl'},
    {class: 'resizer bottom-right', cursor: 'nwse-resize', direction: 'br'},
    {class: 'resizer top', cursor: 'ns-resize', direction: 't'},
    {class: 'resizer bottom', cursor: 'ns-resize', direction: 'b'},
    {class: 'resizer left', cursor: 'ew-resize', direction: 'l'},
    {class: 'resizer right', cursor: 'ew-resize', direction: 'r'},
  ];

  const createHandle = (handle) => {
    const resizer = document.createElement('div');
    resizer.className = handle.class;
    resizer.style.cursor = handle.cursor;
    resizer.style.position = 'absolute';
    resizer.style.width = '10px';
    resizer.style.height = '10px';
    resizer.style.background = 'transparent'; // Make handles invisible
    resizer.style.zIndex = '1000';

    switch (handle.direction) {
      case 'tl':
        resizer.style.top = '-5px';
        resizer.style.left = '-5px';
        break;
      case 'tr':
        resizer.style.top = '-5px';
        resizer.style.right = '-5px';
        break;
      case 'bl':
        resizer.style.bottom = '-5px';
        resizer.style.left = '-5px';
        break;
      case 'br':
        resizer.style.bottom = '-5px';
        resizer.style.right = '-5px';
        break;
      case 't':
        resizer.style.top = '-5px';
        resizer.style.left = '5px';
        resizer.style.right = '5px';
        resizer.style.width = 'auto';
        break;
      case 'b':
        resizer.style.bottom = '-5px';
        resizer.style.left = '5px';
        resizer.style.right = '5px';
        resizer.style.width = 'auto';
        break;
      case 'l':
        resizer.style.left = '-5px';
        resizer.style.top = '5px';
        resizer.style.bottom = '5px';
        resizer.style.height = 'auto';
        break;
      case 'r':
        resizer.style.right = '-5px';
        resizer.style.top = '5px';
        resizer.style.bottom = '5px';
        resizer.style.height = 'auto';
        break;
    }

    node.appendChild(resizer);

    let currentHandle = null;

    const onMouseDown = (e) => {
      currentHandle = handle.direction;
      x = e.clientX;
      y = e.clientY;
      width = node.offsetWidth;
      height = node.offsetHeight;

      node.style.userSelect = 'none'; // Prevent text selection during resize
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    resizer.addEventListener('mousedown', onMouseDown);

    return () => resizer.removeEventListener('mousedown', onMouseDown);
  };

  const onMouseMove = (e) => {
    const dx = e.clientX - x;
    const dy = e.clientY - y;

    switch (currentHandle) {
      case 'tl':
        node.style.width = `${width - dx}px`;
        node.style.height = `${height - dy}px`;
        node.style.left = `${node.offsetLeft + dx}px`;
        node.style.top = `${node.offsetTop + dy}px`;
        break;
      case 'tr':
        node.style.width = `${width + dx}px`;
        node.style.height = `${height - dy}px`;
        node.style.top = `${node.offsetTop + dy}px`;
        break;
      case 'bl':
        node.style.width = `${width - dx}px`;
        node.style.height = `${height + dy}px`;
        node.style.left = `${node.offsetLeft + dx}px`;
        break;
      case 'br':
        node.style.width = `${width + dx}px`;
        node.style.height = `${height + dy}px`;
        break;
      case 't':
        node.style.height = `${height - dy}px`;
        node.style.top = `${node.offsetTop + dy}px`;
        break;
      case 'b':
        node.style.height = `${height + dy}px`;
        break;
      case 'l':
        node.style.width = `${width - dx}px`;
        node.style.left = `${node.offsetLeft + dx}px`;
        break;
      case 'r':
        node.style.width = `${width + dx}px`;
        break;
    }
  };

  const onMouseUp = () => {
    currentHandle = null;
    node.style.userSelect = '';
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  const cleanupHandles = handles.map(createHandle);

  return {
    destroy() {
      cleanupHandles.forEach(cleanup => cleanup());
    }
  };
}
