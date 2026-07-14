import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {
  activePreset,
  generatedOrder,
  presets,
  roleSpecs,
  staticValues,
} from './dark-token.config.mjs'

const DEFAULT_TOKENS_PATH = path.resolve(process.cwd(), 'src/styles/tokens.css')

const BLOCK_START = '/* DARK_TOKENS_START */'
const BLOCK_END = '/* DARK_TOKENS_END */'

async function main() {
  const options = parseCliArgs(process.argv.slice(2))
  const targetPath = options.targetPath
    ? path.resolve(process.cwd(), options.targetPath)
    : DEFAULT_TOKENS_PATH
  const source = await readFile(targetPath, 'utf8')
  const rootVars = parseRootVars(source)
  const darkVars = generateDarkVars(rootVars, options.presetName)
  const darkBlock = renderDarkBlock(darkVars)

  if (!source.includes(BLOCK_START) || !source.includes(BLOCK_END)) {
    throw new Error(
      `未在 ${targetPath} 中找到 ${BLOCK_START} / ${BLOCK_END} 标记，无法安全回写暗色 token。`
    )
  }

  const updated = source.replace(
    new RegExp(`${escapeRegExp(BLOCK_START)}[\\s\\S]*?${escapeRegExp(BLOCK_END)}`),
    `${BLOCK_START}\n${darkBlock}\n${BLOCK_END}`
  )

  await writeFile(targetPath, updated, 'utf8')
  console.log(`已更新暗色 token: ${targetPath}`)
  console.log(`使用预设: ${options.presetName}`)
}

function parseRootVars(css) {
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\n\}/)
  if (!rootMatch) {
    throw new Error('未找到 :root 变量块。')
  }

  const vars = new Map()
  for (const match of rootMatch[1].matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi)) {
    vars.set(match[1], match[2].trim())
  }

  return vars
}

function generateDarkVars(rootVars, presetName) {
  const preset = presets[presetName]
  if (!preset) {
    throw new Error(`未找到暗色预设 ${presetName}。可用预设：${Object.keys(presets).join(', ')}`)
  }

  const generated = new Map()

  for (const name of generatedOrder) {
    if (staticValues[name]) {
      generated.set(name, staticValues[name])
      continue
    }

    const spec = roleSpecs[name]
    if (!spec) {
      throw new Error(`缺少 ${name} 的暗色映射规则。`)
    }

    const sourceValue = rootVars.get(spec.source)
    if (!sourceValue) {
      throw new Error(`未找到亮色 token --${spec.source}。`)
    }

    generated.set(name, transformColor(sourceValue, applyPreset(spec, preset)))
  }

  return generated
}

function parseCliArgs(args) {
  let presetName = activePreset
  let targetPath = null

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--preset') {
      presetName = args[index + 1] ?? presetName
      index += 1
      continue
    }

    if (arg.startsWith('--preset=')) {
      presetName = arg.slice('--preset='.length)
      continue
    }

    if (!arg.startsWith('--') && !targetPath) {
      targetPath = arg
    }
  }

  return { presetName, targetPath }
}

function renderDarkBlock(vars) {
  const lines = [
    '[data-mantine-color-scheme="dark"] {',
    '  /*',
    '   * 暗色 token 由脚本按 OKLCH 生成：',
    '   * 1. 保留 hue，让亮暗模式共享同一品牌色相；',
    '   * 2. 按语义角色重映射 lightness，而不是简单反相；',
    '   * 3. 在深背景中收窄 chroma，避免强调色过亮、过饱和。',
    '   */',
  ]

  for (const name of generatedOrder) {
    lines.push(`  --${name}: ${vars.get(name)};`)
  }

  lines.push('}')
  return lines.join('\n')
}

function transformColor(input, spec) {
  const rgb = parseColor(input)
  if (spec.kind === 'text-rgba') {
    const next = mapWithOklch(rgb, { lightness: spec.lightness, chromaScale: 0.2, maxChroma: 0.02 })
    return toRgbaString(next, spec.alpha)
  }

  const next = mapWithOklch(rgb, spec)
  return toHex(next)
}

function applyPreset(spec, preset) {
  // 预设只调“整体风格”，不改 token 的语义归属，避免越调越乱。
  const next = { ...spec }

  if (spec.kind === 'surface') {
    next.lightness = clamp(spec.lightness + preset.surfaceLightnessOffset, 0, 1)
  } else if (spec.kind === 'accent') {
    next.lightness = clamp(spec.lightness + preset.accentLightnessOffset, 0, 1)
    next.chromaScale = (spec.chromaScale ?? 1) * preset.chromaMultiplier
    if (typeof spec.minChroma === 'number')
      next.minChroma = spec.minChroma * Math.min(preset.chromaMultiplier, 1)
    if (typeof spec.maxChroma === 'number')
      next.maxChroma = spec.maxChroma * preset.chromaMultiplier
  } else if (spec.kind === 'text' || spec.kind === 'text-rgba') {
    next.lightness = clamp(spec.lightness + preset.textLightnessOffset, 0, 1)
  }

  return next
}

function mapWithOklch(rgb, spec) {
  const oklch = rgbToOklch(rgb)
  const nextChroma = clamp(
    oklch.chroma * (spec.chromaScale ?? 1),
    spec.minChroma ?? 0,
    spec.maxChroma ?? Number.POSITIVE_INFINITY
  )

  return oklchToRgb({
    lightness: spec.lightness,
    chroma: nextChroma,
    hue: oklch.hue,
  })
}

function parseColor(value) {
  const trimmed = value.trim()
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1)
    if (hex.length !== 6) throw new Error(`暂不支持的 HEX 颜色: ${value}`)
    return {
      r: Number.parseInt(hex.slice(0, 2), 16) / 255,
      g: Number.parseInt(hex.slice(2, 4), 16) / 255,
      b: Number.parseInt(hex.slice(4, 6), 16) / 255,
    }
  }

  const rgba = trimmed.match(/rgba?\(([\d.\s,]+)\)/i)
  if (rgba) {
    const [r, g, b] = rgba[1]
      .split(',')
      .slice(0, 3)
      .map((part) => Number.parseFloat(part.trim()) / 255)
    return { r, g, b }
  }

  throw new Error(`无法解析颜色值: ${value}`)
}

function rgbToOklch(rgb) {
  const lms = multiplyMatrix(
    [
      [0.4122214708, 0.5363325363, 0.0514459929],
      [0.2119034982, 0.6806995451, 0.1073969566],
      [0.0883024619, 0.2817188376, 0.6299787005],
    ],
    [srgbToLinear(rgb.r), srgbToLinear(rgb.g), srgbToLinear(rgb.b)]
  ).map((value) => Math.cbrt(value))

  const [L, a, b] = multiplyMatrix(
    [
      [0.2104542553, 0.793617785, -0.0040720468],
      [1.9779984951, -2.428592205, 0.4505937099],
      [0.0259040371, 0.7827717662, -0.808675766],
    ],
    lms
  )

  return {
    lightness: L,
    chroma: Math.sqrt(a ** 2 + b ** 2),
    hue:
      (Math.atan2(b, a) * 180) / Math.PI < 0
        ? (Math.atan2(b, a) * 180) / Math.PI + 360
        : (Math.atan2(b, a) * 180) / Math.PI,
  }
}

function oklchToRgb(oklch) {
  const angle = (oklch.hue * Math.PI) / 180
  const a = oklch.chroma * Math.cos(angle)
  const b = oklch.chroma * Math.sin(angle)
  const lmsBase = [
    oklch.lightness + 0.3963377774 * a + 0.2158037573 * b,
    oklch.lightness - 0.1055613458 * a - 0.0638541728 * b,
    oklch.lightness - 0.0894841775 * a - 1.291485548 * b,
  ].map((value) => value ** 3)

  const [r, g, blue] = multiplyMatrix(
    [
      [4.0767416621, -3.3077115913, 0.2309699292],
      [-1.2684380046, 2.6097574011, -0.3413193965],
      [-0.0041960863, -0.7034186147, 1.707614701],
    ],
    lmsBase
  ).map((value) => clamp(linearToSrgb(value), 0, 1))

  return { r, g, b: blue }
}

function srgbToLinear(value) {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function linearToSrgb(value) {
  return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055
}

function multiplyMatrix(matrix, vector) {
  return matrix.map((row) => row.reduce((sum, item, index) => sum + item * vector[index], 0))
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function toHex(rgb) {
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) =>
    Math.round(clamp(channel, 0, 1) * 255)
      .toString(16)
      .padStart(2, '0')
  )
  return `#${channels.join('')}`
}

function toRgbaString(rgb, alpha) {
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => Math.round(clamp(channel, 0, 1) * 255))
  return `rgba(${channels[0]},${channels[1]},${channels[2]},${alpha})`
}

function escapeRegExp(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

await main()
