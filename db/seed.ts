import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { db } from "./index";
import {
  users,
  months,
  incomeLines,
  expenseLines,
  allocationBuckets,
} from "./schema";

// Scripts executados pelo Node não carregam .env.local automaticamente como o Next.js.
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  console.log("Seeding database...");

  const thyagoPassword = process.env.SEED_THYAGO_PASSWORD ?? "troque-esta-senha-1";
  const thaylaPassword = process.env.SEED_THAYLA_PASSWORD ?? "troque-esta-senha-2";

  const [thyago, thayla] = await db
    .insert(users)
    .values([
      {
        name: "Thyago",
        username: "thyago",
        passwordHash: await bcrypt.hash(thyagoPassword, 10),
      },
      {
        name: "Thayla",
        username: "thayla",
        passwordHash: await bcrypt.hash(thaylaPassword, 10),
      },
    ])
    .returning();

  const [nov, dez, jan, fev, mar] = await db
    .insert(months)
    .values([
      { slug: "nov-2026", label: "Novembro 2026", orderIndex: 0 },
      { slug: "dez-2026", label: "Dezembro 2026", orderIndex: 1 },
      { slug: "jan-2027", label: "Janeiro 2027", orderIndex: 2 },
      { slug: "fev-2027", label: "Fevereiro 2027", orderIndex: 3 },
      { slug: "mar-2027", label: "Março 2027", orderIndex: 4 },
    ])
    .returning();

  // --- Entradas ---
  await db.insert(incomeLines).values([
    // Novembro
    { monthId: nov.id, label: "Salário Thyago", chipLabel: "desconto R$1k", amountCents: 1050000, person: "thyago", orderIndex: 0 },
    { monthId: nov.id, label: "Salário Thayla", chipLabel: null, amountCents: 320000, person: "thayla", orderIndex: 1 },
    { monthId: nov.id, label: "Renda extra Thayla", chipLabel: "nutricionista", amountCents: 50000, person: "thayla", orderIndex: 2 },

    // Dezembro
    { monthId: dez.id, label: "Salário Thyago", chipLabel: "desconto R$1k", amountCents: 1050000, person: "thyago", orderIndex: 0 },
    { monthId: dez.id, label: "Férias Thayla", chipLabel: "+R$2.483 vs. normal", amountCents: 568300, person: "thayla", orderIndex: 1 },
    { monthId: dez.id, label: "Renda extra Thayla", chipLabel: "nutricionista", amountCents: 50000, person: "thayla", orderIndex: 2 },
    { monthId: dez.id, label: "Bônus Thyago", chipLabel: "extra, salário novo", amountCents: 1150000, person: "thyago", orderIndex: 3 },

    // Janeiro
    { monthId: jan.id, label: "Salário Thyago", chipLabel: "salário cheio", amountCents: 1150000, person: "thyago", orderIndex: 0 },
    { monthId: jan.id, label: "Salário Thayla", chipLabel: "férias — sem pagamento", amountCents: null, person: "thayla", orderIndex: 1 },
    { monthId: jan.id, label: "Renda extra Thayla", chipLabel: "nutricionista", amountCents: 50000, person: "thayla", orderIndex: 2 },

    // Fevereiro
    { monthId: fev.id, label: "Salário Thyago", chipLabel: null, amountCents: 1150000, person: "thyago", orderIndex: 0 },
    { monthId: fev.id, label: "Salário Thayla", chipLabel: null, amountCents: 320000, person: "thayla", orderIndex: 1 },
    { monthId: fev.id, label: "Renda extra Thayla", chipLabel: "nutricionista", amountCents: 50000, person: "thayla", orderIndex: 2 },

    // Março
    { monthId: mar.id, label: "Salário Thyago", chipLabel: null, amountCents: 1150000, person: "thyago", orderIndex: 0 },
    { monthId: mar.id, label: "Salário Thayla", chipLabel: null, amountCents: 320000, person: "thayla", orderIndex: 1 },
    { monthId: mar.id, label: "Renda extra Thayla", chipLabel: "nutricionista", amountCents: 50000, person: "thayla", orderIndex: 2 },
  ]);

  // --- Saídas: Novembro (totalmente itemizado) ---
  const novFixed: Array<[string, string | null, number]> = [
    ["Aluguel + Condomínio", null, 370000],
    ["Cartão de crédito (principal)", null, 170000],
    ["Cartão Mercado Pago", null, 17500],
    ["Empréstimo mãe Thyago", "única vez", 100000],
    ["Apoio mãe Thyago", null, 50000],
    ["Apoio pais Thayla", null, 30000],
    ["DAS", "split provisório", 60000],
    ["Renegociação DAS", "split provisório", 37000],
    ["Contabilidade", null, 20000],
    ["Faculdade", null, 36000],
    ["Psicólogo", null, 40000],
    ["Remédio ansiedade", null, 20000],
    ["Gás + Luz", null, 43500],
    ["Ari (Uber)", "split provisório", 15000],
    ["Bianca", "split provisório", 10000],
    ["Ração gatos", "split provisório", 14000],
    ["Rancho mensal (compra de alimentos)", "novo", 50000],
  ];
  const novPunctual: Array<[string, string | null, number]> = [
    ["Psiquiatra", "a cada 2 meses", 16000],
    ["Contab. renegociação DAS", "única vez", 11500],
  ];

  await db.insert(expenseLines).values([
    ...novFixed.map(([label, chipLabel, amountCents], i) => ({
      monthId: nov.id,
      section: "fixed" as const,
      label,
      chipLabel,
      amountCents,
      orderIndex: i,
    })),
    ...novPunctual.map(([label, chipLabel, amountCents], i) => ({
      monthId: nov.id,
      section: "punctual" as const,
      label,
      chipLabel,
      amountCents,
      orderIndex: i,
    })),
  ]);

  // --- Saídas: Dezembro a Março ---
  // Mesmas despesas fixas de novembro, exceto "Empréstimo mãe Thyago" (quitado em novembro).
  // Nota: a soma itemizada resultante (R$ 9.830) difere do total agregado informado na
  // especificação para estes meses (R$ 10.330) — mantido fiel ao detalhamento linha a linha
  // de novembro; ajustar os valores reais quando Thyago confirmar os números definitivos.
  const recurringFixed = novFixed.filter(([label]) => label !== "Empréstimo mãe Thyago");
  const psiquiatra: [string, string | null, number] = ["Psiquiatra", "a cada 2 meses", 16000];

  for (const month of [dez, jan, fev, mar]) {
    await db.insert(expenseLines).values(
      recurringFixed.map(([label, chipLabel, amountCents], i) => ({
        monthId: month.id,
        section: "fixed" as const,
        label,
        chipLabel,
        amountCents,
        orderIndex: i,
      })),
    );

    if (month === jan || month === mar) {
      await db.insert(expenseLines).values([
        {
          monthId: month.id,
          section: "punctual" as const,
          label: psiquiatra[0],
          chipLabel: psiquiatra[1],
          amountCents: psiquiatra[2],
          orderIndex: 0,
        },
      ]);
    }
  }

  // --- Blocos de alocação ---
  await db.insert(allocationBuckets).values([
    // Novembro
    { monthId: nov.id, type: "deposit", name: "Reserva de emergência", icon: "🏦", color: "green", budgetCents: 50000, orderIndex: 0 },
    { monthId: nov.id, type: "tracked", name: "Delivery", icon: "🍔", color: "yellow", budgetCents: 30000, orderIndex: 1 },
    { monthId: nov.id, type: "tracked", name: "Lazer", icon: "🎮", color: "yellow", budgetCents: 25000, orderIndex: 2 },
    { monthId: nov.id, type: "tracked", name: "Compras", icon: "🛒", color: "yellow", budgetCents: 15000, orderIndex: 3 },
    { monthId: nov.id, type: "tracked", name: "Buffer para imprevistos", icon: "🔧", color: "blue", budgetCents: 50000, orderIndex: 4 },
    { monthId: nov.id, type: "tracked", name: "Margem restante", icon: "💸", color: "orange", budgetCents: 139500, orderIndex: 5 },

    // Dezembro
    { monthId: dez.id, type: "tracked", name: "Conserto da moto", icon: "🏍️", color: "red", budgetCents: 191000, orderIndex: 0 },
    { monthId: dez.id, type: "deposit", name: "Reserva de emergência (salto)", icon: "🏦", color: "green", budgetCents: 500000, orderIndex: 1 },
    { monthId: dez.id, type: "tracked", name: "Festas / presentes / viagem", icon: "🎄", color: "yellow", budgetCents: 120000, orderIndex: 2 },
    { monthId: dez.id, type: "tracked", name: "Amortização antecipada", icon: "💳", color: "blue", budgetCents: 200000, orderIndex: 3 },
    { monthId: dez.id, type: "tracked", name: "Tablet + óculos (férias Thayla)", icon: "📱", color: "purple", budgetCents: 300000, orderIndex: 4 },
    { monthId: dez.id, type: "tracked", name: "Margem restante", icon: "💸", color: "orange", budgetCents: 474300, orderIndex: 5 },

    // Janeiro
    { monthId: jan.id, type: "deposit", name: "Reserva de emergência", icon: "🏦", color: "green", budgetCents: 0, orderIndex: 0 },
    { monthId: jan.id, type: "tracked", name: "Delivery", icon: "🍔", color: "yellow", budgetCents: 10000, orderIndex: 1 },
    { monthId: jan.id, type: "tracked", name: "Lazer", icon: "🎮", color: "yellow", budgetCents: 6000, orderIndex: 2 },
    { monthId: jan.id, type: "tracked", name: "Compras", icon: "🛒", color: "yellow", budgetCents: 4000, orderIndex: 3 },
    { monthId: jan.id, type: "tracked", name: "Buffer imprevistos", icon: "🔧", color: "blue", budgetCents: 16000, orderIndex: 4 },
    { monthId: jan.id, type: "tracked", name: "Margem restante", icon: "💸", color: "orange", budgetCents: 115000, orderIndex: 5 },

    // Fevereiro
    { monthId: fev.id, type: "deposit", name: "Reserva de emergência", icon: "🏦", color: "green", budgetCents: 150000, orderIndex: 0 },
    { monthId: fev.id, type: "tracked", name: "Delivery", icon: "🍔", color: "yellow", budgetCents: 35000, orderIndex: 1 },
    { monthId: fev.id, type: "tracked", name: "Lazer", icon: "🎮", color: "yellow", budgetCents: 25000, orderIndex: 2 },
    { monthId: fev.id, type: "tracked", name: "Compras", icon: "🛒", color: "yellow", budgetCents: 20000, orderIndex: 3 },
    { monthId: fev.id, type: "tracked", name: "Buffer imprevistos", icon: "🔧", color: "blue", budgetCents: 50000, orderIndex: 4 },
    { monthId: fev.id, type: "tracked", name: "Margem restante", icon: "💸", color: "orange", budgetCents: 207000, orderIndex: 5 },

    // Março
    { monthId: mar.id, type: "deposit", name: "Reserva de emergência", icon: "🏦", color: "green", budgetCents: 100000, orderIndex: 0 },
    { monthId: mar.id, type: "tracked", name: "Delivery", icon: "🍔", color: "yellow", budgetCents: 35000, orderIndex: 1 },
    { monthId: mar.id, type: "tracked", name: "Lazer", icon: "🎮", color: "yellow", budgetCents: 25000, orderIndex: 2 },
    { monthId: mar.id, type: "tracked", name: "Compras", icon: "🛒", color: "yellow", budgetCents: 20000, orderIndex: 3 },
    { monthId: mar.id, type: "tracked", name: "Buffer imprevistos", icon: "🔧", color: "blue", budgetCents: 50000, orderIndex: 4 },
    { monthId: mar.id, type: "tracked", name: "Margem restante", icon: "💸", color: "orange", budgetCents: 241000, orderIndex: 5 },
  ]);

  console.log("Seed concluído.");
  console.log(`Usuários criados: ${thyago.name} (@${thyago.username}), ${thayla.name} (@${thayla.username})`);
  if (!process.env.SEED_THYAGO_PASSWORD || !process.env.SEED_THAYLA_PASSWORD) {
    console.log(
      "Aviso: senhas padrão foram usadas (defina SEED_THYAGO_PASSWORD e SEED_THAYLA_PASSWORD no .env para senhas reais antes de rodar em produção).",
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
