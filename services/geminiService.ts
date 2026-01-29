// ESTE ARQUIVO AGORA É UM SISTEMA ESPECIALISTA DETERMINÍSTICO (RULE-BASED ENGINE)
// Nenhuma chamada externa é realizada. Custo zero. Performance instantânea.

export const geminiService = {
  /**
   * Concierge Digital (Baseado em Regras)
   * Analisa as respostas e retorna um roteiro pré-moldado com variáveis dinâmicas.
   */
  async generateItinerary(answers: Record<string, any>) {
    // Simula um pequeno delay para dar a sensação de "processamento inteligente"
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Extração de variáveis chave (com fallback seguro)
      // Procura chaves que contenham palavras chave, pois o ID da pergunta é dinâmico (bi_tag)
      const findAnswer = (keyword: string) => {
        const key = Object.keys(answers).find(k => k.includes(keyword) || k.includes('trip_motive') || k.includes('demo_company'));
        return answers[key || ''] || '';
      };

      // Tenta mapear as respostas baseadas nos tipos conhecidos do constants.tsx
      let motive = 'Lazer';
      let company = 'Sozinho';
      let duration = 'Curta';

      // Varredura simplificada nas respostas
      const values = Object.values(answers).map(v => String(v).toLowerCase());
      
      if (values.some(v => v.includes('negócio') || v.includes('trabalho'))) motive = 'Negócios';
      else if (values.some(v => v.includes('gastronomia') || v.includes('comida'))) motive = 'Gastronomia';
      else if (values.some(v => v.includes('cultura') || v.includes('história'))) motive = 'Cultura';
      else if (values.some(v => v.includes('praia') || v.includes('sol'))) motive = 'Praia';

      if (values.some(v => v.includes('família') || v.includes('criança'))) company = 'Família';
      else if (values.some(v => v.includes('casal') || v.includes('namorado'))) company = 'Casal';
      else if (values.some(v => v.includes('amigo'))) company = 'Amigos';

      // --- LÓGICA DE GERAÇÃO DE ROTEIRO (ARACAJU/SE) ---

      const greeting = "Bem-vindo a Aracaju! Preparei um roteiro especial para você.";
      let content = "";

      // ROTEIRO FAMÍLIA
      if (company === 'Família') {
        content = `
Manhã: Comece o dia com tranquilidade na Orla de Atalaia. O Oceanário de Aracaju (Projeto Tamar) é parada obrigatória para as crianças conhecerem as tartarugas e a vida marinha local.
Almoço: Siga para a Passarela do Caranguejo. Recomendo restaurantes com espaço kids e o tradicional caranguejo quebrado.
Tarde: Um passeio de catamarã pela Croa do Goré é seguro e encantador para todas as idades. As águas calmas permitem um banho relaxante.
Noite: Visite o Mundo da Criança na Orla ou desfrute de um sorvete local enquanto caminha pelos lagos da região.`;
      } 
      // ROTEIRO CASAL
      else if (company === 'Casal') {
        content = `
Manhã: Aproveitem a manhã na Praia do Saco ou na Aruana para um banho de mar mais reservado.
Almoço: Experimente a culinária sergipana sofisticada no Restaurante Caçarola (Mercado Municipal) ou opções contemporâneas na região da Atalaia.
Tarde: O Museu da Gente Sergipana oferece uma experiência interativa e tecnológica incrível, perfeita para fotos e cultura a dois. Finalize com o pôr do sol na Orla Pôr do Sol (Mosqueiro).
Noite: Jantar romântico em um dos bistrôs da Rua do Turista ou música ao vivo nos bares da Passarela.`;
      }
      // ROTEIRO NEGÓCIOS
      else if (motive === 'Negócios') {
        content = `
Manhã: Se tiver tempo livre, uma caminhada rápida na Orla de Atalaia ajuda a energizar. A região possui diversos cafés com Wi-Fi ideais para reuniões rápidas.
Almoço: Opte por restaurantes self-service premium no Bairro Jardins ou 13 de Julho para otimizar seu tempo com qualidade.
Tarde: Precisa de um local para trabalhar? O Museu da Gente Sergipana possui um café tranquilo. Se o tempo permitir, visite o Centro de Convenções para networking.
Noite: Relaxe após o trabalho no "Cariri" para ouvir um forró autêntico ou desfrute de um jantar executivo nos hotéis da Orla.`;
      }
      // ROTEIRO PADRÃO / AMIGOS
      else {
        content = `
Manhã: Energize-se com um café nordestino (cuscuz e tapioca) e siga para as praias do litoral sul.
Almoço: O Mercado Municipal oferece a autêntica moqueca sergipana e vista para o Rio Sergipe.
Tarde: Embarque no catamarã para a Ilha dos Namorados e Croa do Goré. É o ponto alto do turismo náutico da cidade.
Noite: A vida noturna acontece na Passarela do Caranguejo. Música ao vivo, petiscos e muita animação esperam por você e seu grupo.`;
      }

      return `${greeting}\n${content}`;

    } catch (error) {
      console.error('Erro no motor de regras:', error);
      return "Aracaju é encantadora! Recomendamos iniciar pela Orla de Atalaia, visitar o Oceanário e finalizar o dia provando nosso caranguejo na Passarela. Aproveite a cidade!";
    }
  },

  /**
   * BI Insights (Algoritmos Estatísticos)
   * Gera um texto analítico baseado nos dados brutos fornecidos.
   */
  async getBIInsights(summary: any) {
    // Simula processamento pesado
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const { total, topState, nps, topGender } = summary;

      // Análise de Volume
      const volumeText = total > 100 
        ? `A base de dados apresenta uma robustez estatística significativa com ${total} coletas.` 
        : `Com ${total} respostas coletadas, os dados indicam tendências iniciais importantes.`;

      // Análise Geográfica
      let geoText = "Ainda não há dados suficientes sobre a origem.";
      if (topState && topState.uf) {
        if (topState.uf === 'SE') {
          geoText = `O turismo interno (Sergipe) é predominante, sugerindo foco em ações de fidelização local e eventos de fim de semana.`;
        } else if (['BA', 'AL', 'PE'].includes(topState.uf)) {
          geoText = `Há uma forte presença de turismo regional (${topState.uf}), indicando que campanhas rodoviárias nos estados vizinhos são eficazes.`;
        } else {
          geoText = `Surpreendentemente, o principal mercado emissor é ${topState.uf}, demonstrando potencial para parcerias com companhias aéreas e operadoras nacionais.`;
        }
      }

      // Análise de NPS
      let npsText = "";
      if (nps >= 75) {
        npsText = `A percepção de qualidade é excelente (NPS ${nps}), classificando o destino na Zona de Excelência. A prioridade deve ser a manutenção dos padrões atuais.`;
      } else if (nps >= 50) {
        npsText = `O destino está na Zona de Qualidade (NPS ${nps}), mas existem pontos de atrito na experiência do turista que impedem a plena fidelização.`;
      } else {
        npsText = `Alerta: O NPS de ${nps} indica necessidade crítica de revisão nos serviços básicos (limpeza, segurança ou preços).`;
      }

      return `${volumeText} ${geoText} ${npsText} Recomenda-se cruzar estes dados com a sazonalidade atual para refinar as estratégias da SETUR.`;

    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      return "A análise preliminar indica consistência na coleta de dados. Recomenda-se continuar o monitoramento para identificar padrões de sazonalidade mais claros.";
    }
  }
};
