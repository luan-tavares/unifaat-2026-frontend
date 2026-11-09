import type { Filter } from "../types/task.ts";

type Props = {
  filter: Filter;
  onChange: (filter: Filter) => void;
};

type FilterOption = {
  value: Filter;
  label: string;
};

const FILTER_OPTIONS: FilterOption[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendentes" },
  { value: "done", label: "Feitas" },
];

type FilterButtonProps = {
  option: FilterOption;
  isActive: boolean;
  onChange: (filter: Filter) => void;
};

function FilterButton({ option, isActive, onChange }: FilterButtonProps) {
  function handleClick() {
    onChange(option.value);
  }

  return (
    <button
      type="button"
      className={isActive ? "filter-button is-active" : "filter-button"}
      onClick={handleClick}
    >
      {option.label}
    </button>
  );
}

export default function FilterBar({ filter, onChange }: Props) {
  return (
    <div className="filter-bar">
      {FILTER_OPTIONS.map((option) => (
        <FilterButton
          key={option.value}
          option={option}
          isActive={option.value === filter}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
