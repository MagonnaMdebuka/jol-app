import React, { useRef, useState, type ReactNode } from 'react';

type SnapState = 'collapsed' | 'partial' | 'full';

interface IBottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  defaultSnap?: SnapState;
}

const SNAP_HEIGHTS: Record<SnapState, string> = {
  collapsed: '20px',
  partial: 'min(78vh, 720px)',
  full: '92vh',
};

interface IBottomSheetPanelProps {
  onClose: () => void;
  children: ReactNode;
  defaultSnap: SnapState;
}

const BottomSheetPanel: React.FC<IBottomSheetPanelProps> = ({
  onClose,
  children,
  defaultSnap,
}) => {
  const [snap, setSnap] = useState<SnapState>(defaultSnap);
  const startY = useRef(0);
  const startSnap = useRef<SnapState>(defaultSnap);

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
          absolute bottom-0 left-1/2 w-full max-w-[640px] -translate-x-1/2 pointer-events-auto
          backdrop-blur-2xl
          border-t border-nz-border/40
          rounded-t-[2rem]
          shadow-[0_-12px_60px_rgba(0,0,0,0.7)]
          transition-[height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          overflow-hidden
        `}
        style={{ height: SNAP_HEIGHTS[snap], background: 'rgba(30,22,16,0.95)' }}
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

        <div className="h-[calc(100%-38px)] overflow-y-auto px-5 pb-6 safe-area-bottom">
          {children}
        </div>
      </div>
    </div>
  );
};

const BottomSheet: React.FC<IBottomSheetProps> = ({
  open,
  onClose,
  children,
  defaultSnap = 'partial',
}) => {
  if (!open) return null;

  return (
    <BottomSheetPanel onClose={onClose} defaultSnap={defaultSnap}>
      {children}
    </BottomSheetPanel>
  );
};

export default BottomSheet;
