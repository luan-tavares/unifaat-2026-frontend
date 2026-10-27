import type { Filter } from "../types"

type Props = {
  value: Filter
  label: string
  isActive: boolean
  onSelect: (value: Filter) => void
}

export function FilterButton({ value, label, isActive, onSelect }: Props) {
  const handleSelect = () => {
    onSelect(value)
  }

  return (
    <button
      className={isActive ? "filter filter--active" : "filter"}
      onClick={handleSelect}
    >
      {label}
    </button>
  )
}
