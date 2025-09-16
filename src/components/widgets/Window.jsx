// React import not required with the new JSX transform
import { useRef, useState, useEffect } from 'react';

const Window = ({ id, title, children, x = 80, y = 80, width = 380, height, onDragEnd, onFocus, zIndex, onClose }) => {
  const windowRef = useRef(null);
  const draggingRef = useRef({ isDragging: false, startPointerX: 0, startPointerY: 0, startWindowX: x, startWindowY: y });
  const [position, setPosition] = useState({ x, y });
  const [size, setSize] = useState({ width, height: undefined });
  const headerRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    setPosition({ x, y });
  }, [x, y]);

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (draggingRef.current.isDragging) {
        const dx = e.clientX - draggingRef.current.startPointerX;
        const dy = e.clientY - draggingRef.current.startPointerY;
        const nextX = draggingRef.current.startWindowX + dx;
        const nextY = draggingRef.current.startWindowY + dy;
        setPosition({ x: nextX, y: nextY });
        return;
      }
      // resizing disabled
    };

    const handlePointerUp = () => {
      if (draggingRef.current.isDragging) {
        draggingRef.current.isDragging = false;
        document.body.style.userSelect = '';
        onDragEnd && onDragEnd(id, position, size);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [id, onDragEnd, position]);

  const onPointerDownHeader = (e) => {
    // Ignore drags starting from action buttons (e.g., close)
    if (e.target && e.target.closest && e.target.closest('.widget-window-actions')) {
      return;
    }
    if (!windowRef.current) return;
    draggingRef.current = {
      isDragging: true,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startWindowX: position.x,
      startWindowY: position.y,
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    document.body.style.userSelect = 'none';
    onFocus && onFocus(id);
  };

  // resizing disabled

  return (
    <div
      ref={windowRef}
      className="widget-window"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height || 'auto',
        zIndex,
      }}
      onMouseDown={() => onFocus && onFocus(id)}
    >
      <div ref={headerRef} className="widget-window-header" onPointerDown={onPointerDownHeader}>
        <span className="widget-window-title">{title}</span>
        <div className="widget-window-actions">
          <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => onClose && onClose(id)} aria-label="Close">✕</button>
        </div>
      </div>
      <div ref={bodyRef} className="widget-window-body">
        {children}
      </div>
    </div>
  );
};

export default Window;


