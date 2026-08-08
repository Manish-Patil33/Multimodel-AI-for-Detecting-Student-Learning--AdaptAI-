'use client';

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
} from 'framer-motion';
import React, {
  Children,
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;
const DEFAULT_PANEL_SIZE = 48;

type DockOrientation = 'horizontal' | 'vertical';

type DockProps = {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  panelSize?: number;
  magnification?: number;
  spring?: SpringOptions;
  orientation?: DockOrientation;
};

type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
};

type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
};

type DockIconProps = {
  className?: string;
  children: React.ReactNode;
};

type DockContextType = {
  mousePos: MotionValue<number>;
  spring: SpringOptions;
  magnification: number;
  distance: number;
  orientation: DockOrientation;
};

type DockProviderProps = {
  children: React.ReactNode;
  value: DockContextType;
};

const DockContext = createContext<DockContextType | undefined>(undefined);

function DockProvider({ children, value }: DockProviderProps) {
  return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
}

function useDock() {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error('useDock must be used within a DockProvider');
  }
  return context;
}

function Dock({
  children,
  className,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelSize = DEFAULT_PANEL_SIZE,
  orientation = 'vertical',
}: DockProps) {
  const mousePos = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const isVertical = orientation === 'vertical';

  return (
    <motion.div
      style={{
        scrollbarWidth: 'none',
      }}
      className={cn(
        'flex',
        isVertical ? 'flex-col w-full h-auto py-2' : 'max-w-full items-end overflow-x-auto mx-2'
      )}
    >
      <motion.div
        onMouseMove={(e) => {
          isHovered.set(1);
          mousePos.set(isVertical ? e.pageY : e.pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mousePos.set(Infinity);
        }}
        className={cn(
          'flex gap-2 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-slate-200/80 dark:border-neutral-800 p-2 shadow-lg',
          isVertical ? 'flex-col w-full' : 'w-fit mx-auto flex-row',
          className
        )}
        role='toolbar'
        aria-label='Sidebar Dock Navigation'
      >
        <DockProvider value={{ mousePos, spring, distance, magnification, orientation }}>
          {children}
        </DockProvider>
      </motion.div>
    </motion.div>
  );
}

function DockItem({ children, className, onClick, active }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { distance, magnification, mousePos, spring, orientation } = useDock();
  const isHovered = useMotionValue(0);
  const isVertical = orientation === 'vertical';

  const mouseDistance = useTransform(mousePos, (val) => {
    const domRect = ref.current?.getBoundingClientRect() ?? { x: 0, y: 0, width: 0, height: 0 };
    const center = isVertical ? domRect.y + domRect.height / 2 : domRect.x + domRect.width / 2;
    return val - center;
  });

  const sizeTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [isVertical ? 44 : 40, magnification, isVertical ? 44 : 40]
  );

  const size = useSpring(sizeTransform, spring);

  return (
    <motion.div
      ref={ref}
      style={isVertical ? { height: size } : { width: size }}
      onClick={onClick}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      className={cn(
        'relative inline-flex items-center justify-between rounded-xl px-3 py-2 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer select-none',
        active ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 font-bold border-l-4 border-indigo-600 shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-neutral-800',
        className
      )}
      tabIndex={0}
      role='button'
      aria-haspopup='true'
    >
      {Children.map(children, (child) =>
        cloneElement(child as React.ReactElement, { size, isHovered, orientation, active })
      )}
    </motion.div>
  );
}

function DockLabel({ children, className, ...rest }: DockLabelProps) {
  const restProps = rest as Record<string, unknown>;
  const isHovered = restProps['isHovered'] as MotionValue<number>;
  const orientation = (restProps['orientation'] as DockOrientation) || 'vertical';
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered.on('change', (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  const isVertical = orientation === 'vertical';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: isVertical ? -6 : 0, y: isVertical ? '-50%' : 0 }}
          animate={{ opacity: 1, x: isVertical ? 8 : 0, y: isVertical ? '-50%' : -10 }}
          exit={{ opacity: 0, x: isVertical ? -6 : 0, y: isVertical ? '-50%' : 0 }}
          transition={{ duration: 0.18 }}
          className={cn(
            'absolute w-fit whitespace-pre rounded-lg border border-slate-200 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-xl dark:border-neutral-800 dark:bg-neutral-800 pointer-events-none z-50',
            isVertical ? 'left-full top-1/2 ml-2' : '-top-8 left-1/2 -translate-x-1/2',
            className
          )}
          role='tooltip'
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className, ...rest }: DockIconProps) {
  const restProps = rest as Record<string, unknown>;
  const size = restProps['size'] as MotionValue<number>;

  const iconScaleTransform = useTransform(size, (val) => val / 44);

  return (
    <motion.div
      style={{ scale: iconScaleTransform }}
      className={cn('flex items-center justify-center text-lg flex-shrink-0', className)}
    >
      {children}
    </motion.div>
  );
}

/* ── PRE-CONFIGURED EDUADAPT SIDEBAR DOCK ─────── */
export function EduAdaptSidebarDock({
  activeTab,
  onTabChange,
  items,
}: {
  activeTab: string;
  onTabChange: (id: string) => void;
  items: Array<{ id: string; label: string; icon: string }>;
}) {
  return (
    <Dock orientation='vertical' magnification={54} distance={120}>
      {items.map((item) => (
        <DockItem
          key={item.id}
          active={activeTab === item.id}
          onClick={() => onTabChange(item.id)}
        >
          <div className="flex items-center gap-3 w-full overflow-hidden">
            <DockIcon>{item.icon}</DockIcon>
            <span className="text-sm font-semibold truncate">{item.label}</span>
          </div>
          <DockLabel>{item.label}</DockLabel>
        </DockItem>
      ))}
    </Dock>
  );
}

export { Dock, DockIcon, DockItem, DockLabel };
