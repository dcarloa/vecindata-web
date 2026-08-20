import { useEffect, useRef } from "react";
import styles from "./DotGrid.module.css";

interface DotGridProps {
  /** CSS color for dots at rest. */
  dotColor?: string;
  /** CSS color for dots near the pointer. */
  activeColor?: string;
  /** Spacing between dots, in CSS px. */
  spacing?: number;
}

const BASE_RADIUS = 1.4;
const ACTIVE_RADIUS = 3.4;
const INFLUENCE_RADIUS = 130;

/**
 * Interactive dot-grid background. Pointer tracking is scoped to this
 * component's own container (not `window`) so it stays inert when used
 * behind unrelated page content.
 */
export function DotGrid({
  dotColor = "rgba(166, 138, 91, 0.35)",
  activeColor = "#c98a3e",
  spacing = 28,
}: DotGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let animationFrame = 0;

    function resize() {
      if (!container || !canvas) return;
      const dpr = window.devicePixelRatio || 1;
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const pointer = pointerRef.current;

      for (let x = spacing / 2; x < width; x += spacing) {
        for (let y = spacing / 2; y < height; y += spacing) {
          let radius = BASE_RADIUS;
          let color = dotColor;

          if (pointer) {
            const dx = x - pointer.x;
            const dy = y - pointer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < INFLUENCE_RADIUS) {
              const strength = 1 - distance / INFLUENCE_RADIUS;
              radius = BASE_RADIUS + (ACTIVE_RADIUS - BASE_RADIUS) * strength;
              color = activeColor;
            }
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = container?.getBoundingClientRect();
      if (!rect) return;
      pointerRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function handlePointerLeave() {
      pointerRef.current = null;
    }

    function loop() {
      draw();
      animationFrame = window.requestAnimationFrame(loop);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    // Reduced motion: render a single static grid, skip pointer reactivity
    // and the animation loop entirely.
    if (prefersReducedMotion) {
      return () => resizeObserver.disconnect();
    }

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);
    animationFrame = window.requestAnimationFrame(loop);

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [dotColor, activeColor, spacing]);

  return (
    <div ref={containerRef} className={styles.container} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
