let currentTooltip: null | symbol = $state(null);

export function getTooltipState() {
    return {
        get active() { return currentTooltip },
        open(id: symbol) { currentTooltip = id },
        close() { currentTooltip = null },
        toggle(id: symbol) { currentTooltip = (currentTooltip === id ? null : id) }
    }
}
