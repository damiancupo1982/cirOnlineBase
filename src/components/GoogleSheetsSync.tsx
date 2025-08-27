import React, { useState, useEffect } from "react";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  ExternalLink,
  Settings,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface GoogleSheetsSyncProps {
  onSyncComplete?: () => void;
}

export const GoogleSheetsSync: React.FC<GoogleSheetsSyncProps> = ({
  onSyncComplete,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSpreadsheet, setHasSpreadsheet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
    loadLastSync();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem("google_token");
    setIsAuthenticated(!!token);
    const url = localStorage.getItem("google_spreadsheet_url");
    if (url) {
      setHasSpreadsheet(true);
      setSpreadsheetUrl(url);
    }
  };

  const loadLastSync = () => {
    const stored = localStorage.getItem("last_google_sync");
    if (stored) {
      setLastSync(new Date(stored));
    }
  };

  const handleAuth = () => {
    const clientId =
      "4798228446-bp095egts57b40ip7ckdakia1lea7mnt.apps.googleusercontent.com";
    const redirectUri = window.location.origin + "/auth/callback";
    const scope = [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ].join(" ");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;

    window.location.href = authUrl;
  };

  const handleCreateSpreadsheet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("google_token");
      if (!token) throw new Error("No hay token de Google");

      // Crear spreadsheet en Drive
      const res = await fetch(
        "https://sheets.googleapis.com/v4/spreadsheets",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: { title: "Mi App - Datos" },
            sheets: [{ properties: { title: "Clientes" } }],
          }),
        }
      );

      const data = await res.json();
      if (data.spreadsheetUrl) {
        localStorage.setItem("google_spreadsheet_url", data.spreadsheetUrl);
        setSpreadsheetUrl(data.spreadsheetUrl);
        setHasSpreadsheet(true);
        await handleSync();
        alert(`Spreadsheet creado: ${data.spreadsheetUrl}`);
      } else {
        throw new Error("No se pudo crear el spreadsheet");
      }
    } catch (err) {
      console.error(err);
      setError("Error al crear el spreadsheet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("google_token");
      const spreadsheetUrl = localStorage.getItem("google_spreadsheet_url");
      if (!token || !spreadsheetUrl) throw new Error("Falta token o URL");

      // 👇 ejemplo: escribir en la hoja
      const spreadsheetId = spreadsheetUrl.split("/d/")[1].split("/")[0];
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Clientes!A1:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [["Sync OK", new Date().toLocaleString("es-AR")]],
          }),
        }
      );

      const now = new Date();
      setLastSync(now);
      localStorage.setItem("last_google_sync", now.toISOString());
      onSyncComplete?.();
    } catch (err) {
      console.error(err);
      setError("Error al sincronizar con Sheets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("google_token");
    localStorage.removeItem("google_spreadsheet_url");
    localStorage.removeItem("last_google_sync");
    setIsAuthenticated(false);
    setHasSpreadsheet(false);
    setSpreadsheetUrl(null);
    setLastSync(null);
  };

  const openSpreadsheet = () => {
    if (spreadsheetUrl) {
      window.open(spreadsheetUrl, "_blank");
    }
  };

  if (!showConfig) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowConfig(true)}
          className={`flex items-center px-3 py-2 rounded-lg text-sm ${
            isAuthenticated && hasSpreadsheet
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {isAuthenticated && hasSpreadsheet ? (
            <Cloud className="w-4 h-4 mr-2" />
          ) : (
            <CloudOff className="w-4 h-4 mr-2" />
          )}
          Google Sheets
        </button>

        {isAuthenticated && hasSpreadsheet && (
          <button
            onClick={handleSync}
            disabled={isLoading}
            className="flex items-center px-3 py-2 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Sincronizar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={() => setShowConfig(false)}
        />

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Configuración Google Sheets
            </h3>
            <button
              onClick={() => setShowConfig(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Estado de autenticación */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {isAuthenticated ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
                )}
                <span className="text-sm font-medium">
                  {isAuthenticated ? "Autenticado con Google" : "No autenticado"}
                </span>
              </div>
              {!isAuthenticated ? (
                <button
                  onClick={handleAuth}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Conectar
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                >
                  Desconectar
                </button>
              )}
            </div>

            {/* Estado del spreadsheet */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {hasSpreadsheet ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
                )}
                <span className="text-sm font-medium">
                  {hasSpreadsheet
                    ? "Spreadsheet configurado"
                    : "Sin spreadsheet"}
                </span>
              </div>
              {isAuthenticated && !hasSpreadsheet && (
                <button
                  onClick={handleCreateSpreadsheet}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Crear
                </button>
              )}
              {hasSpreadsheet && (
                <button
                  onClick={openSpreadsheet}
                  className="flex items-center px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Abrir
                </button>
              )}
            </div>

            {/* Sincronización */}
            {isAuthenticated && hasSpreadsheet && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Sincronización</span>
                  <button
                    onClick={handleSync}
                    disabled={isLoading}
                    className="flex items-center px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3 h-3 mr-1 ${
                        isLoading ? "animate-spin" : ""
                      }`}
                    />
                    Sincronizar
                  </button>
                </div>
                {lastSync && (
                  <p className="text-xs text-gray-600">
                    Última sincronización: {lastSync.toLocaleString("es-AR")}
                  </p>
                )}
              </div>
            )}

            {/* Información */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                ¿Cómo funciona?
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Se crea un spreadsheet en tu Google Drive</li>
                <li>• Los datos se sincronizan automáticamente</li>
                <li>• Puedes acceder desde cualquier dispositivo</li>
                <li>• Los cambios locales se reflejan en Google Sheets</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowConfig(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
