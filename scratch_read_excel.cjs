const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'assets', 'excel', 'ARCHIVO COMPLETO PROYECTO FUNDACION.xlsx');
console.log('Reading file:', filePath);

try {
  const workbook = XLSX.readFile(filePath);
  console.log('Sheet Names:', workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== SHEET: ${sheetName} ===`);
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    // Print first 8 rows
    json.slice(0, 10).forEach((row, i) => {
      console.log(`Row ${i}:`, row);
    });
  });
} catch (err) {
  console.error('Error reading excel:', err);
}
