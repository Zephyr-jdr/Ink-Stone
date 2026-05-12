interface LogoProps {
  /** Taille relative. La taille réelle est gérée en CSS (responsive). */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Logo Ink & Stone (image SVG, /public/logo.svg). Tailles responsive
 * cappées à 140 px côté desktop : assez grand pour identifier le pictogramme,
 * pas envahissant.
 *
 *   - sm  : version header/coin (Header.tsx).
 *   - md  : version intermédiaire.
 *   - lg  : version "héro" (HomePage centré).
 */
export function Logo({ size = 'md' }: LogoProps) {
  // Tailles via classes Tailwind responsive : on contrôle uniquement la
  // hauteur, l'image conserve son ratio (w-auto).
  const sizeClass =
    size === 'sm'
      ? 'h-[80px] sm:h-[100px] md:h-[120px] lg:h-[140px]'
      : size === 'lg'
        ? 'h-[120px] sm:h-[140px] md:h-[160px] lg:h-[180px]'
        : 'h-[100px] sm:h-[120px] md:h-[140px] lg:h-[160px]';

  return (
    <img
      src="/logo.svg"
      alt="Ink & Stone"
      className={`${sizeClass} w-auto block flex-shrink-0 select-none`}
      draggable={false}
    />
  );
}
