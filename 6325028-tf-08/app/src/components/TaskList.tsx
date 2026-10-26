import { TaskItem } from "./TaskItem";

type Task = {
  id: number;
  name: string;
  isDone: boolean;
};

type Props = {
  tasks: Task[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

export function TaskList({ tasks, onToggle, onDelete }: Props) {
  if (tasks.length === 0) {
    return <p>Nenhuma task</p>;
  }

  return (
    <ul>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          id={task.id}
          name={task.name}
          isDone={task.isDone}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}