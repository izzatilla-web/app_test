import React, { useEffect, useRef, useState } from 'react';
import { Loader2Icon, WifiOffIcon } from 'lucide-react';
import { NavBar } from './NavBar';
import { LargeTitle } from './LargeTitle';
import { t } from '../strings';

const scrollMemory: Record<string, number> = {};

interface ScrollScreenProps {
  title: string;
  subtitle?: string;
  scrollKey: string;
  trailing?: React.ReactNode;
  /** Left slot in the nav bar — e.g. the profile chip on Home. */
  leading?: React.ReactNode;
  backTitle?: string;
  onBack?: () => void;
  titleAccessory?: React.ReactNode;
  /** Rendered directly under the large title, scrolls with content. */
  belowTitle?: React.ReactNode;
  /** Signal counter — increment to scroll this screen to the top. */
  scrollToTopSignal?: number;
  offline?: boolean;
  children: React.ReactNode;
}

export function ScrollScreen({
  title,
  subtitle,
  scrollKey,
  trailing,
  leading,
  backTitle,
  onBack,
  titleAccessory,
  belowTitle,
  scrollToTopSignal,
  offline,
  children
}: ScrollScreenProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const dragStart = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const saved = scrollMemory[scrollKey] ?? 0;
    el.scrollTop = saved;
    setScrolled(saved > 40);
  }, [scrollKey]);

  useEffect(() => {
    if (scrollToTopSignal === undefined) return;
    ref.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [scrollToTopSignal]);

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    scrollMemory[scrollKey] = el.scrollTop;
    setScrolled(el.scrollTop > 40);
  }

  function onPointerDown(e: React.PointerEvent) {
    if ((ref.current?.scrollTop ?? 1) <= 0) dragStart.current = e.clientY;
  }
  function onPointerMove(e: React.PointerEvent) {
    if (dragStart.current === null || refreshing) return;
    const delta = e.clientY - dragStart.current;
    if (delta > 0) setPull(Math.min(delta * 0.5, 80));
  }
  function onPointerUp() {
    if (pull > 60) {
      setRefreshing(true);
      setPull(50);
      window.setTimeout(() => {
        setRefreshing(false);
        setPull(0);
      }, 1100);
    } else {
      setPull(0);
    }
    dragStart.current = null;
  }

  return (
    <div className="relative h-full w-full bg-background">
      <NavBar
        title={title}
        showTitle={scrolled}
        scrolled={scrolled}
        backTitle={backTitle}
        onBack={onBack}
        leading={leading}
        trailing={trailing} />


      {offline &&
      <div className="absolute inset-x-0 top-[88px] z-20 flex items-center gap-2 bg-warn/[0.16] px-4 py-[6px] backdrop-blur-xl">
          <WifiOffIcon size={14} className="shrink-0 text-warn" />
          <span className="font-sans text-caption font-medium text-warn">
            {t.offline(t.offlineWhen)}
          </span>
        </div>
      }

      <div
        className="pointer-events-none absolute inset-x-0 top-[88px] z-10 flex justify-center"
        style={{ opacity: pull > 8 ? 1 : 0, transform: `translateY(${pull - 30}px)` }}>
        
        <Loader2Icon
          size={20}
          className={['text-mutedfg', refreshing ? 'animate-spin' : ''].join(' ')}
          style={{ transform: refreshing ? undefined : `rotate(${pull * 4}deg)` }} />
        
      </div>

      <div
        ref={ref}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="no-scrollbar h-full overflow-y-auto overscroll-contain"
        style={{ paddingTop: offline ? 118 : 88, paddingBottom: 132 }}>
        
        <div style={{ transform: `translateY(${pull}px)`, transition: pull === 0 ? 'transform 250ms cubic-bezier(0.23,1,0.32,1)' : undefined }}>
          <LargeTitle
            title={title}
            subtitle={subtitle}
            collapsed={scrolled}
            accessory={titleAccessory} />
          
          {belowTitle}
          <div className="pt-2">{children}</div>
        </div>
      </div>
    </div>);

}

/** Plain pushed screen: nav bar with a back button, no large title. */
interface PushScreenProps {
  title: string;
  backTitle: string;
  onBack: () => void;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

export function PushScreen({ title, backTitle, onBack, trailing, children }: PushScreenProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  return (
    <div className="relative h-full w-full bg-background">
      <NavBar
        title={title}
        showTitle
        scrolled={scrolled}
        backTitle={backTitle}
        onBack={onBack}
        trailing={trailing} />
      
      <div
        ref={ref}
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
        className="no-scrollbar h-full overflow-y-auto overscroll-contain pb-[60px] pt-[100px]">
        
        {children}
      </div>
    </div>);

}