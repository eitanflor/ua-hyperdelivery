import { useEffect, useState, type RefObject } from "react";

/** Whether `ref` is on screen and the tab is visible - decorative loops run only then. */
export function useOnScreen(ref: RefObject<Element | null>): boolean {
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(() => document.visibilityState === "visible");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return inView && visible;
}
