export function calcularMeta(total: number, meta: number) {
    if (meta <= 0) return 0
    const porcentagem = (total / meta) * 100
    return Math.min(Math.round(porcentagem), 100)
}
