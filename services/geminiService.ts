import { GoogleGenAI } from "@google/genai";

// SINGLETON LAZY INSTANCE
// Isso impede que o construtor rode no carregamento da página, evitando o crash "Uncaught Error"
const getAI = () => {
  try {
    // Tenta obter a chave do Vite (Vercel) ou do Node (Local)
    const apiKey = import.meta.env.VITE_API_KEY || (typeof process !== 'undefined' ? process.env.API_KEY : undefined);
    
    if (!apiKey) {
      console.warn("E-CIDTUR IA: Chave de API não detectada. As funções inteligentes retornarão mocks.");
      return null;
    }
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error("Erro fatal ao inicializar IA:", err);
    return null;
  }
};

export const geminiService = {
  /**
   * Concierge Digital
   */
  async generateItinerary(answers: Record<string, any>): Promise<string> {
    const ai = getAI();
    
    // Fallback imediato se não houver IA configurada
    if (!ai) {
      return "Roteiro Offline: Recomendamos iniciar pela Orla de Atalaia, visitar o Oceanário e finalizar o dia na Passarela do Caranguejo.";
    }

    try {
      const prompt = `
        Atue como um Concierge Digital especialista em turismo em Aracaju (Sergipe).
        Com base nas respostas do turista abaixo, crie um roteiro personalizado de 1 dia.
        
        Perfil: ${JSON.stringify(answers)}
        
        Formate como texto corrido, amigável e direto.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp', 
        contents: prompt,
      });

      return response.text || "Não foi possível gerar o roteiro personalizado no momento.";

    } catch (error) {
      console.error('Erro na geração de roteiro:', error);
      return "Aracaju é encantadora! Visite a Orla de Atalaia e o Mercado Municipal.";
    }
  },

  /**
   * BI Insights
   */
  async getBIInsights(summary: any): Promise<string> {
    const ai = getAI();

    if (!ai) {
      return "Modo Offline: Os dados indicam estabilidade no fluxo turístico. Recomenda-se monitorar a satisfação nos fins de semana.";
    }

    try {
      const prompt = `
        Atue como Analista de Dados de Turismo.
        Analise este resumo JSON e forneça 3 insights estratégicos curtos:
        ${JSON.stringify(summary)}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });

      return response.text || "Análise indisponível.";

    } catch (error) {
      console.error('Erro na geração de insights:', error);
      return "Não foi possível processar os insights avançados no momento.";
    }
  }
};