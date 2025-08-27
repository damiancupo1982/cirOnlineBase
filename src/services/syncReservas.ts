import { googleSheets } from "../services/googleSheets";
import { SPREADSHEET_CONFIG } from "../config/google";
import { Reserva, CANCHAS } from "../types";

// Función auxiliar: buscar nombre de cancha
function getNombreCancha(canchaId: string): string {
  const cancha = CANCHAS.find(c => c.id === canchaId);
  return cancha ? cancha.nombre : canchaId;
}

// 🚀 Sincronizar reservas a Google Sheets con nuevo formato
export async function syncReservas(reservas: Reserva[]) {
  if (!reservas || reservas.length === 0) {
    console.warn("⚠️ No hay reservas para sincronizar");
    return;
  }

  try {
    // 👉 Encabezados
    await googleSheets.setHeaders(SPREADSHEET_CONFIG.SHEETS.RESERVAS, [
      "Cancha",
      "Cliente",
      "Fecha",
      "Hora Inicio",
      "Hora Fin",
      "Estado Pago",
      "Precio Base",
      "Extras",
      "Comentarios"
    ]);

    // 👉 Filas
    for (const r of reservas) {
      const extras = r.extras.length
        ? r.extras.map(e => `${e.nombre} x${e.cantidad}`).join(", ")
        : "";

      await googleSheets.appendRow(SPREADSHEET_CONFIG.SHEETS.RESERVAS, [
        getNombreCancha(r.cancha_id),
        r.cliente_nombre,
        r.fecha, // si querés lo cambio a DD/MM/YYYY
        r.hora_inicio,
        r.hora_fin,
        r.metodo_pago,
        r.precio_base,
        extras,
        r.seña ?? ""
      ]);
    }

    console.log(`✅ ${reservas.length} reservas sincronizadas a Google Sheets`);
  } catch (error) {
    console.error("❌ Error al sincronizar reservas:", error);
  }
}
