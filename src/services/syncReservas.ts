import { googleSheets } from "../services/googleSheets";
import { SPREADSHEET_CONFIG } from "../config/google";
import { Reserva, CANCHAS } from "../types";

// Función auxiliar: busca el nombre de la cancha por ID
function getNombreCancha(canchaId: string): string {
  const cancha = CANCHAS.find(c => c.id === canchaId);
  return cancha ? cancha.nombre : canchaId; // si no encuentra, devuelve el ID
}

// Función principal: sincroniza todas las reservas a Google Sheets
export async function syncReservas(reservas: Reserva[]) {
  if (!reservas || reservas.length === 0) {
    console.warn("⚠️ No hay reservas para sincronizar");
    return;
  }

  for (const r of reservas) {
    try {
      await googleSheets.appendRow(SPREADSHEET_CONFIG.SHEETS.RESERVAS, [
        r.fecha,
        r.hora_inicio,
        r.hora_fin,
        getNombreCancha(r.cancha_id), // 👈 ahora guarda el nombre
        r.cliente_nombre,
        r.metodo_pago,
        r.total,
        r.estado
      ]);
    } catch (error) {
      console.error("❌ Error al sincronizar reserva:", r.id, error);
    }
  }

  console.log(`✅ ${reservas.length} reservas sincronizadas a Google Sheets`);
}
