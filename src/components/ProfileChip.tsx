import { Avatar } from './Avatar';

interface ProfileChipProps {
  name: string;
  seed: number;
  /** Small line under the name — the student's level. */
  caption: string;
  label: string;
  onClick: () => void;
}

/** Top-left identity block: avatar + name + level. Opens the profile. */
export function ProfileChip({ name, seed, caption, label, onClick }: ProfileChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-[44px] max-w-[190px] items-center gap-2 rounded-full pl-1 pr-3 transition-[transform,opacity] duration-100 ease-out active:scale-[0.97] active:opacity-80">

      <Avatar name={name} seed={seed} size={32} />
      <span className="flex min-w-0 flex-col items-start">
        <span className="w-full truncate font-sans text-[15px] font-semibold leading-[18px] text-foreground">
          {name}
        </span>
        <span className="w-full truncate font-sans text-caption leading-[14px] text-mutedfg">
          {caption}
        </span>
      </span>
    </button>);

}
