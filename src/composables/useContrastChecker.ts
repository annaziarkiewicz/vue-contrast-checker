import {
    computed,
    onBeforeUnmount,
    ref,
    watch
} from 'vue'

import type {
    ColorFormat,
    ContrastGuideline,
    ParsedColor
} from '@/types/contrastChecker'

const errorMessages = {
    emptyColor: 'Enter a color.',
    invalidColor: 'Invalid color. Use HEX, RGB or HSL.',
    invalidHex: 'Invalid HEX color.',
    invalidHsl: 'Invalid HSL or HSLA color.',
    invalidRgb: 'Invalid RGB or RGBA color.',
    unsupportedFormat: 'Use HEX, RGB or HSL.'
}

export const useContrastChecker = () => {
    const textColor = ref('#E08DA6')
    const backgroundColor = ref('#E7E7E3')
    const announcement = ref('')

    const guidelines: ContrastGuideline[] = [
        {
            aa: 4.5,
            aaa: 7,
            label: 'Normal text'
        },
        {
            aa: 3,
            aaa: 4.5,
            label: 'Large text'
        }
    ]

    const targetContrast = guidelines[0].aaa

    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1

    const context = canvas.getContext('2d', { willReadFrequently: true })

    let announcementPrefix = ''
    let announcementTimeout: ReturnType<typeof setTimeout> | undefined

    const parsedTextColor = computed(() => {
        return parseColor(textColor.value)
    })

    const parsedBackgroundColor = computed(() => {
        return parseColor(backgroundColor.value)
    })

    const textFormat = computed(() => {
        return parsedTextColor.value?.format || ''
    })

    const backgroundFormat = computed(() => {
        return parsedBackgroundColor.value?.format || ''
    })

    const textPreview = computed(() => {
        return parsedTextColor.value ? textColor.value.trim() : ''
    })

    const backgroundPreview = computed(() => {
        return parsedBackgroundColor.value ? backgroundColor.value.trim() : ''
    })

    const contrastRatio = computed(() => {
        if (
            !parsedTextColor.value
            || !parsedBackgroundColor.value
        ) {
            return null
        }

        return getColorContrast(parsedTextColor.value, parsedBackgroundColor.value).ratio
    })

    const formattedRatio = computed(() => {
        return contrastRatio.value === null ? '?' : formatContrastRatio(contrastRatio.value)
    })

    const canFindTextColor = computed(() => {
        if (!parsedBackgroundColor.value) {
            return false
        }

        const white: ParsedColor = {
            alpha: 1,
            blue: 255,
            format: 'RGB',
            green: 255,
            red: 255
        }

        const luminance = getLuminance(blendColor(parsedBackgroundColor.value, white))

        return Math.max((luminance + .05) / .05, 1.05 / (luminance + .05)) >= targetContrast
    })

    const canFindBackgroundColor = computed(() => {
        const foreground = parsedTextColor.value

        if (
            !foreground
            || !parsedBackgroundColor.value
        ) {
            return false
        }

        return [0, 255].some((channel) => {
            return getColorContrast(foreground, {
                alpha: 1,
                blue: channel,
                format: 'HEX',
                green: channel,
                red: channel
            }).ratio >= targetContrast
        })
    })

    const findColorTarget = computed(() => {
        if (
            contrastRatio.value === null
            || contrastRatio.value >= targetContrast
        ) {
            return null
        }

        if (canFindTextColor.value) {
            return 'text'
        }

        return canFindBackgroundColor.value ? 'background' : null
    })

    const parseColor = (value: string): ParsedColor | null => {
        const color = value.trim()
        let format: ColorFormat

        if (/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(color)) {
            format = 'HEX'
        } else {
            const match = /^(rgb|rgba|hsl|hsla)\(/i.exec(color)

            if (!match) {
                return null
            }

            format = match[1].toUpperCase() as ColorFormat
        }

        if (
            !context
            || /(?:var|env)\(|currentcolor/i.test(color)
            || !CSS.supports('color', color)
        ) {
            return null
        }

        context.fillStyle = color

        const normalized = context.fillStyle

        if (normalized.startsWith('#')) {
            return {
                alpha: 1,
                blue: parseInt(normalized.slice(5, 7), 16),
                format,
                green: parseInt(normalized.slice(3, 5), 16),
                red: parseInt(normalized.slice(1, 3), 16)
            }
        }

        const channels = normalized.match(/[\d.]+/g)?.map(Number)

        if (
            !channels
            || channels.length < 3
        ) {
            return null
        }

        return {
            alpha: channels[3] ?? 1,
            blue: channels[2],
            format,
            green: channels[1],
            red: channels[0]
        }
    }

    const getErrorMessage = (value: string) => {
        const color = value.trim()

        if (!color) {
            return errorMessages.emptyColor
        }

        if (parseColor(color)) {
            return ''
        }

        if (color.startsWith('#')) {
            return errorMessages.invalidHex
        }

        if (/^rgba?\b/i.test(color)) {
            return errorMessages.invalidRgb
        }

        if (/^hsla?\b/i.test(color)) {
            return errorMessages.invalidHsl
        }

        if (/^[a-z][a-z\d-]*(?:\s*\(|$)/i.test(color)) {
            return errorMessages.unsupportedFormat
        }

        return errorMessages.invalidColor
    }

    const normalizeColor = (value: string, onBlur = false) => {
        if (/^[\da-f]{6}$/i.test(value) || (onBlur && /^[\da-f]{3}$/i.test(value))) {
            return `#${value}`
        }

        const match = /^(rgba?)\(([^()]*)\)$/i.exec(value)

        if (!match) {
            return value
        }

        const channels = match[2].split(',')

        if (!channels.every((channel) => {
            return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)%?$/.test(channel.trim())
        })) {
            return value
        }

        const format = channels.length === 4 ? 'rgba' : channels.length === 3 ? 'rgb' : undefined

        return format && match[1].toLowerCase() !== format
            ? `${format}(${match[2]})`
            : value
    }

    const blendColor = (
        foreground: ParsedColor,
        background: ParsedColor
    ): ParsedColor => {
        return {
            alpha: 1,
            blue: foreground.blue * foreground.alpha + background.blue * (1 - foreground.alpha),
            format: foreground.format,
            green: foreground.green * foreground.alpha + background.green * (1 - foreground.alpha),
            red: foreground.red * foreground.alpha + background.red * (1 - foreground.alpha)
        }
    }

    const getLuminance = (color: ParsedColor) => {
        const channels = [color.red, color.green, color.blue].map((value) => {
            const channel = value / 255

            return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
        })

        return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
    }

    const getColorContrast = (
        foreground: ParsedColor,
        backgroundColor: ParsedColor
    ) => {
        const white: ParsedColor = {
            alpha: 1,
            blue: 255,
            format: 'RGB',
            green: 255,
            red: 255
        }

        const background = blendColor(backgroundColor, white)
        const text = blendColor(foreground, background)
        const textLuminance = getLuminance(text)
        const backgroundLuminance = getLuminance(background)
        const ratio = (Math.max(textLuminance, backgroundLuminance) + .05)
            / (Math.min(textLuminance, backgroundLuminance) + .05)

        return {
            backgroundLuminance,
            ratio,
            textLuminance
        }
    }

    const formatContrastRatio = (ratio: number) => {
        return (Math.floor(ratio * 100) / 100).toFixed(2)
    }

    const formatColor = (channels: number[], format: ColorFormat) => {
        if (format === 'HEX') {
            const hex = channels.map((value) => {
                return value.toString(16).padStart(2, '0')
            }).join('').toUpperCase()

            return `#${hex}`
        }

        if (format === 'RGB' || format === 'RGBA') {
            return `${format.toLowerCase()}(${channels.join(', ')}${format === 'RGBA' ? ', 1' : ''})`
        }

        const [red, green, blue] = channels.map((value) => {
            return value / 255
        })
        const minimum = Math.min(red, green, blue)
        const maximum = Math.max(red, green, blue)
        const range = maximum - minimum
        const lightness = (maximum + minimum) / 2
        const saturation = range === 0 ? 0 : range / (1 - Math.abs(2 * lightness - 1))
        let hue = 0

        if (range !== 0) {
            if (maximum === red) {
                hue = ((green - blue) / range) % 6
            } else if (maximum === green) {
                hue = (blue - red) / range + 2
            } else {
                hue = (red - green) / range + 4
            }

            hue = (hue * 60 + 360) % 360
        }

        const hsl = [hue, saturation * 100, lightness * 100].map((value) => {
            return Number(value.toFixed(8))
        })

        return `${format.toLowerCase()}(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%${format === 'HSLA' ? ', 1' : ''})`
    }

    const getAccessibleColor = (
        original: ParsedColor,
        target: 'text' | 'background'
    ) => {
        if (
            !parsedTextColor.value
            || !parsedBackgroundColor.value
        ) {
            return
        }

        const foreground = parsedTextColor.value
        const background = parsedBackgroundColor.value
        const channels = [original.red, original.green, original.blue]
        const minimum = Math.min(...channels)
        const maximum = Math.max(...channels)
        const range = maximum - minimum
        const hueChannels = channels.map((value) => {
            return range === 0 ? 0 : (value - minimum) / range
        })

        let closest: number[] | undefined
        let closestDistance = Infinity

        const colorAtLightness = (lightness: number) => {
            return hueChannels.map((channel) => {
                if (range === 0) {
                    return Math.round(lightness * 255)
                }

                const value = lightness <= .5
                    ? channel * lightness * 2
                    : channel * (2 - lightness * 2) + lightness * 2 - 1

                return Math.round(value * 255)
            })
        }

        const getCandidateContrast = (color: number[]) => {
            const candidate = parseColor(formatColor(color, original.format))

            if (!candidate) {
                return {
                    backgroundLuminance: 0,
                    ratio: 0,
                    textLuminance: 0
                }
            }

            return target === 'text'
                ? getColorContrast(candidate, background)
                : getColorContrast(foreground, candidate)
        }

        for (const dark of [true, false]) {
            let passingLightness = dark ? 0 : 1
            let failingLightness = dark ? 1 : 0

            if (getCandidateContrast(colorAtLightness(passingLightness)).ratio < targetContrast) {
                continue
            }

            for (let iteration = 0; iteration < 40; iteration++) {
                const middle = (passingLightness + failingLightness) / 2
                const color = colorAtLightness(middle)
                const contrast = getCandidateContrast(color)
                const isDarker = target === 'text'
                    ? contrast.textLuminance < contrast.backgroundLuminance
                    : contrast.backgroundLuminance < contrast.textLuminance

                const passes = contrast.ratio >= targetContrast && isDarker === dark

                if (passes) {
                    passingLightness = middle
                } else {
                    failingLightness = middle
                }
            }

            const color = colorAtLightness(passingLightness)
            const distance = color.reduce(
                (total, value, index) => {
                    return total + (value - channels[index]) ** 2
                },
                0
            )

            if (distance < closestDistance) {
                closest = color
                closestDistance = distance
            }
        }

        return closest ? formatColor(closest, original.format) : undefined
    }

    const findTextColor = () => {
        if (
            !parsedTextColor.value
            || !canFindTextColor.value
            || contrastRatio.value === null
            || contrastRatio.value >= targetContrast
        ) {
            return
        }

        const color = getAccessibleColor(parsedTextColor.value, 'text')

        if (color) {
            textColor.value = color
        }
    }

    const findBackgroundColor = () => {
        if (
            !parsedBackgroundColor.value
            || !canFindBackgroundColor.value
            || contrastRatio.value === null
            || contrastRatio.value >= targetContrast
        ) {
            return
        }

        const color = getAccessibleColor(parsedBackgroundColor.value, 'background')

        if (color) {
            backgroundColor.value = color
        }
    }

    const announceContrast = () => {
        clearTimeout(announcementTimeout)
        announcement.value = ''

        announcementTimeout = setTimeout(() => {
            const ratio = contrastRatio.value
            const prefix = announcementPrefix

            announcementPrefix = ''

            if (ratio === null) {
                announcement.value = prefix

                return
            }

            const statuses = (['aa', 'aaa'] as const).map((level) => {
                const results = guidelines.map((row) => {
                    return `${row.label.toLowerCase()} ${ratio >= row[level] ? 'passes' : 'fails'}`
                })

                return `WCAG ${level.toUpperCase()}: ${results.join(', ')}.`
            })

            announcement.value = `${prefix}Contrast: ${formatContrastRatio(ratio)} to 1. ${statuses.join(' ')}`
        }, 500)
    }

    const reverseColors = () => {
        const previousTextColor = textColor.value

        textColor.value = backgroundColor.value
        backgroundColor.value = previousTextColor
        announcementPrefix = 'Text and background colors swapped. '

        announceContrast()
    }

    for (const color of [textColor, backgroundColor]) {
        watch(color, (value) => {
            const normalizedColor = normalizeColor(value)

            if (value !== normalizedColor) {
                color.value = normalizedColor
            }
        }, { flush: 'sync' })
    }

    watch([textColor, backgroundColor], announceContrast)

    onBeforeUnmount(() => {
        clearTimeout(announcementTimeout)
    })

    return {
        announcement,
        backgroundColor,
        backgroundFormat,
        backgroundPreview,
        canFindBackgroundColor,
        canFindTextColor,
        contrastRatio,
        findBackgroundColor,
        findColorTarget,
        findTextColor,
        formattedRatio,
        getErrorMessage,
        guidelines,
        normalizeColor,
        reverseColors,
        textColor,
        textFormat,
        textPreview
    }
}