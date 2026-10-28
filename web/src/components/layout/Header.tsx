import type { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  /** Sarlavha ostidagi qisqa izoh */
  note?: ReactNode;
  action?: ReactNode;
}

export function Header({ title, note, action }: HeaderProps) {
  return (
    <header className="flex items-end justify-between gap-3 pt-5 pb-1">
      <div className="min-w-0">
        <h1 className="truncate text-[26px] leading-tight font-extrabold tracking-[-0.02em]">{title}</h1>
        {note && <div className="mt-0.5 text-[14px] text-muted">{note}</div>}
      </div>
      {action}
    </header>
  );
}

export default Header;
