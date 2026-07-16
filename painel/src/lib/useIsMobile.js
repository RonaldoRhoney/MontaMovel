import { useEffect, useState } from "react";

// Único caso do painel que precisa mesmo de JS pra ser responsivo: o menu
// lateral vira gaveta (off-canvas) abaixo do breakpoint. O resto das telas
// usa grids "repeat(auto-fit, minmax(...))", que se reorganizam sozinhos
// sem precisar saber a largura da tela em JS.
export function useIsMobile(breakpoint = 860) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [breakpoint]);
  return isMobile;
}
