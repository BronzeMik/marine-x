'use client';
import { MotionConfig, motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import type { ReactNode } from 'react';

/** Honors prefers-reduced-motion for every motion component beneath it. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Scroll-triggered reveal. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.6, delay, ease: [0.2, 0.75, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}

/** Subtle vertical parallax for a background layer. Disabled under reduced motion. */
export function Parallax({ children, className, distance = 40 }: { children: ReactNode; className?: string; distance?: number }) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : distance]);
  return <motion.div className={className} style={{ y }}>{children}</motion.div>;
}
