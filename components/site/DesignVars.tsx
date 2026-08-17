import { getSetting } from '@/lib/settings'

// Builds the same paper-grain SVG that's hardcoded as the default in app/globals.css,
// but with the admin-configurable parameters substituted in.
function buildGrainImage(bgColor: string, baseFrequency: number, numOctaves: number, slope: number, opacity: number): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><defs><filter id='grain' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='${baseFrequency}' numOctaves='${numOctaves}' stitchTiles='stitch' result='noise'/><feColorMatrix type='saturate' values='0' in='noise' result='gray'/><feComponentTransfer in='gray' result='boosted'><feFuncR type='linear' slope='${slope}' intercept='-1.1'/><feFuncG type='linear' slope='${slope}' intercept='-1.1'/><feFuncB type='linear' slope='${slope}' intercept='-1.1'/></feComponentTransfer></filter></defs><rect width='400' height='400' fill='${bgColor}'/><rect width='400' height='400' fill='rgba(140,120,80,${opacity})' filter='url(#grain)' style='mix-blend-mode:overlay'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

const FONT_STACK: Record<string, string> = {
  Anton: "'Anton', sans-serif",
  'Playfair Display': "'Playfair Display', serif",
  Antonio: "'Antonio', sans-serif",
  UnifrakturMaguntia: "'UnifrakturMaguntia', cursive",
  Cinzel: "'Cinzel', serif",
  'Libre Baskerville': "'Libre Baskerville', serif",
}

/**
 * Renders the site's design.* settings (colours, fonts, paper grain, tab width,
 * transition speed) as CSS custom-property overrides. app/globals.css defines every
 * one of these vars with a default matching the site's original hardcoded look, so
 * this is a no-op until an admin actually changes something on Settings → Design.
 */
export async function DesignVars() {
  const [
    bgColor, paperColor, inkColor, accentColor, goldColor, linkColor, scrollbarThumb,
    tabWidth, slideMs,
    grainEnabled, grainFreq, grainOctaves, grainSlope, grainOpacity,
    fontHeadline, fontBody, fontSmallCaps,
  ] = await Promise.all([
    getSetting<string>('design.bgColor', '#E8E6D8'),
    getSetting<string>('design.paperColor', 'transparent'),
    getSetting<string>('design.inkColor', '#35291C'),
    getSetting<string>('design.accentColor', '#7A564C'),
    getSetting<string>('design.goldColor', '#C4AB77'),
    getSetting<string>('design.linkColor', '#7A564C'),
    getSetting<string>('design.scrollbarThumb', '#C4AB77'),
    getSetting<number>('design.tabWidth', 40),
    getSetting<number>('design.slideMs', 500),
    getSetting<boolean>('design.grain.enabled', true),
    getSetting<number>('design.grain.baseFrequency', 0.62),
    getSetting<number>('design.grain.numOctaves', 4),
    getSetting<number>('design.grain.slope', 3.2),
    getSetting<number>('design.grain.opacity', 0.72),
    getSetting<string>('design.font.headline', 'Playfair Display'),
    getSetting<string>('design.font.body', 'Libre Baskerville'),
    getSetting<string>('design.font.smallCaps', 'Playfair Display'),
  ])

  const grainImage = grainEnabled ? buildGrainImage(bgColor, grainFreq, grainOctaves, grainSlope, grainOpacity) : 'none'

  const css = `:root {
  --body-bg: ${bgColor};
  --page-bg: ${paperColor};
  --ink: ${inkColor};
  --red: ${accentColor};
  --accent: ${accentColor};
  --gold: ${goldColor};
  --link-color: ${linkColor};
  --scrollbar-thumb: ${scrollbarThumb};
  --tab-width: ${tabWidth}px;
  --slide-ms: ${slideMs}ms;
  --bg-grain-image: ${grainImage};
  --font-headline: ${FONT_STACK[fontHeadline] ?? FONT_STACK['Playfair Display']};
  --font-body: ${FONT_STACK[fontBody] ?? FONT_STACK['Libre Baskerville']};
  --font-smallcaps: ${FONT_STACK[fontSmallCaps] ?? FONT_STACK['Playfair Display']};
}`

  // eslint-disable-next-line react/no-danger
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
