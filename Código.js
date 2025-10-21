// Google Apps Script for Classroom Assignment System

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Classroom Assignment System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ['Classrooms', 'Courses', 'Teachers', 'Assignments'];

  sheets.forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Add headers
      switch(sheetName) {
        case 'Classrooms':
          sheet.appendRow(['ID', 'Building', 'Floor', 'RoomNumber', 'Capacity', 'AutoAssignable']);
          break;
        case 'Courses':
          sheet.appendRow(['ID', 'Name', 'Code', 'TeacherID']);
          break;
        case 'Teachers':
          sheet.appendRow(['ID', 'Name', 'Email']);
          break;
        case 'Assignments':
          sheet.appendRow(['ID', 'CourseID', 'ClassroomID', 'Date', 'StartTime', 'EndTime', 'TeacherID']);
          break;
      }
    }
  });
}

// Utility functions
function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  data.shift(); // Remove header
  return data;
}

function addRow(sheetName, rowData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  sheet.appendRow(rowData);
}

function updateRow(sheetName, id, newData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      for (let j = 0; j < newData.length; j++) {
        sheet.getRange(i+1, j+1).setValue(newData[j]);
      }
      break;
    }
  }
}

function deleteRow(sheetName, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i+1);
      break;
    }
  }
}

// Classrooms
function getClassrooms() {
  return getSheetData('Classrooms');
}

function addClassroom(building, floor, roomNumber, capacity, autoAssignable = true) {
  const id = Utilities.getUuid();
  addRow('Classrooms', [id, building, floor, roomNumber, capacity, autoAssignable]);
  return id;
}

// Courses
function getCourses() {
  return getSheetData('Courses');
}

function addCourse(name, code, teacherID) {
  const id = Utilities.getUuid();
  addRow('Courses', [id, name, code, teacherID]);
  return id;
}

// Teachers
function getTeachers() {
  return getSheetData('Teachers');
}

function addTeacher(name, email) {
  const id = Utilities.getUuid();
  addRow('Teachers', [id, name, email]);
  return id;
}

// Assignments
function getAssignments() {
  return getSheetData('Assignments');
}

function checkConflicts(classroomID, teacherID, date, startTime, endTime, excludeID = null) {
  const assignments = getAssignments();
  for (let assignment of assignments) {
    if (excludeID && assignment[0] == excludeID) continue;
    if (assignment[3] == date) {
      const existingStart = new Date(`1970-01-01T${assignment[4]}:00`);
      const existingEnd = new Date(`1970-01-01T${assignment[5]}:00`);
      const newStart = new Date(`1970-01-01T${startTime}:00`);
      const newEnd = new Date(`1970-01-01T${endTime}:00`);
      if ((newStart < existingEnd && newEnd > existingStart)) {
        if (assignment[2] == classroomID || assignment[6] == teacherID) {
          return true; // Conflict
        }
      }
    }
  }
  return false;
}

function createAssignment(courseID, classroomID, date, startTime, endTime, teacherID) {
  if (checkConflicts(classroomID, teacherID, date, startTime, endTime)) {
    return { success: false, message: 'Conflict detected' };
  }
  const id = Utilities.getUuid();
  addRow('Assignments', [id, courseID, classroomID, date, startTime, endTime, teacherID]);
  return { success: true, id: id };
}

function updateAssignment(id, courseID, classroomID, date, startTime, endTime, teacherID) {
  if (checkConflicts(classroomID, teacherID, date, startTime, endTime, id)) {
    return { success: false, message: 'Conflict detected' };
  }
  updateRow('Assignments', id, [id, courseID, classroomID, date, startTime, endTime, teacherID]);
  return { success: true };
}

function deleteAssignment(id) {
  deleteRow('Assignments', id);
  return { success: true };
}

// Auto-assignment algorithm
function autoAssignClassroom(courseID, date, startTime, endTime) {
  const classrooms = getClassrooms();
  const course = getCourses().find(c => c[0] == courseID);
  if (!course) return { success: false, message: 'Course not found' };

  const teacherID = course[3];

  // Filter auto-assignable classrooms
  const availableClassrooms = classrooms.filter(c => c[5] === true || c[5] === 'TRUE');

  for (let classroom of availableClassrooms) {
    const classroomID = classroom[0];
    if (!checkConflicts(classroomID, teacherID, date, startTime, endTime)) {
      // Found an available classroom
      const result = createAssignment(courseID, classroomID, date, startTime, endTime, teacherID);
      if (result.success) {
        return { success: true, classroomID: classroomID, assignmentID: result.id };
      }
    }
  }

  return { success: false, message: 'No available auto-assignable classrooms found' };
}

function getAllData() {
  return {
    classrooms: getClassrooms(),
    courses: getCourses(),
    teachers: getTeachers(),
    assignments: getAssignments()
  };
}
