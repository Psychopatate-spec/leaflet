// React import not required with the new JSX transform
import { useCallback, useEffect, useMemo, useState } from 'react';
import Window from './Window';
import SoundEffects from '../SoundEffects';

const WidgetManager = ({ widgets }) => {
  const sounds = useMemo(() => SoundEffects(), []);
  const [instances, setInstances] = useState([]);
  const [zCounter, setZCounter] = useState(10);

  const openWidget = useCallback((type) => {
    const def = widgets[type];
    if (!def) return;
    setInstances((prev) => {
      const existing = prev.find((p) => p.type === type);
      if (existing) {
        const maxZ = Math.max(...prev.map((p) => p.z), 0) + 1;
        return prev.map((p) => (p.id === existing.id ? { ...p, z: maxZ } : p));
      }
      const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      return [
        ...prev,
        {
          id,
          type,
          title: def.title,
          x: 80 + (prev.length * 24) % 240,
          y: 80 + (prev.length * 24) % 160,
          width: def.width || 380,
          height: def.height,
          z: zCounter + 1,
        },
      ];
    });
    setZCounter((z) => z + 1);
  }, [widgets, zCounter]);

  const onFocus = useCallback((id) => {
    setInstances((prev) => {
      const maxZ = Math.max(...prev.map((p) => p.z), 0) + 1;
      return prev.map((p) => (p.id === id ? { ...p, z: maxZ } : p));
    });
    setZCounter((z) => z + 1);
  }, []);

  const onClose = useCallback((id) => {
    setInstances((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const onDragEnd = useCallback((id, pos, size) => {
    // Clamp to viewport, then snap if within threshold
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(size?.width || 360, vw - margin * 2);
    const h = Math.min(size?.height || 260, vh - margin * 2);
    let x = Math.max(margin, Math.min(pos.x, vw - w - margin));
    let y = Math.max(margin, Math.min(pos.y, vh - h - margin));
    const snapT = 16;
    if (Math.abs(x - margin) < snapT) x = margin;
    if (Math.abs((x + w) - (vw - margin)) < snapT) x = vw - w - margin;
    if (Math.abs(y - margin) < snapT) y = margin;
    if (Math.abs((y + h) - (vh - margin)) < snapT) y = vh - h - margin;
    setInstances((prev) => prev.map((p) => (p.id === id ? { ...p, x, y, width: w, height: h } : p)));
  }, []);

  // resizing disabled

  const actions = useMemo(() => ({ openWidget }), [openWidget]);

  useEffect(() => {
    // Open Todo by default once
    if (instances.length === 0 && widgets.todo) openWidget('todo');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="widget-manager">
      <div className="widget-launcher">
        {Object.entries(widgets).map(([type, def]) => (
          <button 
            key={type} 
            type="button" 
            onClick={() => {
              sounds.playClickSound();
              openWidget(type);
            }}
            onMouseEnter={sounds.playHoverSound}
          >
            {def.title}
          </button>
        ))}
      </div>
      {instances.map((inst) => {
        const Comp = widgets[inst.type].Component;
        return (
          <Window
            key={inst.id}
            id={inst.id}
            title={inst.title}
            x={inst.x}
            y={inst.y}
            width={inst.width}
            height={inst.height}
            zIndex={inst.z}
            onDragEnd={onDragEnd}
            onFocus={onFocus}
            onClose={onClose}
          >
            <Comp actions={actions} />
          </Window>
        );
      })}
    </div>
  );
};

export default WidgetManager;


