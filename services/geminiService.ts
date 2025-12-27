
import { GoogleGenAI } from "@google/genai";
import { KPIStats, SedeStats } from "../types";

// Always use process.env.API_KEY for the client instance.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeBusinessData = async (kpis: KPIStats, sedes: SedeStats[]) => {
  const prompt = `
    Analyze the following business performance data for a retail/pharmacy chain:
    
    Overall KPIs:
    - Total Sales: S/ ${kpis.totalVentas.toFixed(2)}
    - Net Margin: S/ ${kpis.totalMargen.toFixed(2)}
    - Total Transactions: ${kpis.unidades}
    - Average Ticket: S/ ${kpis.ticketPromedio.toFixed(2)}
    
    Performance by Location (Sedes):
    ${sedes.map(s => `- ${s.name}: S/ ${s.ventas.toFixed(2)} sales, ${s.margenPct}% margin`).join('\n')}
    
    Tasks:
    1. Identify the top performing location and why.
    2. Identify the weakest location and suggest 2 actionable improvements.
    3. Suggest a marketing strategy based on the average ticket.
    4. Provide a brief summary of overall health.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert business analyst and Toodo platform specialist. Provide clear, professional, and actionable insights based on the data provided. Use Markdown formatting. Your tone is efficient, data-driven, and innovative.",
      }
    });
    // Property access for text output is correct.
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "No se pudo generar el análisis en este momento. Inténtalo de nuevo más tarde.";
  }
};
