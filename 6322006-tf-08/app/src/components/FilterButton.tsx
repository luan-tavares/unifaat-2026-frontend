import type { Filter } from "../types/task"

type FilterButtonProps = {
    filter: Filter
    label: string
    isActive: boolean
    onSelect: (filter: Filter) => void
}

export function FilterButton({ filter, label, isActive, onSelect }: FilterButtonProps) {
    const className = isActive ? "btn-filter is-active" : "btn-filter"

    function handleSelect() {
        onSelect(filter)
    }

    return <button className={className} onClick={handleSelect}>{label}</button>
}
