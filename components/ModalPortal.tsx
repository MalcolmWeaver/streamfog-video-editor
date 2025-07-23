// components/ModalPortal.tsx
'use client';
import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = { children: ReactNode };

export default function ModalPortal({ children }: Props) {
  const [el, setEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    setEl(container);
    return () => {
      document.body.removeChild(container);
    };
  }, []);

  if (!el) return null;
  return createPortal(children, el);
}

