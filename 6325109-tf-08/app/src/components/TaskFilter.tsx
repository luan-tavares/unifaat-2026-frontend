import type { Filter } from "../types";

type Props = {
  filter: Filter;
  onChange: (filter: Filter) => void;
};

function TaskFilter({ filter, onChange }: Props) {
  const handleAll = () => {
    onChange("all");
  };

  const handlePending = () => {
    onChange("pending");
  };

  const handleDone = () => {
    onChange("done");
  };

  const classFor = (value: Filter) =>
    filter === value ? "btn-filter is-active" : "btn-filter";

  return (
    <div className="task-filter">
      <button type="button" className={classFor("all")} onClick={handleAll}>
        Todas
      </button>
      <button
        type="button"
        className={classFor("pending")}
        onClick={handlePending}
      >
        Pendentes
      </button>
      <button type="button" className={classFor("done")} onClick={handleDone}>
        Feitas
      </button>
    </div>
  );
}

export default TaskFilter;
