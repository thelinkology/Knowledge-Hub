/** Moves keyboard/screen-reader focus to an element that is not normally focusable (e.g. an alert). */
export function focusElement(element: HTMLElement) {
    if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1')
    element.focus({ preventScroll: false })
}
