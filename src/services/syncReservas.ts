export async function syncReservas(reservas: Reserva[]) {
  console.log("🔎 Entró a syncReservas con reservas:", reservas);  // 👈 cartel de prueba

  if (!reservas || reservas.length === 0) {
    console.warn("⚠️ No hay reservas para sincronizar");
    return;
  }
import { googleSheets } from "../services/googleSheets";
import { SPREADSHEET_CONFIG } from "../config/google";
import { Reserva, CANCHAS } from "../types";

// 🔎 Busca el nombre de la cancha
function getNombreCancha(canchaId: string): string {
  const cancha = CANCHAS.find(c => c.id === canchaId);
  return cancha ? cancha.nombre : canchaId;
}

// 🚀 Sincroniza TODAS las reservas (sobrescribe la hoja completa)
export async function syncReservas(reservas: Reserva[]) {
  if (!reservas || reservas.length === 0) {
    console.warn("⚠️ No hay reservas para sincronizar");
    return;
  }

  try {
    // 👉 Encabezados
    const headers = [
      "Cancha",
      "Cliente",
      "Fecha",
      "Hora Inicio",
      "Hora Fin",
      "Estado Pago",
      "Precio Base",
      "Extras",
      "Comentarios"
    ];

    // 👉 Convertimos reservas a filas
    const rows = reservas.map(r => {
      const extras = r.extras.length
        ? r.extras.map(e => `${e.nombre} x${e.cantidad}`).join(", ")
        : "";

      return [
        getNombreCancha(r.cancha_id),
        r.cliente_nombre,
        r.fecha,
        r.hora_inicio,
        r.hora_fin,
        r.metodo_pago,
        r.precio_base,
        extras,
        r.seña ?? ""
      ];
    });

    // 👉 Sobrescribimos todo en la hoja "reservas"
    await googleSheets.overwriteSheet(SPREADSHEET_CONFIG.SHEETS.RESERVAS, [
      headers,
      ...rows
    ]);

    console.log(`✅ ${reservas.length} reservas sincronizadas a Google Sheets`);
  } catch (error) {
    console.error("❌ Error al sincronizar reservas:", error);
  }
}
