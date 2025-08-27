import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Google devuelve el token en el hash de la URL (#access_token=...)
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get("access_token");
    const error = hashParams.get("error");

    if (accessToken) {
      // Guardar el token en localStorage
      localStorage.setItem("google_token", accessToken);

      // Guardar fecha de expiración (opcional)
      const expiresIn = hashParams.get("expires_in");
      if (expiresIn) {
        const expiryDate = new Date(Date.now() + parseInt(expiresIn, 10) * 1000);
        localStorage.setItem("google_token_expiry", expiryDate.toISOString());
      }

      // Redirigir al inicio de la app
      navigate("/");
    } else if (error) {
      console.error("Error en autenticación:", error);
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Procesando autenticación...</p>
      </div>
    </div>
  );
};
