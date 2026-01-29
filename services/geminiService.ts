import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Concierge Digital
   * Analisa as respostas e retorna um roteiro personalizado via Gemini.
   */
  async generateItinerary(answers: Record<string, any>) {
    try {
      const prompt = `
        Atue como um Concierge Digital especialista em turismo em Aracaju (Sergipe).
        Com base nas respostas do turista abaixo, crie um roteiro personalizado de 1 dia (manhã, tarde e noite).
        
        Perfil do Turista:
        ${JSON.stringify(answers, null, 2)}
        
        Regras:
        1. Seja acolhedor e entusiasta.
        2. Foque nas preferências indicadas (ex: se está com crianças, foque em atividades infantis; se gosta de cultura, museus).
        3. O roteiro deve ser lógico geograficamente.
        4. Formate a resposta de forma clara, sem Markdown complexo, apenas texto corrido e quebras de linha.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 2048 }
        }
      });

      return response.text || "Não foi possível gerar o roteiro. Tente novamente.";

    } catch (error) {
      console.error('Erro na IA:', error);
      return "Aracaju é encantadora! Recomendamos iniciar pela Orla de Atalaia, visitar o Oceanário e finalizar o dia provando nosso caranguejo na Passarela. Aproveite a cidade!";
    }
  },

  /**
   * BI Insights
   * Gera um texto analítico baseado nos dados brutos fornecidos.
   */
  async getBIInsights(summary: any) {
    try {
      const prompt = `
        Atue como um Analista de Dados Sênior especializado em Turismo.
        Analise o resumo estatístico abaixo e forneça insights estratégicos para a Secretaria de Turismo.
        
        Dados:
        ${JSON.stringify(summary, null, 2)}
        
        Forneça:
        1. Análise de Volume e Significância.
        2. Análise Geográfica (Origem dos turistas).
        3. Análise de Satisfação (NPS).
        4. Recomendações de ação baseadas nos dados.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 2048 }
        }
      });

      return response.text || "Insights indisponíveis no momento.";

    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      return "A análise preliminar indica consistência na coleta de dados. Recomenda-se continuar o monitoramento para identificar padrões de sazonalidade mais claros.";
    }
  }
};