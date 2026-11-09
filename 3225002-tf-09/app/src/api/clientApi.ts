import axios from "axios";

/**
 * Cliente único do app.
 *
 * Toda chamada passa por aqui: a `baseURL` fica num lugar só, e trocar
 * o endereço do backend não vira busca por string espalhada.
 */
export const clientApi = axios.create({
  baseURL: "http://localhost:8080",
});
