import { useEffect, useRef, type ChangeEvent } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function TaskFilter({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Foco automático quando a tela monta
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  // Apaga o texto e devolve o foco ao campo
  function handleClear() {
    onChange("");
    inputRef.current?.focus();
  }

  return (
    <div className="filter">
      <input
        ref={inputRef}
        type="search"
        placeholder="Filtrar tasks por nome"
        aria-label="Filtrar tasks por nome"
        value={value}
        onChange={handleChange}
      />
      <button type="button" onClick={handleClear}>
        Limpar
      </button>
    </div>
  );
}
