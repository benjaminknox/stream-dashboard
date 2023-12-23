import { useEffect, useRef } from 'react';

export const useInterval = (callback: () => unknown, delay: number) => {
  const intervalRef = useRef<number>();
  const savedCallback = useRef(callback);;

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => savedCallback.current();
    if (typeof delay === 'number') {
      intervalRef.current = window.setInterval(tick, delay);
      return () => window.clearInterval(intervalRef.current);
    }
  }, [delay]);
  return intervalRef;
}
