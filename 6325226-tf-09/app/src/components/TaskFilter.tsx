import { useEffect, useRef, type ChangeEvent } from "react"

type Props = {
    value: string
    onChange: (value: string) => void
}

export default function TaskFilter({ value, onChange }: Props) {
    const inputRef = useRef<HTMLInputElement>(null)

    // Foco automático quando o campo monta
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        onChange(event.target.value)
    }

    function handleClear() {
        onChange("")
        inputRef.current?.focus()
    }

    return (
        <div className="task-filter">
            <input
                ref={inputRef}
                type="text"
                placeholder="Filtrar tasks por nome"
                value={value}
                onChange={handleChange}
            />
            <button type="button" onClick={handleClear}>Limpar</button>
        </div>
    )
}
