const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'assets', 'excel', 'ARCHIVO COMPLETO PROYECTO FUNDACION.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Sheets in workbook:', workbook.SheetNames);

const aiuSheet = workbook.Sheets['AIU'];
if (aiuSheet) {
  const data = XLSX.utils.sheet_to_json(aiuSheet);
  console.log('AIU rows (first 10):');
  console.log(data.slice(0, 10));
} else {
  console.log('AIU sheet not found');
}
