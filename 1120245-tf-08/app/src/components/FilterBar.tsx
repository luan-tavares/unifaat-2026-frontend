import type { Filter } from "../types"

type FilterBarProps = {
  current: Filter
  onFilter: (filter: Filter) => void
}

const OPTIONS: { label: string; value: Filter }[] = [
  { label: "Todas", value: "all" },
  { label: "Pendentes", value: "pending" },
  { label: "Feitas", value: "done" },
]

export function FilterBar({ current, onFilter }: FilterBarProps) {
  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
      {OPTIONS.map((option) => {
        function handleClick() {
          onFilter(option.value)
        }

        return (
          <button
            key={option.value}
            onClick={handleClick}
            style={{
              padding: "6px 14px",
              cursor: "pointer",
              borderRadius: "4px",
              border: "1px solid #1976d2",
              background: current === option.value ? "#1976d2" : "#fff",
              color: current === option.value ? "#fff" : "#1976d2",
              fontWeight: current === option.value ? "bold" : "normal",
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
