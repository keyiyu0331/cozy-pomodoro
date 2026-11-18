// The <canvas> behind the whole app. This component only does the React
// part: it creates the renderer once, then passes on changes (season, weather, time
// of day, reduced motion) and sizes the canvas to cover the window.

import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../state/settingsStore';
import { createRenderer, type Renderer } from './renderer';
import { useReducedMotion, useSceneLayout, useTimeOfDay } from './sceneHooks';
import styles from './Scene.module.css';

export function Scene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);

  const season = useSettingsStore((s) => s.theme.season);
  const weather = useSettingsStore((s) => s.theme.weather);
  const timeOfDay = useTimeOfDay();
  const reducedMotion = useReducedMotion();
  const layout = useSceneLayout();

  useEffect(() => {
    const renderer = createRenderer(canvasRef.current!);
    rendererRef.current = renderer;
    return () => renderer.stop();
  }, []);

  useEffect(() => {
    rendererRef.current?.setState({ season, weather, timeOfDay });
  }, [season, weather, timeOfDay]);

  useEffect(() => {
    rendererRef.current?.setAnimated(!reducedMotion);
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      aria-hidden="true"
      style={{ left: layout.left, top: layout.top, width: layout.width, height: layout.height }}
    />
  );
}
