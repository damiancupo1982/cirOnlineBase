import { useEffect, useCallback } from 'react';
import { googleAuth } from '../services/googleAuth';
import { googleSheets } from '../services/googleSheets';

export const useAutoSync = (intervalMinutes: number = 5) => {
  const syncData = useCallback(async () => {
    try {
      if (googleAuth.isAuthenticated() && googleSheets.hasSpreadsheet()) {
        await googleSheets.syncAllData();
        console.log('Auto-sync completed successfully');
      }
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  }, []);

  useEffect(() => {
    // Sincronizar al cargar la página
    syncData();

    // Configurar sincronización automática
    const interval = setInterval(syncData, intervalMinutes * 60 * 1000);

    // Sincronizar cuando la ventana recupera el foco
    const handleFocus = () => {
      syncData();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncData, intervalMinutes]);

  return { syncData };
};