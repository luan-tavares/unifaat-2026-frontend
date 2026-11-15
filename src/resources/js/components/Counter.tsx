import { useState } from "react"

export function Counter() {
    const [count, setCount] = useState(0)

    function handleIncrement() {
        setCount(current => current + 1)
    }

    function handleDecrement() {
        setCount(current => current - 1)
    }

    function handleReset() {
        setCount(0)
    }

    return (
        <div className="text-center">
            <p className="display-1">{count}</p>
            <button className="btn btn-danger me-2" onClick={handleDecrement}>-1</button>
            <button className="btn btn-secondary me-2" onClick={handleReset}>Zerar</button>
            <button className="btn btn-primary" onClick={handleIncrement}>+1</button>
        </div>
    )
}
