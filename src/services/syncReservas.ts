import { Reserva } from "../types";
import { syncReservas } from "../sync/syncReservas";

export const reservasStorage = {
  // 🔹 Obtener todas las reservas guardadas en localStorage
  getAll(): Reserva[] {
    const data = localStorage.getItem("reservas");
    return data ? JSON.parse(data) : [];
  },

  // 🔹 Agregar nueva reserva
  add(reserva: Reserva) {
    const reservas = this.getAll();
    reservas.push(reserva);
    localStorage.setItem("reservas", JSON.stringify(reservas));

    // 🚀 Sincroniza TODO el listado a Google Sheets
    syncReservas(reservas);
  },

  // 🔹 Actualizar una reserva existente
  update(reserva: Reserva) {
    const reservas = this.getAll().map(r => (r.id === reserva.id ? reserva : r));
    localStorage.setItem("reservas", JSON.stringify(reservas));

    // 🚀 Sincroniza TODO el listado a Google Sheets
    syncReservas(reservas);
  },

  // 🔹 Eliminar una reserva
  remove(id: string) {
    const reservas = this.getAll().filter(r => r.id !== id);
    localStorage.setItem("reservas", JSON.stringify(reservas));

    // 🚀 Sincroniza TODO el listado a Google Sheets
    syncReservas(reservas);
  }
};
