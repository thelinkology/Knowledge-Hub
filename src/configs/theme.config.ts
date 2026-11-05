import type { Theme } from '@/@types/theme'

/** Defaults; the user's choice (mode, collapsed nav) is kept in the THEME_COOKIE. Light is the default. */
export const themeConfig: Theme = {
    themeSchema: 'default',
    direction: 'ltr',
    mode: 'light',
    locale: 'en',
    controlSize: 'md',
    panelExpand: false,
    layout: {
        type: 'collapsibleSide',
        sideNavCollapse: false,
    },
}
