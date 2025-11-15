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
    const seenIds = new Set<string>();
    
    console.log(`Processing ${workbook.SheetNames.length} sheets`);
    
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      let program: 'BSCS' | 'BSIT' | 'BSIS' | 'BTVTED-CSS' = 'BSCS';
      let yearLevel = 1;
      let inStudentSection = false;
      let sheetStudentCount = 0;
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        
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
        
        // End of student section - but don't stop completely, just reset flag
        if (row[0] && String(row[0]).toLowerCase().includes('hereby certify')) {
          inStudentSection = false;
          continue;
        }
        
        // Parse student rows - more flexible matching
        if (row[1]) {
          let studentNumber = String(row[1]).trim();
          
          // Check if this is a valid student number (more flexible)
          const isValidStudentNumber = /^\d{2}-?\d{6}/.test(studentNumber) || 
                                       (typeof row[1] === 'number' && String(row[1]).length >= 8) ||
                                       /^24\d{6}|25\d{6}|23\d{6}/.test(studentNumber);
          
          if (isValidStudentNumber) {
            // Clean student number - handle various formats
            studentNumber = studentNumber
              .replace(/^24-/, '24')
              .replace(/^25-/, '25')
              .replace(/^23-/, '23')
              .replace(/^22-/, '22')
              .replace(/^21-/, '21');
            
            if (studentNumber.length === 8 && !studentNumber.includes('-')) {
              studentNumber = studentNumber.slice(0, 2) + '-' + studentNumber.slice(2);
            }
            
            // Skip duplicates
            if (seenIds.has(studentNumber)) continue;
            
            // Extract name - check multiple column patterns
            let firstName = '';
            let middleName = '';
            let lastName = '';
            
            // Pattern 1: Columns 4, 5, 6 (standard format)
            if (row[4] && String(row[4]).trim()) {
              lastName = String(row[4] || '').trim();
              firstName = String(row[5] || '').trim();
              middleName = String(row[6] || '').trim();
            }
            // Pattern 2: Columns 2, 3, 4 (alternative format)
            else if (row[2] && String(row[2]).trim() && row[3] && String(row[3]).trim()) {
              lastName = String(row[2] || '').trim();
              firstName = String(row[3] || '').trim();
              middleName = String(row[4] || '').trim();
            }
            // Pattern 3: Single name column
            else if (row[2] && String(row[2]).trim()) {
              const fullNameText = String(row[2]).trim();
              const nameParts = fullNameText.split(/\s+/);
              if (nameParts.length >= 2) {
                lastName = nameParts[nameParts.length - 1];
                firstName = nameParts.slice(0, -1).join(' ');
              }
            }
            
            if (lastName && firstName) {
              const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
              
              allStudents.push({
                school_id: studentNumber,
                name: fullName,
                program: program,
                year_level: yearLevel,
                block: 'A'
              });
              
              seenIds.add(studentNumber);
              sheetStudentCount++;
            }
          }
        }
      }
      
      console.log(`Sheet "${sheetName}": ${sheetStudentCount} students (${program} Year ${yearLevel})`);
    });
    
    console.log(`Total students parsed: ${allStudents.length}`);
    return allStudents;
  } catch (error) {
    console.error('Error parsing Excel students:', error);
    throw error;
  }
}
