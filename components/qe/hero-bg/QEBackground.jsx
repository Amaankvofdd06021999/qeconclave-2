'use client';
/**
 * <QEBackground variant="rings" /> — QE Conclave hero background, 5 styles:
 *   'streams' | 'columns' | 'rings' | 'haze' | 'lidar'
 *
 *   <section className="hero">
 *     <QEBackground variant="rings" ref={bgRef} />
 *     <p data-bg-clear>India’s largest quality engineering conference</p>
 *     <h1 data-bg-dim>Quality, unbound</h1>
 *     <div data-bg-clear> …date, pitch, CTAs… </div>
 *   </section>
 *
 * data-bg-clear: small copy, background fades strongly behind it.
 * data-bg-dim:   display type, background softens behind it.
 * Ref API: pause(), play(), pulse(x, y), refresh(). Changing `variant` swaps styles live.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { mountQEBackground } from './qe-backgrounds';

const QEBackground = forwardRef(function QEBackground({ variant = 'streams', ...options }, ref) {
  const marker = useRef(null);
  const api = useRef(null);
  useImperativeHandle(ref, () => ({
    pause: () => api.current?.pause(),
    play: () => api.current?.play(),
    pulse: (x, y) => api.current?.pulse(x, y),
    refresh: () => api.current?.refresh(),
  }), []);
  useEffect(() => {
    const host = marker.current?.parentElement;
    if (!host) return undefined;
    api.current = mountQEBackground(host, { variant, ...options });
    return () => { api.current?.destroy(); api.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { api.current?.setVariant(variant); }, [variant]);
  return <span ref={marker} hidden aria-hidden="true" />;
});

export default QEBackground;
