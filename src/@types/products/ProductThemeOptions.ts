/** Product colours (keys stored in products.theme). Classes map to tokens in game-free `_knowledge.css`. */
export const PRODUCT_THEMES = ['blue', 'violet', 'teal', 'green', 'amber', 'rose', 'slate'] as const
export type ProductTheme = (typeof PRODUCT_THEMES)[number]

export const productThemeLabel: Record<ProductTheme, string> = {
    blue: 'Blue',
    violet: 'Violet',
    teal: 'Teal',
    green: 'Green',
    amber: 'Amber',
    rose: 'Rose',
    slate: 'Slate',
}

export const isProductTheme = (value: string): value is ProductTheme =>
    (PRODUCT_THEMES as readonly string[]).includes(value)

/** `product-theme-<key>` sets --product-accent / --product-subtle (assets/styles/knowledge/_products.css) */
export const productThemeClass = (theme: string) => `product-theme-${isProductTheme(theme) ? theme : 'slate'}`
