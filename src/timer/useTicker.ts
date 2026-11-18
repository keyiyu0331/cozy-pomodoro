// React hook: while `running` is true, makes the component re-render about
// every 250 ms. It returns a counter that goes up by one on each tick.
//
// The tick carries no time information on purpose — whoever uses it reads
// Date.now() and compares against the timer's end timestamp. A late or
// missed tick therefore never makes the timer wrong, only briefly stale.

import { useEffect, useState } from 'react';

export function useTicker(running: boolean): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!running) return;
    const worker = new Worker(new URL('./tickWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = () => setTick((t) => t + 1);
    return () => worker.terminate(); // stop ticking when paused/unmounted
  }, [running]);

  return tick;
}
