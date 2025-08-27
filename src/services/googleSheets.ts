import { googleAuth } from './googleAuth';
import { SPREADSHEET_CONFIG } from '../config/google';
import { Cliente, Reserva, TransaccionCaja, ExtraDisponible } from '../types';

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
}

class GoogleSheetsService {
  private spreadsheetId: string | null = null;

  constructor() {
    this.loadSpreadsheetId();
  }

  private loadSpreadsheetId(): void {
    this.spreadsheetId = localStorage.getItem('circulo_sport_spreadsheet_id');
  }

  private saveSpreadsheetId(id: string): void {
    localStorage.setItem('circulo_sport_spreadsheet_id', id);
    this.spreadsheetId = id;
  }

  async createSpreadsheet(): Promise<SpreadsheetInfo> {
    try {
      const token = await googleAuth.getValidToken();
      
      // Crear el spreadsheet
      const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: `Círculo Sport - Gestión ${new Date().toLocaleDateString('es-AR')}`
          },
          sheets: [
            { properties: { title: SPREADSHEET_CONFIG.SHEETS.CLIENTES } },
            { properties: { title: SPREADSHEET_CONFIG.SHEETS.RESERVAS } },
            { properties: { title: SPREADSHEET_CONFIG.SHEETS.TRANSACCIONES } },
            { properties: { title: SPREADSHEET_CONFIG.SHEETS.EXTRAS } }
          ]
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create spreadsheet');
      }

      const spreadsheet = await createResponse.json();
      this.saveSpreadsheetId(spreadsheet.spreadsheetId);

      // Configurar headers para cada hoja
      await this.setupHeaders();

      return {
        id: spreadsheet.spreadsheetId,
        name: spreadsheet.properties.title,
        url: spreadsheet.spreadsheetUrl
      };
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw error;
    }
  }

  private async setupHeaders(): Promise<void> {
    if (!this.spreadsheetId) return;

    const token = await googleAuth.getValidToken();
    
    const requests = [
      // Headers para Clientes
      {
        updateCells: {
          range: {
            sheetId: 0, // Primera hoja (Clientes)
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 5
          },
          rows: [{
            values: [
              { userEnteredValue: { stringValue: 'ID' } },
              { userEnteredValue: { stringValue: 'Número Socio' } },
              { userEnteredValue: { stringValue: 'Nombre' } },
              { userEnteredValue: { stringValue: 'Teléfono' } },
              { userEnteredValue: { stringValue: 'Fecha Creación' } }
            ]
          }],
          fields: 'userEnteredValue'
        }
      },
      // Headers para Reservas
      {
        updateCells: {
          range: {
            sheetId: 1, // Segunda hoja (Reservas)
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 13
          },
          rows: [{
            values: [
              { userEnteredValue: { stringValue: 'ID' } },
              { userEnteredValue: { stringValue: 'Cancha' } },
              { userEnteredValue: { stringValue: 'Cliente ID' } },
              { userEnteredValue: { stringValue: 'Cliente Nombre' } },
              { userEnteredValue: { stringValue: 'Fecha' } },
              { userEnteredValue: { stringValue: 'Hora Inicio' } },
              { userEnteredValue: { stringValue: 'Hora Fin' } },
              { userEnteredValue: { stringValue: 'Método Pago' } },
              { userEnteredValue: { stringValue: 'Precio Base' } },
              { userEnteredValue: { stringValue: 'Extras' } },
              { userEnteredValue: { stringValue: 'Items Libres' } },
              { userEnteredValue: { stringValue: 'Total' } },
              { userEnteredValue: { stringValue: 'Estado' } },
              { userEnteredValue: { stringValue: 'Seña' } },
              { userEnteredValue: { stringValue: 'Fecha Creación' } }
            ]
          }],
          fields: 'userEnteredValue'
        }
      },
      // Headers para Transacciones
      {
        updateCells: {
          range: {
            sheetId: 2, // Tercera hoja (Transacciones)
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 7
          },
          rows: [{
            values: [
              { userEnteredValue: { stringValue: 'ID' } },
              { userEnteredValue: { stringValue: 'Tipo' } },
              { userEnteredValue: { stringValue: 'Concepto' } },
              { userEnteredValue: { stringValue: 'Monto' } },
              { userEnteredValue: { stringValue: 'Fecha/Hora' } },
              { userEnteredValue: { stringValue: 'Reserva ID' } },
              { userEnteredValue: { stringValue: 'Método Pago' } }
            ]
          }],
          fields: 'userEnteredValue'
        }
      },
      // Headers para Extras
      {
        updateCells: {
          range: {
            sheetId: 3, // Cuarta hoja (Extras)
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 3
          },
          rows: [{
            values: [
              { userEnteredValue: { stringValue: 'ID' } },
              { userEnteredValue: { stringValue: 'Nombre' } },
              { userEnteredValue: { stringValue: 'Precio' } }
            ]
          }],
          fields: 'userEnteredValue'
        }
      }
    ];

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests })
    });
  }

  async syncClientes(clientes: Cliente[]): Promise<void> {
    if (!this.spreadsheetId) throw new Error('No spreadsheet configured');

    const token = await googleAuth.getValidToken();
    const range = `${SPREADSHEET_CONFIG.SHEETS.CLIENTES}!A2:E${clientes.length + 1}`;
    
    const values = clientes.map(cliente => [
      cliente.id,
      cliente.numero_socio,
      cliente.nombre,
      cliente.telefono,
      cliente.created_at.toISOString()
    ]);

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values })
    });
  }

  async syncReservas(reservas: Reserva[]): Promise<void> {
    if (!this.spreadsheetId) throw new Error('No spreadsheet configured');

    const token = await googleAuth.getValidToken();
    const range = `${SPREADSHEET_CONFIG.SHEETS.RESERVAS}!A2:O${reservas.length + 1}`;
    
    const values = reservas.map(reserva => [
      reserva.id,
      reserva.cancha_id,
      reserva.cliente_id,
      reserva.cliente_nombre,
      reserva.fecha,
      reserva.hora_inicio,
      reserva.hora_fin,
      reserva.metodo_pago,
      reserva.precio_base,
      reserva.extras.map(e => `${e.nombre}(${e.cantidad})`).join('; '),
      reserva.items_libres.map(i => i.descripcion).join('; '),
      reserva.total,
      reserva.estado,
      reserva.seña || '',
      reserva.created_at.toISOString()
    ]);

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values })
    });
  }

  async syncTransacciones(transacciones: TransaccionCaja[]): Promise<void> {
    if (!this.spreadsheetId) throw new Error('No spreadsheet configured');

    const token = await googleAuth.getValidToken();
    const range = `${SPREADSHEET_CONFIG.SHEETS.TRANSACCIONES}!A2:G${transacciones.length + 1}`;
    
    const values = transacciones.map(transaccion => [
      transaccion.id,
      transaccion.tipo,
      transaccion.concepto,
      transaccion.monto,
      transaccion.fecha_hora.toISOString(),
      transaccion.reserva_id || '',
      transaccion.metodo_pago || ''
    ]);

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values })
    });
  }

  async syncExtras(extras: ExtraDisponible[]): Promise<void> {
    if (!this.spreadsheetId) throw new Error('No spreadsheet configured');

    const token = await googleAuth.getValidToken();
    const range = `${SPREADSHEET_CONFIG.SHEETS.EXTRAS}!A2:C${extras.length + 1}`;
    
    const values = extras.map(extra => [
      extra.id,
      extra.nombre,
      extra.precio
    ]);

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values })
    });
  }

  async syncAllData(): Promise<void> {
    try {
      const { clientesStorage } = await import('../storage/clientes');
      const { reservasStorage } = await import('../storage/reservas');
      const { cajaStorage } = await import('../storage/caja');
      const { extrasStorage } = await import('../storage/extras');

      await Promise.all([
        this.syncClientes(clientesStorage.getAll()),
        this.syncReservas(reservasStorage.getAll()),
        this.syncTransacciones(cajaStorage.getAll()),
        this.syncExtras(extrasStorage.getAll())
      ]);
    } catch (error) {
      console.error('Error syncing all data:', error);
      throw error;
    }
  }

  getSpreadsheetUrl(): string | null {
    if (!this.spreadsheetId) return null;
    return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit`;
  }

  hasSpreadsheet(): boolean {
    return this.spreadsheetId !== null;
  }

  clearSpreadsheet(): void {
    localStorage.removeItem('circulo_sport_spreadsheet_id');
    this.spreadsheetId = null;
  }
}

export const googleSheets = new GoogleSheetsService();