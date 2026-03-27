import api from "./axiosConfig";

export const getTodaysAnalysis = async (): Promise<string> => {
    const response = await api.get("/ai/today/analysis");
    return response.data;
}

export const dailyAnalysis = async (): Promise<string> => {
    const response = await api.post("ai/analyze");
    return response.data;
}

export const pollForAnalysis = async (intervalMs = 3000, maxAttempts = 15): Promise<any> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(res => setTimeout(res, intervalMs));
        try {
            const rawData = await getTodaysAnalysis();

            // Converts text into JSON Object if necessary
            const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

            // Now can read planDeHoy (Llama's prompt is written in spanish)
            if (data && data.planDeHoy && data.planDeHoy.length > 0) {
                console.log(`Success! Llama3.2 has finished in ${attempt} attemps`);
                return data;
            }
            console.log(`Attemp ${attempt}/${maxAttempts}: Backend still thinking...`);
            
        } catch (error: any) {
            if (error?.response?.status === 404) {
                console.log(`Attemp ${attempt}/${maxAttempts}: Plan still does not exist (404).`);
                continue;
            }
            throw error;
        }
    }
    throw new Error("TIMEOUT");
}