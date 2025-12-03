// Función principal para servir la aplicación
function doGet() {
  return HtmlService.createTemplateFromFile('Index.html').evaluate()
    .setTitle('Sistema de Asignación de Salones')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Función para incluir archivos en plantillas HTML
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Función para cargar el login
function loadLogin() {
  return HtmlService.createTemplateFromFile('Login.html').evaluate()
    .setTitle('Login - Sistema de Asignación de Salones')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .getContent();
}

// Función para cargar el dashboard
function loadDashboard() {
  return HtmlService.createTemplateFromFile('Dashboard.html').evaluate()
    .setTitle('Sistema de Asignación de Salones')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .getContent();
}

// Funciones de autenticación
function login(email, password) {
  try {
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
    const usersData = usersSheet.getDataRange().getValues();
    
    // Saltar encabezado
    for (let i = 1; i < usersData.length; i++) {
      const user = usersData[i];
      if (user[2] === email && user[3] === password && user[5] === true) {
        // Crear sesión
        const sessionId = Utilities.getUuid();
        const session = {
          userId: user[0],
          email: user[2],
          role: user[4],
          timestamp: new Date().getTime()
        };
        
        // Guardar sesión en CacheService (con expiración de 24 horas)
        const cache = CacheService.getScriptCache();
        cache.put(sessionId, JSON.stringify(session), 24 * 60 * 60); // 24 horas en segundos
        
        return { success: true, sessionId: sessionId };
      }
    }
    
    return { success: false, message: 'Credenciales inválidas o usuario inactivo' };
  } catch (error) {
    return { success: false, message: 'Error en el servidor: ' + error.message };
  }
}

function logout(sessionId) {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove(sessionId);
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Error al cerrar sesión: ' + error.message };
  }
}

function getCurrentUser(sessionId) {
  try {
    const cache = CacheService.getScriptCache();
    const sessionStr = cache.get(sessionId);
    
    if (!sessionStr) {
      return null;
    }
    
    try {
      const session = JSON.parse(sessionStr);
      // Verificar si la sesión no ha expirado
      if (new Date().getTime() - session.timestamp < 24 * 60 * 60 * 1000) {
        return session;
      } else {
        // Eliminar sesión expirada
        cache.remove(sessionId);
        return null;
      }
    } catch (e) {
      // Eliminar sesión inválida
      cache.remove(sessionId);
      return null;
    }
  } catch (error) {
    return null;
  }
}

// Funciones para obtener datos
function getAulas() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Aulas');
    return sheet.getDataRange().getValues();
  } catch (error) {
    return [];
  }
}

function getCursos() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cursos');
    return sheet.getDataRange().getValues();
  } catch (error) {
    return [];
  }
}

function getProfesores() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Profesores');
    return sheet.getDataRange().getValues();
  } catch (error) {
    return [];
  }
}

function getAsignaciones() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Asignaciones');
    return sheet.getDataRange().getValues();
  } catch (error) {
    return [];
  }
}

function getUsuarios() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
    return sheet.getDataRange().getValues();
  } catch (error) {
    return [];
  }
}

function getPermisos() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Permisos');
    return sheet.getDataRange().getValues();
  } catch (error) {
    return [];
  }
}

function getGrupos() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Grupos');
    return sheet.getDataRange().getValues();
  } catch (error) {
    return [];
  }
}

function getMaterias() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Materias');
    return sheet.getDataRange().getValues();
  } catch (error) {
    return [];
  }
}

function getHorarios() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Horarios');
    return sheet.getDataRange().getValues();
  } catch (error) {
    return [];
  }
}

// Función para obtener todos los datos
function getAllData() {
  try {
    return {
      aulas: getAulas(),
      cursos: getCursos(),
      profesores: getProfesores(),
      asignaciones: getAsignaciones(),
      usuarios: getUsuarios(),
      permisos: getPermisos(),
      grupos: getGrupos(),
      materias: getMaterias(),
      horarios: getHorarios()
    };
  } catch (error) {
    return {
      aulas: [],
      cursos: [],
      profesores: [],
      asignaciones: [],
      usuarios: [],
      permisos: [],
      grupos: [],
      materias: [],
      horarios: []
    };
  }
}

// Función para eliminar asignación
function deleteAssignment(sessionId, id) {
  try {
    // Verificar permisos
    const session = getCurrentUser(sessionId);
    if (!session || (session.role !== 'admin' && session.role !== 'editor')) {
      return { success: false, message: 'No tiene permisos para realizar esta acción' };
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Asignaciones');
    const data = sheet.getDataRange().getValues();
    
    // Saltar encabezado
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    
    return { success: false, message: 'Asignación no encontrada' };
  } catch (error) {
    return { success: false, message: 'Error al eliminar asignación: ' + error.message };
  }
}

// Función para cambiar el estado de un usuario
function toggleUserStatus(sessionId, userId, newStatus) {
  try {
    // Verificar permisos
    const session = getCurrentUser(sessionId);
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'No tiene permisos para realizar esta acción' };
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
    const data = sheet.getDataRange().getValues();
    
    // Saltar encabezado
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        sheet.getRange(i + 1, 6).setValue(newStatus);
        return { success: true };
      }
    }
    
    return { success: false, message: 'Usuario no encontrado' };
  } catch (error) {
    return { success: false, message: 'Error al cambiar estado de usuario: ' + error.message };
  }
}

// Función para resetear contraseña
function resetPassword(sessionId, userId, newPassword) {
  try {
    // Verificar permisos
    const session = getCurrentUser(sessionId);
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'No tiene permisos para realizar esta acción' };
    }
    
    // Validar contraseña
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'La contraseña debe tener al menos 6 caracteres' };
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
    const data = sheet.getDataRange().getValues();
    
    // Saltar encabezado
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        sheet.getRange(i + 1, 4).setValue(newPassword);
        return { success: true };
      }
    }
    
    return { success: false, message: 'Usuario no encontrado' };
  } catch (error) {
    return { success: false, message: 'Error al resetear contraseña: ' + error.message };
  }
}

// Función para eliminar un permiso
function deletePermission(sessionId, permissionId) {
  try {
    // Verificar permisos
    const session = getCurrentUser(sessionId);
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'No tiene permisos para realizar esta acción' };
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Permisos');
    const data = sheet.getDataRange().getValues();
    
    // Saltar encabezado
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === permissionId) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    
    return { success: false, message: 'Permiso no encontrado' };
  } catch (error) {
    return { success: false, message: 'Error al eliminar permiso: ' + error.message };
  }
}

// Inicializar hojas de cálculo
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ['Aulas', 'Cursos', 'Profesores', 'Asignaciones', 'Usuarios', 'Permisos', 'Grupos', 'Materias', 'Horarios'];
  
  sheets.forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      
      // Agregar encabezados según la hoja
      switch(sheetName) {
        case 'Aulas':
          sheet.appendRow(['ID', 'Edificio', 'Piso', 'Número', 'Capacidad', 'AutoAsignable', 'Accesible', 'Tipo']);
          break;
        case 'Cursos':
          sheet.appendRow(['ID', 'Nombre', 'Código', 'IDProfesor', 'IDMateria', 'Carrera', 'Semestre']);
          break;
        case 'Profesores':
          sheet.appendRow(['ID', 'Nombre', 'Email', 'Discapacidad', 'PisoPreferido']);
          break;
        case 'Asignaciones':
          sheet.appendRow(['ID', 'IDCurso', 'IDAula', 'Fecha', 'HoraInicio', 'HoraFin', 'IDProfesor', 'IDGrupo', 'Prioridad']);
          break;
        case 'Usuarios':
          sheet.appendRow(['ID', 'Nombre', 'Email', 'Contraseña', 'Rol', 'Activo']);
          break;
        case 'Permisos':
          sheet.appendRow(['ID', 'IDUsuario', 'Módulo', 'NivelAcceso']);
          break;
        case 'Grupos':
          sheet.appendRow(['ID', 'Número', 'Carrera', 'Semestre', 'Tamaño', 'Discapacidad']);
          break;
        case 'Materias':
          sheet.appendRow(['ID', 'Nombre', 'Código', 'Obligatoria', 'Semestre']);
          break;
        case 'Horarios':
          sheet.appendRow(['ID', 'IDCurso', 'Dia', 'HoraInicio', 'HoraFin']);
          break;
      }
    }
  });
  
  // Generar aulas predeterminadas si no existen
  const aulasSheet = ss.getSheetByName('Aulas');
  if (aulasSheet.getLastRow() === 1) {
    generarAulasPredeterminadas();
  }
  
  // Crear usuario administrador por defecto si no existe
  const usuariosSheet = ss.getSheetByName('Usuarios');
  if (usuariosSheet.getLastRow() === 1) {
    usuariosSheet.appendRow([Utilities.getUuid(), 'Camila Sanchez', 'sanchez.camila@uabc.edu.mx', 'cami123', 'admin', true]);
  }
  
  return { success: true, message: 'Hojas inicializadas correctamente' };
}

// Generar aulas predeterminadas
function generarAulasPredeterminadas() {
  const edificios = [
    { nombre: 'D', pisos: [6, 6, 6, 6] }, // 24 aulas
    { nombre: 'E', pisos: [6, 6, 6, 5] }, // 23 aulas
    { nombre: 'F', pisos: [4, 4, 4, 4] }  // 16 aulas
  ];
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Aulas');
  
  edificios.forEach(edificio => {
    edificio.pisos.forEach((aulasPiso, indicePiso) => {
      const piso = indicePiso + 1;
      for (let i = 1; i <= aulasPiso; i++) {
        const numeroAula = `${edificio.nombre}${piso}${String(i).padStart(2, '0')}`;
        // Determinar tipo de aula según el piso
        let tipo = 'Estándar';
        if (piso === 1) tipo = 'Accesible';
        else if (piso === 4) tipo = 'Laboratorio';
        
        const id = Utilities.getUuid();
        sheet.appendRow([id, edificio.nombre, piso, numeroAula, 30, true, piso === 1, tipo]);
      }
    });
  });
}

function checkSession() {
  try {
    const userProperties = PropertiesService.getUserProperties();
    const sessions = userProperties.getProperties();
    
    // Verificar si hay alguna sesión activa
    for (const sessionId in sessions) {
      try {
        const session = JSON.parse(sessions[sessionId]);
        // Verificar si la sesión no ha expirado (24 horas)
        if (new Date().getTime() - session.timestamp < 24 * 60 * 60 * 1000) {
          return true;
        } else {
          // Eliminar sesión expirada
          userProperties.deleteProperty(sessionId);
        }
      } catch (e) {
        // Eliminar sesión inválida
        userProperties.deleteProperty(sessionId);
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// Funciones para agregar datos
function addAula(sessionId, edificio, piso, numero, capacidad, autoAsignable, accesible, tipo) {
  try {
    // Verificar permisos
    const session = getCurrentUser(sessionId);
    if (!session || (session.role !== 'admin' && session.role !== 'editor')) {
      return { success: false, message: 'No tiene permisos para realizar esta acción' };
    }
    
    // Validaciones
    if (!edificio || !piso || !numero) {
      return { success: false, message: 'Todos los campos son obligatorios' };
    }
    
    if (isNaN(piso) || piso < 1 || piso > 4) {
      return { success: false, message: 'El piso debe ser un número entre 1 y 4' };
    }
    
    if (isNaN(capacidad) || capacidad < 10) {
      return { success: false, message: 'La capacidad debe ser un número mayor a 10' };
    }
    
    // Verificar que el número de aula siga el formato correcto
    const formatoEsperado = new RegExp(`^${edificio}${piso}\\d{2}$`);
    if (!formatoEsperado.test(numero)) {
      return { success: false, message: `El número de aula debe seguir el formato ${edificio}{piso}{número de dos dígitos}` };
    }
    
    // Verificar que no exista ya un aula con el mismo número
    const aulas = getAulas();
    for (let i = 1; i < aulas.length; i++) {
      if (aulas[i][3] === numero) {
        return { success: false, message: 'Ya existe un aula con ese número' };
      }
    }
    
    const id = Utilities.getUuid();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Aulas');
    sheet.appendRow([id, edificio, piso, numero, capacidad, autoAsignable, accesible, tipo]);
    return { success: true, id: id };
  } catch (error) {
    return { success: false, message: 'Error al agregar aula: ' + error.message };
  }
}

function addCurso(sessionId, nombre, codigo, idProfesor, idMateria, carrera, semestre) {
  try {
    // Verificar permisos
    const session = getCurrentUser(sessionId);
    if (!session || (session.role !== 'admin' && session.role !== 'editor')) {
      return { success: false, message: 'No tiene permisos para realizar esta acción' };
    }
    
    // Validaciones
    if (!nombre || !codigo || !idProfesor || !carrera || !semestre) {
      return { success: false, message: 'Todos los campos son obligatorios' };
    }
    
    if (isNaN(semestre) || semestre < 1 || semestre > 8) {
      return { success: false, message: 'El semestre debe ser un número entre 1 y 8' };
    }
    
    // Verificar que el profesor exista
    const profesores = getProfesores();
    let profesorExiste = false;
    for (let i = 1; i < profesores.length; i++) {
      if (profesores[i][0] === idProfesor) {
        profesorExiste = true;
        break;
      }
    }
    
    if (!profesorExiste) {
      return { success: false, message: 'El profesor seleccionado no existe' };
    }
    
    const id = Utilities.getUuid();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cursos');
    sheet.appendRow([id, nombre, codigo, idProfesor, idMateria, carrera, semestre]);
    return { success: true, id: id };
  } catch (error) {
    return { success: false, message: 'Error al agregar curso: ' + error.message };
  }
}

function addProfesor(sessionId, nombre, email, discapacidad, pisoPreferido) {
  try {
    // Verificar permisos
    const session = getCurrentUser(sessionId);
    if (!session || (session.role !== 'admin' && session.role !== 'editor')) {
      return { success: false, message: 'No tiene permisos para realizar esta acción' };
    }
    
    // Validaciones
    if (!nombre || !email) {
      return { success: false, message: 'El nombre y el email son obligatorios' };
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'El formato del email no es válido' };
    }
    
    // Verificar que no exista ya un profesor con el mismo email
    const profesores = getProfesores();
    for (let i = 1; i < profesores.length; i++) {
      if (profesores[i][2] === email) {
        return { success: false, message: 'Ya existe un profesor con ese email' };
      }
    }
    
    const id = Utilities.getUuid();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Profesores');
    sheet.appendRow([id, nombre, email, discapacidad || false, pisoPreferido || null]);
    return { success: true, id: id };
  } catch (error) {
    return { success: false, message: 'Error al agregar profesor: ' + error.message };
  }
}

function addGrupo(sessionId, numero, carrera, semestre, tamaño, discapacidad) {
  try {
    // Verificar permisos
    const session = getCurrentUser(sessionId);
    if (!session || (session.role !== 'admin' && session.role !== 'editor')) {
      return { success: false, message: 'No tiene permisos para realizar esta acción' };
    }
    
    // Validaciones
    if (!numero || !carrera || !semestre || !tamaño) {
      return { success: false, message: 'Todos los campos son obligatorios' };
    }
    
    // Validar formato de número de grupo (ej: 601, 627)
    const grupoRegex = /^\d{3}$/;
    if (!grupoRegex.test(numero)) {
      return { success: false, message: 'El número de grupo debe tener 3 dígitos' };
    }
    
    if (isNaN(semestre) || semestre < 1 || semestre > 8) {
      return { success: false, message: 'El semestre debe ser un número entre 1 y 8' };
    }
    
    if (isNaN(tamaño) || tamaño < 1) {
      return { success: false, message: 'El tamaño debe ser un número positivo' };
    }
    
    const id = Utilities.getUuid();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Grupos');
    sheet.appendRow([id, numero, carrera, semestre, tamaño, discapacidad || false]);
    return { success: true, id: id };
  } catch (error) {
    return { success: false, message: 'Error al agregar grupo: ' + error.message };
  }
}

function addMateria(sessionId, nombre, codigo, obligatoria, semestre) {
  try {
    // Verificar permisos
    const session = getCurrentUser(sessionId);
    if (!session || (session.role !== 'admin' && session.role !== 'editor')) {
      return { success: false, message: 'No tiene permisos para realizar esta acción' };
    }
    
    // Validaciones
    if (!nombre || !codigo || semestre === undefined || semestre === null) {
      return { success: false, message: 'Todos los campos son obligatorios' };
    }
    
    if (isNaN(semestre) || semestre < 1 || semestre > 8) {
      return { success: false, message: 'El semestre debe ser un número entre 1 y 8' };
    }
    
    const id = Utilities.getUuid();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Materias');
    sheet.appendRow([id, nombre, codigo, obligatoria, semestre]);
    return { success: true, id: id };
  } catch (error) {
    return { success: false, message: 'Error al agregar materia: ' + error.message };
  }
}

function createAssignment(sessionId, idCurso, idAula, fecha, horaInicio, horaFin, idProfesor, idGrupo) {
  try {
    // Verificar permisos
    const session = getCurrentUser(sessionId);
    if (!session || (session.role !== 'admin' && session.role !== 'editor')) {
      return { success: false, message: 'No tiene permisos para realizar esta acción' };
    }
    
    // Validaciones
    if (!idCurso || !idAula || !fecha || !horaInicio || !horaFin || !idProfesor) {
      return { success: false, message: 'Todos los campos son obligatorios' };
    }
    
    // Validar formato de hora (HH:MM)
    const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!horaRegex.test(horaInicio) || !horaRegex.test(horaFin)) {
      return { success: false, message: 'El formato de hora debe ser HH:MM' };
    }
    
    // Validar que hora de inicio sea anterior a hora de fin
    const inicio = new Date(`1970-01-01T${horaInicio}:00`);
    const fin = new Date(`1970-01-01T${horaFin}:00`);
    if (inicio >= fin) {
      return { success: false, message: 'La hora de inicio debe ser anterior a la hora de fin' };
    }
    
    // Validar que la fecha no sea pasada
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(fecha);
    if (fechaSeleccionada < hoy) {
      return { success: false, message: 'La fecha no puede ser pasada' };
    }
    
    // Obtener datos adicionales para validaciones
    const cursos = getCursos();
    const aulas = getAulas();
    const grupos = getGrupos();
    const profesores = getProfesores();
    
    // Buscar el curso
    let curso = null;
    for (let i = 1; i < cursos.length; i++) {
      if (cursos[i][0] === idCurso) {
        curso = cursos[i];
        break;
      }
    }
    
    if (!curso) {
      return { success: false, message: 'Curso no encontrado' };
    }
    
    // Buscar el aula
    let aula = null;
    for (let i = 1; i < aulas.length; i++) {
      if (aulas[i][0] === idAula) {
        aula = aulas[i];
        break;
      }
    }
    
    if (!aula) {
      return { success: false, message: 'Aula no encontrada' };
    }
    
    // Buscar el profesor
    let profesor = null;
    for (let i = 1; i < profesores.length; i++) {
      if (profesores[i][0] === idProfesor) {
        profesor = profesores[i];
        break;
      }
    }
    
    if (!profesor) {
      return { success: false, message: 'Profesor no encontrado' };
    }
    
    // Validaciones de accesibilidad
    if (idGrupo) {
      // Buscar el grupo
      let grupo = null;
      for (let i = 1; i < grupos.length; i++) {
        if (grupos[i][0] === idGrupo) {
          grupo = grupos[i];
          break;
        }
      }
      
      if (grupo) {
        // Asignar automáticamente primer piso a grupos con discapacidad
        if (grupo[5] && aula[2] !== 1) {
          return { success: false, message: 'Los grupos con discapacidad deben ser asignados al primer piso' };
        }
        
        // Asignar segundo piso a docentes que lo requieran
        if (profesor[3] && aula[2] !== 2) {
          return { success: false, message: 'Este profesor requiere ser asignado al segundo piso' };
        }
        
        // Bloquear asignación de grupos >40 alumnos en aulas estándar
        if (grupo[4] > 40 && aula[7] === 'Estándar') {
          return { success: false, message: 'Los grupos de más de 40 alumnos no pueden ser asignados a aulas estándar' };
        }
        
        // Validar capacidad del salón vs tamaño del grupo
        if (grupo[4] > aula[4]) {
          return { success: false, message: 'El aula no tiene capacidad suficiente para el grupo' };
        }
      }
    }
    
    // Validaciones de prioridades
    if (curso[6] <= 2 && aula[2] === 4) {
      return { success: false, message: 'Los grupos de primeros semestres no deben ser asignados al cuarto piso' };
    }
    
    if (curso[6] >= 6 && aula[2] > 2) {
      return { success: false, message: 'Los grupos de semestres avanzados deben ser asignados a los primeros pisos' };
    }
    
    // Verificar conflictos de horario
    if (verificarConflictos(idAula, idProfesor, fecha, horaInicio, horaFin)) {
      // Obtener alternativas usando Radix Sort
      const alternativas = obtenerAlternativasRadix(idCurso, fecha, horaInicio, horaFin, idProfesor);
      if (alternativas.length > 0) {
        return { 
          success: false, 
          message: 'Existe un conflicto de horario. Alternativas disponibles: ' + 
                  alternativas.map(a => `${a.edificio}${a.piso}-${a.numero}`).join(', '),
          alternativas: alternativas
        };
      } else {
        return { success: false, message: 'Existe un conflicto de horario y no hay alternativas disponibles' };
      }
    }
    
    // Determinar prioridad según curso
    const materias = getMaterias();
    let materia = null;
    for (let i = 1; i < materias.length; i++) {
      if (materias[i][0] === curso[4]) {
        materia = materias[i];
        break;
      }
    }
    
    let prioridad = 3; // Prioridad normal por defecto
    if (materia && materia[3]) { // Si es obligatoria
      prioridad = 1; // Alta prioridad
    } else if (curso[6] <= 2) { // Si es de primeros semestres
      prioridad = 2; // Prioridad media-alta
    }
    
    const id = Utilities.getUuid();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Asignaciones');
    sheet.appendRow([id, idCurso, idAula, fecha, horaInicio, horaFin, idProfesor, idGrupo || null, prioridad]);
    return { success: true, id: id };
  } catch (error) {
    return { success: false, message: 'Error al crear asignación: ' + error.message };
  }
}

function addUsuario(sessionId, nombre, email, password, rol) {
  try {
    // Verificar permisos
    const session = getCurrentUser(sessionId);
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'No tiene permisos para realizar esta acción' };
    }
    
    // Validaciones
    if (!nombre || !email || !password || !rol) {
      return { success: false, message: 'Todos los campos son obligatorios' };
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'El formato del email no es válido' };
    }
    
    // Validar rol
    const rolesValidos = ['admin', 'editor', 'viewer'];
    if (!rolesValidos.includes(rol)) {
      return { success: false, message: 'Rol no válido' };
    }
    
    // Verificar que no exista ya un usuario con el mismo email
    const usuarios = getUsuarios();
    for (let i = 1; i < usuarios.length; i++) {
      if (usuarios[i][2] === email) {
        return { success: false, message: 'Ya existe un usuario con ese email' };
      }
    }
    
    const id = Utilities.getUuid();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
    sheet.appendRow([id, nombre, email, password, rol, true]);
    return { success: true, id: id };
  } catch (error) {
    return { success: false, message: 'Error al agregar usuario: ' + error.message };
  }
}

function addPermission(sessionId, idUsuario, modulo, nivelAcceso) {
  try {
    // Verificar permisos
    const session = getCurrentUser(sessionId);
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'No tiene permisos para realizar esta acción' };
    }
    
    // Validaciones
    if (!idUsuario || !modulo || !nivelAcceso) {
      return { success: false, message: 'Todos los campos son obligatorios' };
    }
    
    // Validar módulo
    const modulosValidos = ['aulas', 'cursos', 'profesores', 'asignaciones', 'grupos', 'materias', 'usuarios'];
    if (!modulosValidos.includes(modulo)) {
      return { success: false, message: 'Módulo no válido' };
    }
    
    // Validar nivel de acceso
    const nivelesValidos = ['lectura', 'escritura', 'administrador'];
    if (!nivelesValidos.includes(nivelAcceso)) {
      return { success: false, message: 'Nivel de acceso no válido' };
    }
    
    const id = Utilities.getUuid();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Permisos');
    sheet.appendRow([id, idUsuario, modulo, nivelAcceso]);
    return { success: true, id: id };
  } catch (error) {
    return { success: false, message: 'Error al agregar permiso: ' + error.message };
  }
}

// Función para verificar conflictos de horario
function verificarConflictos(idAula, idProfesor, fecha, horaInicio, horaFin, excluirId = null) {
  try {
    const asignaciones = getAsignaciones();
    
    // Saltar encabezado
    for (let i = 1; i < asignaciones.length; i++) {
      const asignacion = asignaciones[i];
      
      // Omitir la asignación actual si se está editando
      if (excluirId && asignacion[0] === excluirId) continue;
      
      // Verificar si es la misma fecha
      if (asignacion[3] === fecha) {
        // Convertir horas a objetos Date para comparar
        const inicioExistente = new Date(`1970-01-01T${asignacion[4]}:00`);
        const finExistente = new Date(`1970-01-01T${asignacion[5]}:00`);
        const inicioNuevo = new Date(`1970-01-01T${horaInicio}:00`);
        const finNuevo = new Date(`1970-01-01T${horaFin}:00`);
        
        // Verificar solapamiento
        if (inicioNuevo < finExistente && finNuevo > inicioExistente) {
          // Verificar conflicto de aula o profesor
          if (asignacion[2] === idAula || asignacion[6] === idProfesor) {
            return true; // Hay conflicto
          }
        }
      }
    }
    
    return false; // No hay conflictos
  } catch (error) {
    return false;
  }
}

// Función para auto-asignar aula usando Radix Sort
function autoAssignClassroom(sessionId, idCurso, fecha, horaInicio, horaFin) {
  try {
    // Verificar permisos
    const session = getCurrentUser(sessionId);
    if (!session || (session.role !== 'admin' && session.role !== 'editor')) {
      return { success: false, message: 'No tiene permisos para realizar esta acción' };
    }
    
    const cursos = getCursos();
    const profesores = getProfesores();
    const aulas = getAulas();
    
    // Buscar el curso
    let curso = null;
    for (let i = 1; i < cursos.length; i++) {
      if (cursos[i][0] === idCurso) {
        curso = cursos[i];
        break;
      }
    }
    
    if (!curso) {
      return { success: false, message: 'Curso no encontrado' };
    }
    
    // Obtener ID del profesor
    const idProfesor = curso[3];
    
    // Filtrar aulas auto-asignables
    const aulasDisponibles = [];
    for (let i = 1; i < aulas.length; i++) {
      if (aulas[i][5] === true || aulas[i][5] === 'TRUE') {
        aulasDisponibles.push({
          id: aulas[i][0],
          edificio: aulas[i][1],
          piso: aulas[i][2],
          numero: aulas[i][3],
          capacidad: aulas[i][4],
          accesible: aulas[i][6],
          tipo: aulas[i][7]
        });
      }
    }
    
    // Ordenar aulas por capacidad usando Radix Sort
    const aulasOrdenadas = radixSortPorCapacidad(aulasDisponibles);
    
    // Buscar un aula disponible según prioridades
    for (const aula of aulasOrdenadas) {
      // Validaciones de accesibilidad
      if (curso[6] <= 2 && aula.piso === 4) {
        continue; // Saltar aulas de 4to piso para grupos de primeros semestres
      }
      
      if (curso[6] >= 6 && aula.piso > 2) {
        continue; // Saltar aulas de pisos altos para grupos de semestres avanzados
      }
      
      // Verificar si no hay conflictos
      if (!verificarConflictos(aula.id, idProfesor, fecha, horaInicio, horaFin)) {
        // Asignar el aula
        return createAssignment(sessionId, idCurso, aula.id, fecha, horaInicio, horaFin, idProfesor);
      }
    }
    
    return { success: false, message: 'No hay aulas disponibles para el horario solicitado' };
  } catch (error) {
    return { success: false, message: 'Error al auto-asignar aula: ' + error.message };
  }
}

// Función para obtener alternativas usando Radix Sort
function obtenerAlternativasRadix(idCurso, fecha, horaInicio, horaFin, idProfesor) {
  try {
    const cursos = getCursos();
    const aulas = getAulas();
    
    // Buscar el curso
    let curso = null;
    for (let i = 1; i < cursos.length; i++) {
      if (cursos[i][0] === idCurso) {
        curso = cursos[i];
        break;
      }
    }
    
    if (!curso) {
      return [];
    }
    
    // Filtrar aulas disponibles
    const aulasDisponibles = [];
    for (let i = 1; i < aulas.length; i++) {
      // Verificar si no hay conflictos
      if (!verificarConflictos(aulas[i][0], idProfesor, fecha, horaInicio, horaFin)) {
        // Calcular prioridad según criterios
        let prioridad = 3; // Prioridad normal por defecto
        
        // Priorizar aulas de primer piso para grupos de primeros semestres
        if (curso[6] <= 2 && aulas[i][2] === 1) {
          prioridad = 1;
        }
        // Priorizar aulas de segundo piso para grupos de semestres avanzados
        else if (curso[6] >= 6 && aulas[i][2] === 2) {
          prioridad = 1;
        }
        // Priorizar aulas accesibles si hay discapacidad
        else if (aulas[i][6]) {
          prioridad = 2;
        }
        
        aulasDisponibles.push({
          id: aulas[i][0],
          edificio: aulas[i][1],
          piso: aulas[i][2],
          numero: aulas[i][3],
          capacidad: aulas[i][4],
          prioridad: prioridad
        });
      }
    }
    
    // Ordenar alternativas por prioridad usando Radix Sort
    return radixSortPorPrioridad(aulasDisponibles);
  } catch (error) {
    return [];
  }
}

// Implementación de Radix Sort para ordenar por capacidad
function radixSortPorCapacidad(aulas) {
  if (!aulas || aulas.length === 0) {
    return [];
  }
  
  // Encontrar el valor máximo para determinar el número de dígitos
  let maxCapacidad = 0;
  for (const aula of aulas) {
    if (aula.capacidad > maxCapacidad) {
      maxCapacidad = aula.capacidad;
    }
  }
  
  // Aplicar Radix Sort
  const ordenado = [...aulas];
  
  // Para cada dígito (de menos a más significativo)
  for (let exp = 1; Math.floor(maxCapacidad / exp) > 0; exp *= 10) {
    const buckets = Array(10).fill().map(() => []);
    
    // Colocar elementos en buckets según el dígito actual
    for (const aula of ordenado) {
      const digito = Math.floor(aula.capacidad / exp) % 10;
      buckets[digito].push(aula);
    }
    
    // Reconstruir el array ordenado
    let i = 0;
    for (const bucket of buckets) {
      for (const aula of bucket) {
        ordenado[i++] = aula;
      }
    }
  }
  
  return ordenado;
}

// Implementación de Radix Sort para ordenar por prioridad
function radixSortPorPrioridad(aulas) {
  if (!aulas || aulas.length === 0) {
    return [];
  }
  
  // Encontrar el valor máximo para determinar el número de dígitos
  let maxPrioridad = 0;
  for (const aula of aulas) {
    if (aula.prioridad > maxPrioridad) {
      maxPrioridad = aula.prioridad;
    }
  }
  
  // Aplicar Radix Sort
  const ordenado = [...aulas];
  
  // Para cada dígito (de menos a más significativo)
  for (let exp = 1; Math.floor(maxPrioridad / exp) > 0; exp *= 10) {
    const buckets = Array(10).fill().map(() => []);
    
    // Colocar elementos en buckets según el dígito actual
    for (const aula of ordenado) {
      const digito = Math.floor(aula.prioridad / exp) % 10;
      buckets[digito].push(aula);
    }
    
    // Reconstruir el array ordenado
    let i = 0;
    for (const bucket of buckets) {
      for (const aula of bucket) {
        ordenado[i++] = aula;
      }
    }
  }
  
  return ordenado;
}
