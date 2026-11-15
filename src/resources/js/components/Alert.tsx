type AlertProps = {
    variant: "success" | "danger" | "warning"
    message: string
    onClose: () => void
}

export function Alert({ variant, message, onClose }: AlertProps) {
    return (
        <div className={`alert alert-${variant} d-flex justify-content-between align-items-center`} role="alert">
            <span>{message}</span>
            <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose}></button>
        </div>
    )
}
