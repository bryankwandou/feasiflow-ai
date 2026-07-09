import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({ target, suffix = '', prefix = '', duration = 2000, className = '' }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const increment = target / steps;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, interval);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  const formatted = count >= 1000 ? count.toLocaleString() : count.toString();

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
