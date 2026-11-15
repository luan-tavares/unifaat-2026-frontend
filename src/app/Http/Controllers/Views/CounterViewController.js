/**
 * Contador em React como View pública: sem login, sem middleware.
 * O HTML vem de resources/views/counter.ejs; o contador é um componente React.
 *
 * Rota: GET /contador
 */
export default function CounterViewController(request, response) {
    return response.status(200).render("counter");
}
