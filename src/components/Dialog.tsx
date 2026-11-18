// The shared pop-up frame used by the intention and reflection dialogs.
// Uses the browser's built-in <dialog>, which dims the page behind it, keeps
// keyboard focus inside, and reports Escape through onCancel.

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './Dialog.module.css';

interface Props {
  title: string;
  /** Called when the user presses Escape. */
  onClose: () => void;
  children: ReactNode;
}

export function Dialog({ title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    // showModal() focuses the first button it finds; move focus to the field
    // marked data-autofocus instead, so you can start typing straight away.
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <h2 className={styles.title}>{title}</h2>
      {children}
    </dialog>
  );
}
