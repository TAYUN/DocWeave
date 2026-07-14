/**
 * 暗色 token 生成配置。
 *
 * 调整方式：
 * 1. 改 `activePreset` 可以切换整体风格；
 * 2. 改 `presets` 可以统一放大/减弱明度、彩度；
 * 3. 改 `roleSpecs` 可以单独微调某个 token 的映射策略。
 *
 * 调参速查：
 * - 想让暗色更柔和：提高 `surfaceLightnessOffset`，降低 `textLightnessOffset` / `accentLightnessOffset`，并减小 `chromaMultiplier`
 * - 想让层级更清楚：降低 `surfaceLightnessOffset`，提高 `textLightnessOffset`
 * - 想让强调色更克制：降低 `accentLightnessOffset` 或减小 `chromaMultiplier`
 * - 想让按钮和链接更亮：提高 `accentLightnessOffset`
 */

export const activePreset = 'balanced'

export const generatedOrder = [
  'color-pure-white',
  'color-green',
  'color-orange',
  'color-link-light-blue',
  'color-focus-blue',
  'color-badge-blue-bg',
  'color-badge-blue-text',
  'color-background',
  'color-surface',
  'color-ink',
  'color-ink-muted',
  'color-accent',
  'color-accent-alt',
  'color-border',
  'color-link',
  'shadow-sm',
  'shadow-md',
]

export const presets = {
  // 更接近当前结果：暖深灰、对比适中、强调色克制。
  balanced: {
    surfaceLightnessOffset: 0,
    textLightnessOffset: 0,
    accentLightnessOffset: 0,
    chromaMultiplier: 1,
  },
  // 更柔一点：适合想降低“发光感”和界面对比时使用。
  soft: {
    surfaceLightnessOffset: 0.02,
    textLightnessOffset: -0.035,
    accentLightnessOffset: -0.04,
    chromaMultiplier: 0.78,
  },
  // 更利落一点：适合内容很多、希望层级更清楚时使用。
  contrast: {
    surfaceLightnessOffset: -0.025,
    textLightnessOffset: 0.035,
    accentLightnessOffset: 0.03,
    chromaMultiplier: 1.16,
  },
}

export const roleSpecs = {
  'color-background': {
    source: 'color-background',
    kind: 'surface',
    lightness: 0.23,
    chromaScale: 0.35,
    maxChroma: 0.03,
  },
  'color-surface': {
    source: 'color-surface',
    kind: 'surface',
    lightness: 0.27,
    chromaScale: 0.35,
    maxChroma: 0.03,
  },
  'color-badge-blue-bg': {
    source: 'color-badge-blue-bg',
    kind: 'surface',
    lightness: 0.31,
    chromaScale: 0.35,
    maxChroma: 0.03,
  },
  'color-link-light-blue': {
    source: 'color-focus-blue',
    kind: 'accent',
    lightness: 0.79,
    chromaScale: 0.82,
    minChroma: 0.08,
    maxChroma: 0.14,
  },
  'color-focus-blue': {
    source: 'color-focus-blue',
    kind: 'accent',
    lightness: 0.79,
    chromaScale: 0.88,
    minChroma: 0.08,
    maxChroma: 0.17,
  },
  'color-badge-blue-text': {
    source: 'color-badge-blue-text',
    kind: 'accent',
    lightness: 0.78,
    chromaScale: 0.82,
    minChroma: 0.08,
    maxChroma: 0.14,
  },
  'color-accent': {
    source: 'color-accent',
    kind: 'accent',
    lightness: 0.72,
    chromaScale: 0.82,
    minChroma: 0.08,
    maxChroma: 0.16,
  },
  'color-accent-alt': {
    source: 'color-accent-alt',
    kind: 'accent',
    lightness: 0.64,
    chromaScale: 0.82,
    minChroma: 0.08,
    maxChroma: 0.14,
  },
  'color-link': {
    source: 'color-link',
    kind: 'accent',
    lightness: 0.74,
    chromaScale: 0.82,
    minChroma: 0.08,
    maxChroma: 0.16,
  },
  'color-green': {
    source: 'color-green',
    kind: 'accent',
    lightness: 0.73,
    chromaScale: 0.78,
    minChroma: 0.08,
    maxChroma: 0.14,
  },
  'color-orange': {
    source: 'color-orange',
    kind: 'accent',
    lightness: 0.74,
    chromaScale: 0.82,
    minChroma: 0.08,
    maxChroma: 0.16,
  },
  'color-pure-white': {
    source: 'color-background',
    kind: 'surface',
    lightness: 0.23,
    chromaScale: 0.35,
    maxChroma: 0.03,
  },
  'color-ink': { source: 'color-ink', kind: 'text-rgba', lightness: 0.93, alpha: 0.95 },
  'color-ink-muted': {
    source: 'color-ink-muted',
    kind: 'text',
    lightness: 0.72,
    chromaScale: 0.35,
    maxChroma: 0.03,
  },
}

export const staticValues = {
  'color-border': 'rgba(255,255,255,0.08)',
  'shadow-sm':
    'rgba(0,0,0,0.2) 0px 4px 18px, rgba(0,0,0,0.16) 0px 2.025px 7.84688px, rgba(0,0,0,0.11) 0px 0.8px 2.925px, rgba(0,0,0,0.08) 0px 0.175px 1.04062px',
  'shadow-md':
    'rgba(0,0,0,0.16) 0px 1px 3px, rgba(0,0,0,0.2) 0px 3px 7px, rgba(0,0,0,0.2) 0px 7px 15px, rgba(0,0,0,0.26) 0px 14px 28px, rgba(0,0,0,0.3) 0px 23px 52px',
}
