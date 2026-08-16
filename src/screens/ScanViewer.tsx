import React, { useState } from 'react';
import { DownloadIcon, XIcon } from 'lucide-react';
import { SCAN_URL } from '../mockData';
import type { Exam } from '../mockData';
import { mediumDate, haptic } from '../tokens';
import { t } from '../strings';

interface ScanViewerProps {
  exam: Exam;
  onClose: () => void;
}

export function ScanViewer({ exam, onClose }: ScanViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{x: number;y: number;} | null>(null);

  return (
    <div className="fade-in absolute inset-0 z-[70] bg-black">
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden"
        onPointerDown={(e) => setDrag({ x: e.clientX - offset.x, y: e.clientY - offset.y })}
        onPointerMove={(e) => {
          if (!drag || zoom === 1) return;
          setOffset({ x: e.clientX - drag.x, y: e.clientY - drag.y });
        }}
        onPointerUp={() => setDrag(null)}
        onDoubleClick={() => {
          haptic('light');
          setZoom((z) => z === 1 ? 2 : 1);
          setOffset({ x: 0, y: 0 });
        }}>
        
        <img
          src={SCAN_URL}
          alt={`${exam.topic} imtihon ishi`}
          draggable={false}
          className="h-full w-full object-contain transition-transform duration-200 ease-out"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }} />
        
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label={t.close}
        className="absolute left-4 top-[52px] flex h-[44px] w-[44px] items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-xl transition-transform duration-100 ease-out active:scale-[0.97]">
        
        <XIcon size={22} />
      </button>
      <button
        type="button"
        onClick={() => haptic('success')}
        aria-label="Yuklab olish"
        className="absolute right-4 top-[52px] flex h-[44px] w-[44px] items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-xl transition-transform duration-100 ease-out active:scale-[0.97]">
        
        <DownloadIcon size={20} />
      </button>

      <div className="absolute inset-x-0 bottom-0 bg-black/40 px-6 pb-[46px] pt-4 backdrop-blur-xl">
        <p className="text-center font-sans text-subhead tabular-nums text-white/90">
          {exam.topic} · {mediumDate(exam.date)} · {exam.score} {t.examScoreUnit}
        </p>
      </div>
    </div>);

}