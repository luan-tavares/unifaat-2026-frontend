type Props = {
  id: number;
  name: string;
  isDone: boolean;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

export function TaskItem({
  id,
  name,
  isDone,
  onToggle,
  onDelete,
}: Props) {
  const handleToggle = () => {
    onToggle(id);
  };

  const handleDelete = () => {
    onDelete(id);
  };

  return (
    <li>
      <span
        onClick={handleToggle}
        style={{
          textDecoration: isDone ? "line-through" : "none",
          cursor: "pointer",
        }}
      >
        {isDone ? "✅" : "⬜"} {name}
      </span>

      <button type="button" onClick={handleDelete}>
        Excluir
      </button>
    </li>
  );
}