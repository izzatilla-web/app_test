import React from 'react';
import { Avatar } from './Avatar';
import { haptic } from '../tokens';
import type { ChildRecord } from '../mockData';

interface ChildSwitcherProps {
  children: ChildRecord[];
  activeId: number;
  onSelect: (id: number) => void;
}

export function ChildSwitcher({ children, activeId, onSelect }: ChildSwitcherProps) {
  if (children.length < 2) return null;

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1 pt-2">
      {children.map((child) => {
        const active = child.id === activeId;
        return (
          <button
            key={child.id}
            type="button"
            onClick={() => {
              haptic('light');
              onSelect(child.id);
            }}
            aria-pressed={active}
            className={[
            'flex h-[44px] shrink-0 items-center gap-2 rounded-full border pl-[6px] pr-4 transition-[transform,opacity,background-color,border-color] duration-150 ease-out active:scale-[0.97] active:opacity-80',
            active ?
            'border-primary bg-primary/[0.08]' :
            'border-cardborder bg-card'].
            join(' ')}>
            
            <Avatar name={child.firstName} seed={child.id} size={32} />
            <span
              className={[
              'font-sans text-subhead font-semibold',
              active ? 'text-primary' : 'text-mutedfg'].
              join(' ')}>
              
              {child.firstName}
            </span>
          </button>);

      })}
    </div>);

}