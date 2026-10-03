export type ColorFormat = 'HEX' | 'RGB' | 'RGBA' | 'HSL' | 'HSLA'

export type ContrastGuideline = {
    aa: number
    aaa: number
    label: string
}

export type ParsedColor = {
    alpha: number
    blue: number
    format: ColorFormat
    green: number
    red: number
}
