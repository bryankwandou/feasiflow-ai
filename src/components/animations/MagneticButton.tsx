import { useEffect, useRef, ReactNode } from 'react';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
}

export default function MagneticButton({ children, className = '', strength = 30, onClick }: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const distance = Math.sqrt(x * x + y * y);
      const maxDist = Math.max(rect.width, rect.height);
      const factor = Math.max(0, 1 - distance / maxDist);

      el.style.transform = `translate(${x * factor * 0.4}px, ${y * factor * 0.4}px)`;
    };

    const handleMouseLeave = () => {
      el.style.transform = 'translate(0, 0)';
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);

  return (
    <button
      ref={ref}
      className={className}
      onClick={onClick}
      style={{ transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)' }}
    >
      {children}
    </button>
  );
}
