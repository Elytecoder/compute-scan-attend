import * as XLSX from 'xlsx';

export async function countStudentsFromExcel(filePath: string) {
  try {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    let totalStudents = 0;
    const sheetDetails: Array<{ sheetName: string; count: number; program: string; yearLevel: number }> = [];
    
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      // Find the row with "Course:" to extract program
      let program = '';
      let yearLevel = 0;
      let studentCount = 0;
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        // Extract course/program
        if (row[0] === 'Course:' && row[1]) {
          const courseText = String(row[1]);
          if (courseText.includes('BSCS')) program = 'BSCS';
          else if (courseText.includes('BSIT')) program = 'BSIT';
          else if (courseText.includes('BSIS')) program = 'BSIS';
          else if (courseText.includes('BTVTED')) program = 'BTVTED-CSS';
        }
        
        // Extract year level
        if (row[0] === 'Year Level:' && row[1]) {
          yearLevel = Number(row[1]);
        }
        
        // Count rows with student numbers (format: YYNNNNNN)
        if (row[1] && typeof row[1] === 'number' && String(row[1]).length >= 8) {
          studentCount++;
        } else if (row[1] && typeof row[1] === 'string' && /^\d{2}-?\d{6}/.test(row[1])) {
          studentCount++;
        }
      }
      
      if (studentCount > 0) {
        totalStudents += studentCount;
        sheetDetails.push({
          sheetName,
          count: studentCount,
          program,
          yearLevel
        });
      }
    });
    
    return {
      totalStudents,
      sheetDetails
    };
  } catch (error) {
    console.error('Error counting students:', error);
    throw error;
  }
}
