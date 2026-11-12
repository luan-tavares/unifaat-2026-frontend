import type { User } from "../types/api.ts";

type Props = {
  user: User;
  isSelected: boolean;
  onChoose: (user: User) => void;
};

export default function UserItem({ user, isSelected, onChoose }: Props) {
  function handleChoose() {
    onChoose(user);
  }

  return (
    <li>
      <button
        type="button"
        className={isSelected ? "user user--selected" : "user"}
        aria-pressed={isSelected}
        onClick={handleChoose}
      >
        <strong>{user.name}</strong>
        <span>{user.job_title ?? "Sem cargo"}</span>
      </button>
    </li>
  );
}
