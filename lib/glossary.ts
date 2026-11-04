export const GLOSSARY = {
  reserve: {
    icon: "🏦",
    title: "Reserva de emergência",
    text: "Dinheiro que sai da conta do dia a dia e vai para uma conta separada (poupança/conta digital). É poupança de longo prazo, não para gastar no mês.",
  },
  variable: {
    icon: "🛒",
    title: "Gastos variáveis",
    text: "Teto para despesas do dia a dia que variam (delivery, lazer, compras). É um orçamento, não uma conta fixa.",
  },
  buffer: {
    icon: "🔧",
    title: "Buffer para imprevistos",
    text: "Um colchão dentro do mesmo mês para coisas inesperadas e pequenas (uma multa, uma consulta extra, um conserto rápido) que não justificam mexer na reserva de emergência. É diferente da reserva porque é de curtíssimo prazo e pensado para ser usado ainda nesse mês, se precisar.",
  },
  margin: {
    icon: "💸",
    title: "Margem restante",
    text: "O que sobra depois de alocar tudo isso. Não tem destino definido — é folga livre que pode virar reserva extra, ir para os variáveis, ou só ficar parada como segurança.",
  },
} as const;

const VARIABLE_KEYWORDS = ["delivery", "lazer", "compras"];

export function glossaryForBucket(bucket: { type: string; name: string }) {
  if (bucket.type === "deposit") return GLOSSARY.reserve;

  const name = bucket.name.toLowerCase();
  if (name.includes("buffer")) return GLOSSARY.buffer;
  if (name.includes("margem")) return GLOSSARY.margin;
  if (VARIABLE_KEYWORDS.some((keyword) => name.includes(keyword))) return GLOSSARY.variable;

  return null;
}
