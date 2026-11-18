// A labelled number box. Keeps what you type as text while you're typing
// (so you can clear the box), and only reports a value upward once it is a
// valid number within [min, max]. On leaving the box it snaps back to the
// last valid value.

import { useEffect, useState } from 'react';
import styles from './SettingsView.module.css';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export function NumberField({ label, value, min, max, onChange }: Props) {
  const [text, setText] = useState(String(value));

  // If the stored value changes from outside (e.g. "restore defaults"), follow it.
  useEffect(() => setText(String(value)), [value]);

  function handleChange(next: string) {
    setText(next);
    const n = Number(next);
    if (next.trim() !== '' && Number.isFinite(n) && n >= min && n <= max) onChange(n);
  }

  return (
    <label className={styles.row}>
      <span>{label}</span>
      <input
        className={styles.number}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step="any"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setText(String(value))}
      />
    </label>
  );
}
