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
        }
      }
    }
    
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

