import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStatementText } from '../lib/statement-ocr.ts';

const buckets = [{ id: 'food', name: 'Delivery' }, { id: 'shopping', name: 'Compras' }];

test('associa valor, data e destinatário no extrato com valor antes dos detalhes', () => {
  const text = `Sábado - 07/11/2026
& R$35,00
Transferência Pix enviada via chave 07:36
PESSOA UM
Sexta-feira - 06/11/2026
& R$16,89
Pagamento OR Code Pix 13:02
UBER DO BRASIL
S&S R$27,99
Compra no débito 19:33
FARMACIA
& R$5,52
Pagamento OR Code Pix 11:41
IFOOD.COM
& R$100,00
Pix recebido 12:30
PESSOA DOIS`;
  const rows = parseStatementText(text, buckets, []);
  assert.deepEqual(rows.map(({ label, amountCents, date }) => ({ label, amountCents, date })), [
    { label: 'PESSOA UM', amountCents: 3500, date: '07/11/2026' },
    { label: 'UBER DO BRASIL', amountCents: 1689, date: '06/11/2026' },
    { label: 'FARMACIA', amountCents: 2799, date: '06/11/2026' },
    { label: 'IFOOD.COM', amountCents: 552, date: '06/11/2026' },
  ]);
  assert.ok(rows.every((row) => row.confirmedOutgoing));
  assert.equal(rows[2].bucketId, null);
  assert.equal(rows[3].bucketId, 'food');
});

test('mantém transação cortada como incerta e não usa texto do lançamento anterior', () => {
  const rows = parseStatementText('07/11/2026\n& R$35,00\nPagamento Pix 07:36\nPESSOA UM\n& R$25,00\nPagamento Pix 08:00', buckets, []);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].label, 'Pagamento Pix');
  assert.equal(rows[1].confirmedOutgoing, false);
});

test('mantém suporte ao formato com descrição e valor na mesma linha', () => {
  const rows = parseStatementText('10/11/2026\nPagamento iFood - R$ 55,01\nPix recebido R$ 200,00\nSaldo R$ 1.000,00\nLoja XYZ R$ 30,00', buckets, []);
  assert.deepEqual(rows.map((row) => row.amountCents), [5501, 3000]);
  assert.equal(rows[0].confirmedOutgoing, true);
  assert.equal(rows[1].confirmedOutgoing, false);
});

test('sugere as categorias solicitadas sem depender de caixa ou acentos', () => {
  const categories = [...buckets, { id: 'buffer', name: 'Buffer para imprevistos' }];
  const merchants = ['PANVEL FILIAL 542', 'Mocaccino Café', 'MUFATO', 'Muffato', 'Açaí da praça', 'ATACADÃO', 'Mercado Pago', 'mercado da esquina', 'iFood.com', 'Lanchonete da praça', 'Restaurante Central'];
  const text = merchants.map((name) => `R$ 10,00\nCompra no débito\n${name}`).join('\n');
  const history = [{ label: 'PANVEL FILIAL 542', allocationBucketId: 'shopping' }];
  const rows = parseStatementText(text, categories, history);
  assert.deepEqual(rows.map((row) => row.bucketId), ['buffer', 'buffer', 'buffer', 'buffer', 'buffer', 'buffer', 'buffer', 'buffer', 'food', 'food', 'food']);
});

test('não confunde palavra mercado no meio da descrição nem inventa categoria ausente', () => {
  const categories = [...buckets, { id: 'buffer', name: 'Buffer para imprevistos' }];
  const text = 'R$ 10,00\nCompra no débito\nPagamento no mercado\nR$ 11,00\nCompra no débito\nPANVEL';
  const rows = parseStatementText(text, categories, []);
  assert.equal(rows[0].bucketId, null);
  assert.equal(parseStatementText('R$ 11,00\nCompra no débito\nPANVEL', buckets, [])[0].bucketId, null);
});
