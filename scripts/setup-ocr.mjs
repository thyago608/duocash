import { copyFile, mkdir } from 'node:fs/promises';

await mkdir('public/ocr/core', { recursive: true });
await mkdir('public/ocr/lang', { recursive: true });
await copyFile('node_modules/tesseract.js/dist/worker.min.js', 'public/ocr/worker.min.js');
for (const variant of ['lstm', 'simd-lstm', 'relaxedsimd-lstm']) {
  await copyFile(`node_modules/tesseract.js-core/tesseract-core-${variant}.wasm.js`, `public/ocr/core/tesseract-core-${variant}.wasm.js`);
}
await copyFile('node_modules/@tesseract.js-data/por/4.0.0_best_int/por.traineddata.gz', 'public/ocr/lang/por.traineddata.gz');
