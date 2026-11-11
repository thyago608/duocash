Primeiro commit

## Importação de extrato por imagem

Em **Dia a dia**, escolha **Importar extrato**, envie um PNG, JPEG ou WebP de até 6 MB e revise as despesas antes de confirmar. O Tesseract.js executa a leitura no navegador, sem enviar a imagem a um serviço externo. Os arquivos de reconhecimento são servidos pelo próprio aplicativo e instalados pelo `npm install` (ou gerados com `node scripts/setup-ocr.mjs`). Não é necessária chave de API.

A identificação das transações e as categorias são sugestões baseadas em regras e histórico. Itens de natureza incerta e itens com valor igual ao de uma despesa já cadastrada aparecem desmarcados, mesmo que sejam despesas diferentes; confira também despesas que não foram reconhecidas. As despesas são cadastradas no mês selecionado, como pagas; a data identificada é exibida para conferência, mas não é salva.
