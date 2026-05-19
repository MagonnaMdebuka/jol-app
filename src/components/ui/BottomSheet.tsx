import React, { useRef, useState, useEffect, type ReactNode } from 'react';

type SnapState = 'collapsed' | 'partial' | 'full';

interface IBottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  defaultSnap?: SnapState;
}

const SNAP_HEIGHTS: Record<SnapState, string> = {
  collapsed: '20px',
  partial: '44vh',
  full: '92vh',
};

const BottomSheet: React.FC<IBottomSheetProps> = ({
  open,
  onClose,
  children,
  defaultSnap = 'partial',
}) => {
  const [snap, setSnap] = useState<SnapState>(defaultSnap);
  const startY = useRef(0);
  const startSnap = useRef<SnapState>(defaultSnap);

  useEffect(() => {
    if (open) setSnap(defaultSnap);
  }, [open, defaultSnap]);

  if (!open) return null;

  const onDragStart = (e: React.TouchEvent | React.MouseEvent): void => {
    startY.current = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    startSnap.current = snap;
  };

  const onDragEnd = (e: React.TouchEvent | React.MouseEvent): void => {
    const endY =
      'changedTouches' in e
        ? e.changedTouches[0].clientY
        : (e as React.MouseEvent).clientY;
    const delta = endY - startY.current;
    if (delta > 60) {
      if (startSnap.current === 'full') setSnap('partial');
      else onClose();
    } else if (delta < -60) {
      if (startSnap.current === 'partial') setSnap('full');
      else if (startSnap.current === 'collapsed') setSnap('partial');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      {(snap === 'partial' || snap === 'full') && (
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
          onClick={onClose}
        />
      )}

      <div
        className={`
          absolute bottom-0 left-0 right-0 pointer-events-auto
          backdrop-blur-2xl
          border-t border-nz-border/40
          rounded-t-[2rem]
          shadow-[0_-12px_60px_rgba(0,0,0,0.7)]
          transition-[height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          overflow-hidden
        `}
        style={{ height: SNAP_HEIGHTS[snap], background: 'rgba(31,24,16,0.95)' }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onMouseDown={onDragStart}
          onMouseUp={onDragEnd}
          onTouchStart={onDragStart}
          onTouchEnd={onDragEnd}
        >
          <div className="w-12 h-1.5 rounded-full bg-white/15" />
        </div>

        <div className="overflow-y-auto h-full pb-28 px-5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
