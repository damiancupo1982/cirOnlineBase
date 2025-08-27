// Configuración para Google OAuth 2.0
export const GOOGLE_CONFIG = {
  CLIENT_ID: "4798228446-bp095egts57b40ip7ckdakia1lea7mnt.apps.googleusercontent.com",

  // ⚡ No uses CLIENT_SECRET en frontend (solo backend).
  // En Bolt trabajamos con Implicit Flow → no hace falta SECRET.

  REDIRECT_URI: window.location.origin + "/auth/callback",

  SCOPES: [
    // Sheets completo (leer y escribir)
    "https://www.googleapis.com/auth/spreadsheets",

    // Permiso para crear y modificar archivos creados por la app
    "https://www.googleapis.com/auth/drive.file",

    // 🚨 Recomendado: acceso a ver tus archivos de Drive
    // (necesario para poder abrir archivos existentes en "Recientes")
    "https://www.googleapis.com/auth/drive.readonly"
  ]
};

// Configuración de las hojas que tu app va a manejar en Google Sheets
export const SPREADSHEET_CONFIG = {
  SHEETS: {
    CLIENTES: "Clientes",
    RESERVAS: "Reservas",
    TRANSACCIONES: "Transacciones",
    EXTRAS: "Extras"
  }
};
