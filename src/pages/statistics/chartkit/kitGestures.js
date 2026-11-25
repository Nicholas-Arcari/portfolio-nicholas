// src/pages/statistics/chartkit/kitGestures.js
// I gesti su un elemento: il puntatore (mouse, penna, dito), la rotella e i
// tasti, tradotti in quello che vogliono dire: passare sopra, premere e
// trascinare, il doppio clic, la rotella con Ctrl, il pizzico a due dita.
// Non sa niente di grafici: chi lo usa decide, con il valore che restituisce,
// se un gesto lo riguarda (press, wheel, pinch e key restituiscono true per
// tenerlo). Le coordinate sono in pixel CSS dall'angolo in alto a sinistra
// dell'elemento.

/**
 * Listens to `el` and calls `handlers`:
 *   hover(p)                     the pointer moves over it (not while a drag is on)
 *   leave()                      it leaves
 *   press(p) -> boolean          a button or a finger goes down; true starts a drag
 *   drag(p, start)               the pointer moves during that drag
 *   release(p, start)            the drag ends (or is cancelled)
 *   dblclick(p) -> boolean       double click
 *   wheel(p, { deltaY, ctrl }) -> boolean   true stops the page from scrolling
 *   pinch({ x, y, scale, dx, dy }) -> boolean   two fingers: the centre, the change of their distance and of the centre
 *   key(event) -> boolean        a key while the element has the focus; true stops its default action
 * p is { x, y, pointerType, button, shift, ctrl }. Returns the function that stops listening.
 */
export function attachGestures(el, handlers) {
  const at = (e) => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, pointerType: e.pointerType || 'mouse', button: e.button ?? 0, shift: !!e.shiftKey, ctrl: !!(e.ctrlKey || e.metaKey) };
  };
  const touches = new Map(); // pointerId -> { x, y } of the fingers down
  let drag = null; // { id, start } while a press holds the pointer
  let pinch = null; // { distance, x, y } while two fingers are down

  const twoFingers = () => {
    const [a, b] = [...touches.values()];
    return { distance: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };

  const onDown = (e) => {
    const p = at(e);
    if (e.pointerType === 'touch') {
      touches.set(e.pointerId, p);
      if (touches.size === 2) {
        // two fingers: the drag of one finger, if any, ends and the pinch begins
        if (drag && handlers.release) handlers.release(p, drag.start);
        drag = null;
        pinch = twoFingers();
        return;
      }
      if (touches.size > 2) return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (handlers.press && handlers.press(p)) {
      drag = { id: e.pointerId, start: p };
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // a pointer that is already gone cannot be captured: the drag still works while it stays on the element
      }
      // the mouse: no text selected while dragging. A finger is kept by touchstart (below), and in Firefox a
      // pointerdown cancelled for a finger keeps a second finger (the pinch) away from the element
      if (e.pointerType !== 'touch') e.preventDefault();
    }
  };

  const onMove = (e) => {
    const p = at(e);
    if (e.pointerType === 'touch' && touches.has(e.pointerId)) {
      touches.set(e.pointerId, p);
      if (pinch && touches.size === 2) {
        const now = twoFingers();
        const used = handlers.pinch && handlers.pinch({ x: now.x, y: now.y, scale: now.distance / Math.max(1, pinch.distance), dx: now.x - pinch.x, dy: now.y - pinch.y });
        pinch = now;
        if (used) e.preventDefault();
        return;
      }
    }
    if (drag && e.pointerId === drag.id) {
      if (handlers.drag) handlers.drag(p, drag.start);
      return;
    }
    if (!drag && handlers.hover && e.pointerType !== 'touch') handlers.hover(p);
  };

  const onUp = (e) => {
    const p = at(e);
    if (e.pointerType === 'touch') {
      touches.delete(e.pointerId);
      if (touches.size < 2) pinch = null;
    }
    if (drag && e.pointerId === drag.id) {
      const { start } = drag;
      drag = null;
      if (handlers.release) handlers.release(p, start);
    }
  };

  const onLeave = (e) => {
    if (!drag && e.pointerType !== 'touch' && handlers.leave) handlers.leave();
  };

  const onDouble = (e) => {
    if (handlers.dblclick && handlers.dblclick(at(e))) e.preventDefault();
  };

  const onWheel = (e) => {
    if (handlers.wheel && handlers.wheel(at(e), { deltaY: e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY, ctrl: !!(e.ctrlKey || e.metaKey) })) e.preventDefault();
  };

  const onKey = (e) => {
    if (handlers.key && handlers.key(e)) e.preventDefault();
  };

  // With touch-action: pan-y a finger moving up or down scrolls the page, and the browser takes the
  // gesture away from the chart (pointercancel). A finger that grabbed something (press returned
  // true: a line to drag) and a second finger (the pinch) keep the gesture for the chart: the
  // pointerdown comes before its touchstart, so the decision is taken when the browser asks.
  const onTouchStart = (e) => {
    if (drag || e.touches.length > 1) e.preventDefault();
  };
  const onTouchMove = (e) => {
    if ((drag || pinch) && e.cancelable) e.preventDefault();
  };

  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
  el.addEventListener('pointerleave', onLeave);
  el.addEventListener('dblclick', onDouble);
  el.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('keydown', onKey);
  el.addEventListener('touchstart', onTouchStart, { passive: false });
  el.addEventListener('touchmove', onTouchMove, { passive: false });
  return () => {
    el.removeEventListener('pointerdown', onDown);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onUp);
    el.removeEventListener('pointerleave', onLeave);
    el.removeEventListener('dblclick', onDouble);
    el.removeEventListener('wheel', onWheel);
    el.removeEventListener('keydown', onKey);
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove', onTouchMove);
  };
}
