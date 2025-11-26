import React, { useEffect, useState, useCallback } from 'react';

interface ShootingStar {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
}

export const ShootingStars: React.FC = () => {
  const [stars, setStars] = useState<ShootingStar[]>([]);

  const createStar = useCallback(() => {
    const id = Date.now();
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * (window.innerHeight * 0.5); // Start in top half
    const angle = 45; // Fixed angle for now, can be randomized
    const speed = 2 + Math.random() * 3;
    const size = 1 + Math.random() * 2;

    setStars(prev => [...prev, { id, x, y, angle, speed, size }]);

    // Remove star after animation
    setTimeout(() => {
      setStars(prev => prev.filter(star => star.id !== id));
    }, 2000);
  }, []);

  useEffect(() => {
    // Initial random stars
    const initialTimeout = setTimeout(() => {
        createStar();
    }, 1000);

    // Periodic star creation
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every check
        createStar();
      }
    }, 2000);

    return () => {
        clearTimeout(initialTimeout);
        clearInterval(interval);
    };
  }, [createStar]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {stars.map(star => (
        <div
          key={star.id}
          className="shooting-star"
          style={{
            left: star.x,
            top: star.y,
            '--angle': `${star.angle}deg`,
            '--speed': `${star.speed}s`,
            '--size': `${star.size}px`
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};
