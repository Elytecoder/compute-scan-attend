import * as XLSX from 'xlsx';

export interface StudentRecord {
  school_id: string;
  name: string;
  program: 'BSCS' | 'BSIT' | 'BSIS' | 'BTVTED-CSS';
  year_level: number;
  block: string;
}

export async function parseExcelStudents(filePath: string): Promise<StudentRecord[]> {
  try {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    const allStudents: StudentRecord[] = [];
    
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      let program: 'BSCS' | 'BSIT' | 'BSIS' | 'BTVTED-CSS' = 'BSCS';
      let yearLevel = 1;
      let inStudentSection = false;
      
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
        
        // Check if we're in the student data section
        if (row[0] === 'No.' && row[1]?.toString().includes('Student')) {
          inStudentSection = true;
          continue;
        }
        
        // Parse student rows
        if (inStudentSection && row[1]) {
          let studentNumber = String(row[1]).trim();
          
          // Check if this is a valid student number
          if (/^\d{2}-?\d{6}/.test(studentNumber) || (typeof row[1] === 'number' && String(row[1]).length >= 8)) {
            // Clean student number
            studentNumber = studentNumber.replace(/^24-/, '24').replace(/^25-/, '25').replace(/^23-/, '23');
            if (studentNumber.length === 8 && !studentNumber.includes('-')) {
              studentNumber = studentNumber.slice(0, 2) + '-' + studentNumber.slice(2);
            }
            
            // Extract name (columns vary by format)
            let firstName = '';
            let middleName = '';
            let lastName = '';
            
            if (row[4] && row[5]) {
              // Format: Last, First, Middle in columns 4, 5, 6
              lastName = String(row[4] || '').trim();
              firstName = String(row[5] || '').trim();
              middleName = String(row[6] || '').trim();
            } else if (row[2]) {
              // Alternative format with name in single column
              const nameParts = String(row[2]).trim().split(' ');
              lastName = nameParts[0] || '';
              firstName = nameParts.slice(1).join(' ');
            }
            
            if (lastName && firstName) {
              const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
              
              allStudents.push({
                school_id: studentNumber,
                name: fullName,
                program: program,
                year_level: yearLevel,
                block: 'A' // Default block as Excel doesn't specify
              });
            }
          } else if (row[0] && String(row[0]).includes('hereby certify')) {
            // End of student section
            inStudentSection = false;
          }
        }
      }
    });
    
    return allStudents;
  } catch (error) {
    console.error('Error parsing Excel students:', error);
    throw error;
  }
}
