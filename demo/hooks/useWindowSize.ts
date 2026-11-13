import { useEffect, useState } from 'react';

const read = () => ({ width: window.innerWidth, height: window.innerHeight });

/** The size of the window, kept up to date while it is resized (or the phone frame is turned). */
export function useWindowSize() {
  const [size, setSize] = useState(read);
  useEffect(() => {
    const onResize = () => setSize(read());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}
