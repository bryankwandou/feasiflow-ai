import { useEffect, useRef, ReactNode } from 'react';

interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

export default function FloatingCard({ children, className = '', intensity = 15 }: FloatingCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -intensity * 0.5;
      const rotateY = ((x - centerX) / centerX) * intensity * 0.5;

      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;
      el.style.boxShadow = `${-rotateY * 2}px ${rotateX * 2}px 40px rgba(20, 196, 196, 0.2)`;
    };

    const handleMouseLeave = () => {
      el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
      el.style.boxShadow = '';
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensity]);

  return (
    <div
      ref={ref}
      className={`${className}`}
      style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease', transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
}
