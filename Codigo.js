<<<<<<< HEAD
// Code.gs - Sistema de Gestión de Edificios Escolares
// ID de la hoja: 1uPRGQCqu8eQ8F6Yaszx6khMrrvdIAJUY8A0IPjjJ4Xw

// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================

const CONFIG = {
  SPREADSHEET_ID: "1uPRGQCqu8eQ8F6Yaszx6khMrrvdIAJUY8A0IPjjJ4Xw",
  SHEET_NAME: "Data",
  CACHE_DURATION: 3600,
  TOKEN_SECRET: "SISTEMA_GESTION_UABC_2024",
  BASE_URL: "https://script.google.com/a/macros/uabc.edu.mx/s/AKfycbzwwMfWjDz7NjKAz889gJivvmgOsj1Qqi2vxpo5K8eXWUQ6lTrs_qQTxmcI6Dx9Dps/exec"
};

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================

/**
 * Punto de entrada principal
 */
function doGet(e) {
  const page = e?.parameter?.page || 'login';

  try {
    if (page === 'login') {
      return serveLoginPage();
    } else if (page === 'principal') {
      return servePrincipalPage();
    } else {
      return serveIndexPage();
    }
  } catch (error) {
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error - Sistema de Gestión</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>Error del Sistema</h1>
          <p>Ha ocurrido un error al cargar la página.</p>
          <p><a href="${CONFIG.BASE_URL}">Volver al inicio</a></p>
        </div>
      </body>
      </html>
    `);
  }
}

/**
 * Sirve la página de índice principal
 */
function serveIndexPage() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Sistema de Gestión de Edificios Escolares - UABC')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Sirve la página de login
 */
function serveLoginPage() {
  return HtmlService.createTemplateFromFile('Login')
    .evaluate()
    .setTitle('Inicio de Sesión - Sistema de Gestión')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Sirve la página principal
 */
function servePrincipalPage() {
  return HtmlService.createTemplateFromFile('Principal')
    .evaluate()
    .setTitle('Gestión de Edificios - UABC')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ============================================
// FUNCIONES PARA INCLUIR ARCHIVOS
// ============================================

/**
 * Incluye contenido de archivos HTML
 */
function include(filename) {
  try {
    const htmlContent = HtmlService.createHtmlOutputFromFile(filename).getContent();

    // Extraer contenido entre <body> y </body> para evitar HTML anidado
    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      return bodyMatch[1];
    } else {
      // Si no encuentra body, devolver el contenido completo (para compatibilidad)
      return htmlContent;
    }
  } catch (error) {
    console.error(`Error al incluir ${filename}:`, error);
    return `<div style="color: red;">Error al cargar: ${filename}</div>`;
  }
}

/**
 * Obtiene los estilos CSS
 */
function getStyles() {
  try {
    // Obtener el contenido del archivo Estilos
    const styles = HtmlService.createHtmlOutputFromFile('Estilos').getContent();
    
    // Si el archivo Estilos.html contiene etiquetas <style>, extraer solo el contenido
    const styleMatch = styles.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      return styleMatch[1];
    }
    
    // Si no tiene etiquetas style, devolver el contenido completo
    return styles;
  } catch (error) {
    console.error('Error al obtener los estilos:', error);
    
    // Estilos por defecto en caso de error
    return `
      :root {
        --negro: #121212;
        --verde-oscuro: #2E7D32;
        --verde-medio: #4CAF50;
        --blanco: #FFFFFF;
      }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, var(--negro) 0%, var(--verde-oscuro) 100%);
        color: var(--blanco);
        margin: 0;
        padding: 0;
      }
      
      .loader {
        border: 5px solid #f3f3f3;
        border-top: 5px solid var(--verde-medio);
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
  }
}

/**
 * Obtiene los scripts JavaScript
 */
function getScripts() {
  try {
    return HtmlService.createHtmlOutputFromFile('Scripts').getContent();
  } catch (error) {
    console.error('Error al obtener los scripts:', error);
    return '// Error al cargar scripts';
  }
}

/**
 * Obtiene la URL base de la aplicación
 */
function getBaseUrl() {
  return ScriptApp.getService().getUrl();
}

// ============================================
// FUNCIONES DE AUTENTICACIÓN (existentes)
// ============================================

function autenticarUsuario(userId, password) {
  try {
    // Normalizar el ID de entrada
    const normalizedInputId = normalizarId(userId);
    
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      return { success: false, message: "Error del sistema. Hoja no encontrada." };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const idIndex = headers.indexOf("ID");
    const nombreIndex = headers.indexOf("Nombre");
    const emailIndex = headers.indexOf("Email");
    const passwordIndex = headers.indexOf("Contraseña");
    const rolIndex = headers.indexOf("Rol");
    const activoIndex = headers.indexOf("Activo");
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const idUsuario = row[idIndex];
      const contrasena = row[passwordIndex];
      const activo = row[activoIndex];
      
      // Normalizar el ID de la base de datos
      const normalizedDbId = normalizarId(idUsuario);
      
      // Comparar IDs normalizados
      if (normalizedDbId === normalizedInputId && contrasena === password) {
        if (activo === true || activo === "TRUE" || activo === "true") {
          const usuario = {
            id: idUsuario, // Mantener ID original para consistencia
            nombre: row[nombreIndex],
            email: row[emailIndex],
            rol: row[rolIndex],
            esAdmin: row[rolIndex].toLowerCase() === 'admin'
          };
          
          const token = crearTokenSesion(usuario.id);
          
          return {
            success: true,
            message: "Autenticación exitosa",
            user: usuario,
            token: token,
            loadingTime: Date.now()
          };
        } else {
          return { success: false, message: "Usuario inactivo." };
=======
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
>>>>>>> d9feaf4ee6633431209033f3f5ac8d99446cacf9
        }
      }
    }
    
<<<<<<< HEAD
    return { success: false, message: "ID o contraseña incorrectos." };
    
  } catch (error) {
    console.error("Error en autenticación:", error);
    return { success: false, message: "Error del sistema: " + error.toString() };
  }
}

function crearTokenSesion(userId) {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substring(7);
  const token = Utilities.base64Encode(userId + "|" + timestamp + "|" + random);
  
  const cache = CacheService.getScriptCache();
  cache.put("session_" + token, userId, CONFIG.CACHE_DURATION);
  
  return token;
}

function validarSesion(token) {
  try {
    const cache = CacheService.getScriptCache();
    const userId = cache.get("session_" + token);
    
    if (!userId) {
      return { valid: false, message: "Sesión expirada o inválida" };
    }
    
    cache.put("session_" + token, userId, CONFIG.CACHE_DURATION);
    
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const idIndex = headers.indexOf("ID");
    const nombreIndex = headers.indexOf("Nombre");
    const emailIndex = headers.indexOf("Email");
    const rolIndex = headers.indexOf("Rol");
    const activoIndex = headers.indexOf("Activo");
    
    // Normalizar el ID de la sesión
    const normalizedSessionId = normalizarId(userId);
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const normalizedDbId = normalizarId(row[idIndex]);
      
      if (normalizedDbId === normalizedSessionId && (row[activoIndex] === true || row[activoIndex] === "TRUE")) {
        return {
          valid: true,
          user: {
            id: row[idIndex], // Mantener ID original
            nombre: row[nombreIndex],
            email: row[emailIndex],
            rol: row[rolIndex]
          }
        };
      }
    }
    
    return { valid: false, message: "Usuario no encontrado o inactivo" };
    
  } catch (error) {
    console.error("Error validando sesión:", error);
    return { valid: false, message: "Error del sistema" };
  }
}

function cerrarSesion(token) {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove("session_" + token);
    return { success: true, message: "Sesión cerrada exitosamente" };
  } catch (error) {
    console.error("Error cerrando sesión:", error);
    return { success: false, message: "Error cerrando sesión" };
  }
}

function obtenerRolUsuario(userId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const idIndex = headers.indexOf("ID");
    const rolIndex = headers.indexOf("Rol");
    
    // Normalizar el ID de entrada
    const normalizedInputId = normalizarId(userId);
    
    for (let i = 1; i < data.length; i++) {
      const normalizedDbId = normalizarId(data[i][idIndex]);
      
      if (normalizedDbId === normalizedInputId) {
        return data[i][rolIndex];
      }
    }
    
    return "user"; // default role
  } catch (error) {
    console.error("Error obteniendo rol del usuario:", error);
    return "user";
  }
}

// ============================================
// FUNCIONES DE USUARIOS (existentes)
// ============================================

function obtenerUsuarios() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) throw new Error("No se encontró la hoja 'Data'");
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const usuarios = [];
    
    const idIndex = headers.indexOf("ID");
    const nombreIndex = headers.indexOf("Nombre");
    const emailIndex = headers.indexOf("Email");
    const rolIndex = headers.indexOf("Rol");
    const activoIndex = headers.indexOf("Activo");
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      usuarios.push({
        id: row[idIndex],
        nombre: row[nombreIndex],
        email: row[emailIndex],
        rol: row[rolIndex],
        activo: row[activoIndex]
      });
    }
    
    return usuarios;
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    throw error;
  }
}

function agregarUsuario(usuario) {
  try {
    if (!usuario.nombre || !usuario.email || !usuario.rol) {
      return { success: false, message: "Nombre, email y rol son obligatorios" };
    }
    
    // Validar ID personalizado si se proporciona
    if (usuario.id) {
      if (!validarFormatoId(usuario.id)) {
        return { success: false, message: "El formato del ID personalizado no es válido. Use solo letras, números, guiones, guiones bajos y espacios." };
      }
    }
    
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const emailIndex = headers.indexOf("Email");
    const idIndex = headers.indexOf("ID");
    
    // Normalizar el email para comparación
    const normalizedEmail = usuario.email.toLowerCase().trim();
    
    // Verificar que el email no esté registrado
    for (let i = 1; i < data.length; i++) {
      const existingEmail = String(data[i][emailIndex]).toLowerCase().trim();
      if (existingEmail === normalizedEmail) {
        return { success: false, message: "El email ya está registrado" };
      }
    }
    
    // Verificar que el ID no esté duplicado (si se proporciona custom ID)
    if (usuario.id) {
      const normalizedInputId = normalizarId(usuario.id);
      for (let i = 1; i < data.length; i++) {
        const normalizedDbId = normalizarId(data[i][idIndex]);
        if (normalizedDbId === normalizedInputId) {
          return { success: false, message: "El ID ya está registrado" };
        }
      }
    }
    
    // Usar ID personalizado si se proporciona, sino generar UUID
    const nuevoId = usuario.id || Utilities.getUuid();
    const contrasenaTemporal = usuario.nombre.substring(0, 4).toLowerCase() + "123";
    
    const nuevaFila = [
      nuevoId,
      usuario.nombre,
      usuario.email,
      contrasenaTemporal,
      usuario.rol,
      true
    ];
    
    sheet.appendRow(nuevaFila);
    
    return {
      success: true,
      message: "Usuario agregado exitosamente",
      id: nuevoId,
      contrasenaTemporal: contrasenaTemporal
    };
    
  } catch (error) {
    console.error("Error agregando usuario:", error);
    return { success: false, message: "Error del sistema: " + error.toString() };
  }
}

function actualizarUsuario(id, datos) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const idIndex = headers.indexOf("ID");
    const nombreIndex = headers.indexOf("Nombre");
    const emailIndex = headers.indexOf("Email");
    const rolIndex = headers.indexOf("Rol");
    const activoIndex = headers.indexOf("Activo");
    const contrasenaIndex = headers.indexOf("Contraseña");
    
    // Normalizar el ID de entrada para búsqueda
    const normalizedInputId = normalizarId(id);
    
    for (let i = 1; i < data.length; i++) {
      const normalizedDbId = normalizarId(data[i][idIndex]);
      
      if (normalizedDbId === normalizedInputId) {
        const fila = i + 1;
        
        if (datos.nombre !== undefined) {
          sheet.getRange(fila, nombreIndex + 1).setValue(datos.nombre);
        }
        
        if (datos.email !== undefined) {
          const normalizedNewEmail = datos.email.toLowerCase().trim();
          for (let j = 1; j < data.length; j++) {
            const existingEmail = String(data[j][emailIndex]).toLowerCase().trim();
            if (j !== i && existingEmail === normalizedNewEmail) {
              return { success: false, message: "El email ya está registrado en otro usuario" };
            }
          }
          sheet.getRange(fila, emailIndex + 1).setValue(datos.email);
        }
        
        if (datos.rol !== undefined) {
          sheet.getRange(fila, rolIndex + 1).setValue(datos.rol);
        }
        
        if (datos.activo !== undefined) {
          sheet.getRange(fila, activoIndex + 1).setValue(datos.activo);
        }
        
        if (datos.contrasena !== undefined && datos.contrasena !== "") {
          sheet.getRange(fila, contrasenaIndex + 1).setValue(datos.contrasena);
        }
        
        return { success: true, message: "Usuario actualizado exitosamente" };
      }
    }
    
    return { success: false, message: "Usuario no encontrado" };
    
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return { success: false, message: "Error del sistema: " + error.toString() };
  }
}

function eliminarUsuario(id) {
  return actualizarUsuario(id, { activo: false });
}

function restablecerContrasena(id) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const idIndex = headers.indexOf("ID");
    const nombreIndex = headers.indexOf("Nombre");
    const emailIndex = headers.indexOf("Email");
    const contrasenaIndex = headers.indexOf("Contraseña");
    
    // Normalizar el ID de entrada para búsqueda
    const normalizedInputId = normalizarId(id);
    
    for (let i = 1; i < data.length; i++) {
      const normalizedDbId = normalizarId(data[i][idIndex]);
      
      if (normalizedDbId === normalizedInputId) {
        const fila = i + 1;
        const nombre = data[i][nombreIndex];
        const email = data[i][emailIndex];
        const nuevaContrasena = generarContrasenaTemporal();
        
        sheet.getRange(fila, contrasenaIndex + 1).setValue(nuevaContrasena);
        
        return {
          success: true,
          message: "Contraseña restablecida exitosamente",
          contrasenaTemporal: nuevaContrasena
        };
      }
    }
    
    return { success: false, message: "Usuario no encontrado" };
    
  } catch (error) {
    console.error("Error restableciendo contraseña:", error);
    return { success: false, message: "Error del sistema: " + error.toString() };
  }
}

// ============================================
// FUNCIONES DE NORMALIZACIÓN DE ID
// ============================================

/**
 * Normaliza un ID para comparación consistente
 * @param {string} id - ID a normalizar
 * @returns {string} ID normalizado
 */
function normalizarId(id) {
  if (!id) return '';
  
  // Convertir a string si no lo es
  let normalized = String(id);
  
  // Convertir a minúsculas
  normalized = normalized.toLowerCase();
  
  // Eliminar espacios al inicio y final
  normalized = normalized.trim();
  
  // Eliminar caracteres de retorno de carro y nueva línea
  normalized = normalized.replace(/[\r\n]/g, '');
  
  // Reemplazar múltiples espacios con uno solo
  normalized = normalized.replace(/\s+/g, ' ');
  
  return normalized;
}

/**
 * Valida si un ID tiene el formato correcto
 * @param {string} id - ID a validar
 * @returns {boolean} True si es válido
 */
function validarFormatoId(id) {
  if (!id || typeof id !== 'string') return false;
  
  // Eliminar espacios para la validación
  const cleanId = id.trim();
  
  // Verificar longitud mínima
  if (cleanId.length < 1) return false;
  
  // Verificar longitud máxima (opcional, ajustar según necesidades)
  if (cleanId.length > 50) return false;
  
  // Permitir letras, números, guiones, guiones bajos y espacios
  const idPattern = /^[a-zA-Z0-9_\-\s]+$/;
  
  return idPattern.test(cleanId);
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function generarContrasenaTemporal() {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const longitud = 8;
  let contrasena = "";
  
  for (let i = 0; i < longitud; i++) {
    contrasena += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  
  return contrasena;
}

function obtenerEstadisticas() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    const data = sheet.getDataRange().getValues();
    const totalUsuarios = data.length - 1;
    
    const activosIndex = data[0].indexOf("Activo");
    let usuariosActivos = 0;
    let usuariosAdmin = 0;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][activosIndex] === true || data[i][activosIndex] === "TRUE") {
        usuariosActivos++;
      }
      
      const rolIndex = data[0].indexOf("Rol");
      if (data[i][rolIndex] === "admin") {
        usuariosAdmin++;
      }
    }
    
    const fechaUltimaActualizacion = new Date().toLocaleString();
    
    return {
      success: true,
      estadisticas: {
        totalUsuarios: totalUsuarios,
        usuariosActivos: usuariosActivos,
        usuariosAdmin: usuariosAdmin,
        fechaUltimaActualizacion: fechaUltimaActualizacion
      }
    };
    
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return { success: false, message: "Error obteniendo estadísticas" };
  }
}

function testConexion() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      return "ERROR: No se encontró la hoja 'Data'";
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Verificar que tenga las columnas necesarias
    const requiredColumns = ["ID", "Nombre", "Email", "Contraseña", "Rol", "Activo"];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      return `ERROR: La hoja 'Data' no tiene las columnas requeridas. Faltan: ${missingColumns.join(', ')}`;
    }
    
    return "Conexión exitosa. Total de registros: " + (data.length - 1);
  } catch (error) {
    return "ERROR: " + error.toString();
  }
}

// ============================================
// NUEVAS FUNCIONES PARA EDIFICIOS
// ============================================

function obtenerEdificios() {
  try {
    const edificios = {
      "D": {
        nombre: "Edificio D",
        pisos: 4,
        totalSalones: 24,
        salones: {
          "1": ["D101", "D102", "D103", "D104", "D105", "D106"],
          "2": ["D201", "D202", "D203", "D204", "D205", "D206"],
          "3": ["D301", "D302", "D303", "D304", "D305", "D306"],
          "4": ["D401", "D402", "D403", "D404", "D405", "D406"]
        }
      },
      "E": {
        nombre: "Edificio E",
        pisos: 4,
        totalSalones: 23,
        salones: {
          "1": ["E101", "E102", "E103", "E104", "E105", "E106"],
          "2": ["E201", "E202", "E203", "E204", "E205", "E206"],
          "3": ["E301", "E302", "E303", "E304", "E305", "E306"],
          "4": ["E401", "E402", "E403", "E404", "E405"]
        }
      },
      "F": {
        nombre: "Edificio F",
        pisos: 4,
        totalSalones: 16,
        salones: {
          "1": ["F101", "F102", "F103", "F104"],
          "2": ["F201", "F202", "F203", "F204"],
          "3": ["F301", "F302", "F303", "F304"],
          "4": ["F401", "F402", "F403", "F404"]
        }
      }
    };
    
    return { success: true, edificios: edificios };
  } catch (error) {
    console.error("Error obteniendo edificios:", error);
    return { success: false, message: "Error obteniendo datos de edificios" };
  }
}

function obtenerEstadoSalon(salonId) {
  try {
    const estadosSalones = {
      "D101": { estado: "ocupado", grupos: [{ nombre: "Matemáticas Avanzadas", horario: "Lunes 8:00 - 10:00", profesor: "Dr. García" }] },
      "D102": { estado: "ocupado", grupos: [{ nombre: "Química Orgánica", horario: "Martes 10:00 - 12:00", profesor: "M.Sc. Rodríguez" }] },
      "E101": { estado: "ocupado", grupos: [{ nombre: "Álgebra Lineal", horario: "Lunes 10:00 - 12:00", profesor: "Lic. Pérez" }] },
      "E102": { estado: "ocupado", grupos: [{ nombre: "Cálculo Diferencial", horario: "Martes 8:00 - 10:00", profesor: "Dra. Gómez" }] },
      "F101": { estado: "ocupado", grupos: [{ nombre: "Ingeniería Civil", horario: "Lunes 9:00 - 11:00", profesor: "Arq. Pérez" }] },
      "E405": { estado: "ocupado", grupos: [{ nombre: "Química Orgánica", horario: "Martes 10:00 - 12:00", profesor: "M.Sc. Rodríguez" }] }
    };
    
    if (estadosSalones[salonId]) {
      return { success: true, salon: salonId, estado: estadosSalones[salonId] };
    } else {
      return { success: true, salon: salonId, estado: { estado: "disponible", grupos: [] } };
    }
  } catch (error) {
    console.error("Error obteniendo estado del salón:", error);
    return { success: false, message: "Error obteniendo estado del salón" };
  }
}

// ============================================
// FUNCIÓN DE PRUEBA PARA ID SYSTEM
// ============================================

/**
 * Función de prueba para verificar el sistema de IDs personalizados
 * @returns {object} Resultado de las pruebas
 */
function probarSistemaIds() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const idIndex = headers.indexOf("ID");
    if (idIndex === -1) {
      return { success: false, message: "No se encontró la columna ID" };
    }
    
    const results = {
      success: true,
      totalUsuarios: data.length - 1,
      idsEncontrados: [],
      problemasDetectados: [],
      normalizacionTests: []
    };
    
    // Probar normalización con algunos IDs reales
    for (let i = 1; i < Math.min(data.length, 6); i++) {
      const originalId = data[i][idIndex];
      const normalizedId = normalizarId(originalId);
      
      results.normalizacionTests.push({
        original: String(originalId),
        normalizado: normalizedId,
        longitudOriginal: String(originalId).length,
        longitudNormalizada: normalizedId.length
      });
      
      results.idsEncontrados.push({
        fila: i + 1,
        id: originalId,
        normalizado: normalizedId,
        nombre: data[i][headers.indexOf("Nombre")]
      });
    }
    
    // Verificar duplicados (después de normalización)
    const idsNormalizados = results.idsEncontrados.map(u => u.normalizado);
    const duplicados = idsNormalizados.filter((id, index) => idsNormalizados.indexOf(id) !== index);
    
    if (duplicados.length > 0) {
      results.problemasDetectados.push("IDs duplicados encontrados después de normalización");
    }
    
    // Verificar formatos inválidos
    for (const usuario of results.idsEncontrados) {
      if (!validarFormatoId(usuario.id)) {
        results.problemasDetectados.push(`ID con formato inválido: "${usuario.id}"`);
      }
    }
    
    return results;
    
  } catch (error) {
    return { success: false, message: "Error probando sistema de IDs: " + error.toString() };
  }
}

=======
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
>>>>>>> d9feaf4ee6633431209033f3f5ac8d99446cacf9
