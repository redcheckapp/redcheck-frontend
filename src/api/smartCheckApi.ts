import api from "./axiosConfig";

export const getTodaysAnalysis = async () => {
    const response = await api.get("/ai/today/analysis");
    return response.data;
}

export const dailyAnalysis = async (): Promise<string> => {
    const response = await api.post("ai/analyze");
    return response.data;
}

export const pollForAnalysis = async (
    intervalMs = 3000,
    maxAttempts = 15
): Promise<any> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(res => setTimeout(res, intervalMs));
        try {
            const rawData = await getTodaysAnalysis();
            
            // LA MAGIA AQUÍ: Convertimos el texto a Objeto JSON si es necesario
            const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

            // Ahora sí podrá leer el planDeHoy
            if (data && data.planDeHoy && data.planDeHoy.length > 0) {
                console.log(`✅ ¡Éxito! Llama 3.2 ha terminado en el intento ${attempt}`);
                return data;
            }
            console.log(`Intento ${attempt}/${maxAttempts}: El backend sigue pensando...`);
        } catch (error: any) {
            if (error?.response?.status === 404) {
                console.log(`Intento ${attempt}/${maxAttempts}: Todavía no existe el plan (404).`);
                continue;
            }
            throw error;
        }
    }
    throw new Error("TIMEOUT");
}