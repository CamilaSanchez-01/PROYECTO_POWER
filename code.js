/**
 * Code.gs - Sistema de Gestión de Edificios Escolares UABC
 * Archivo principal del servidor para Google Apps Script
 * 
 * Versión: 2.0
 * Runtime: V8 (ECMAScript 6+)
 */

// ============================================
// CONFIGURACIÓN CENTRALIZADA
// ============================================

const CONFIG = {
  SPREADSHEET_ID: "1SVNaVYqKfmW2sQxGuDdUSieEy3gdokNJgDWHJTOQL8w",
  SHEET_NAME: "Data",
  CACHE_DURATION: 3600,
  TOKEN_SECRET: "SISTEMA_GESTION_UABC_2024",
  BASE_URL: "https://script.google.com/a/macros/uabc.edu.mx/s/AKfycbzwwMfWjDz7NjKAz889gJivvmgOsj1Qqi2vxpo5K8eXWUQ6lTrs_qQTxmcI6Dx9Dps/exec",

  // Configuración de edificios
  edificios: {
    D: { nombre: "Edificio D", pisos: 4, salonesPorPiso: [6, 6, 6, 6] },
    E: { nombre: "Edificio E", pisos: 4, salonesPorPiso: [6, 6, 6, 5] },
    F: { nombre: "Edificio F", pisos: 4, salonesPorPiso: [4, 4, 4, 4] }
  },

  // Configuración de validación
  validaciones: {
    accesibilidad: { habilitado: true, pisoRequerido: 1, mensaje: "ACCESIBILIDAD: El grupo requiere un salón en primer piso" },
    capacidad: { habilitado: true, margenExceso: 0, mensaje: "CAPACIDAD: El grupo excede la capacidad del salón" },
    prioridadPiso: {
      habilitado: true,
      reglas: [
        { semestres: [1, 2], pisoPreferido: 4, obligatorio: true },
        { semestres: [6, 7, 8], pisoMaximo: 2, obligatorio: true }
      ],
      mensaje: "PRIORIDAD_PISO: Los grupos de {semestre}° semestre deben asignarse al {piso} piso"
    },
    distanciaEdificios: { habilitado: true, edificioPreferido: 'F', pesoDistancia: 0.1 }
  },

  // Configuración de prioridades
  prioridades: {
    orden: ['prioritarios', 'semestre', 'tamano', 'dias'],
    semestre: { orden: 'ascendente' },
    tamano: { orden: 'descendente' },
    gruposPrioritarios: []
  }
};

// ============================================
// CLASES DEL MODELO DE DATOS
// ============================================

class Salon {
  constructor(id, edificio, piso, capacidad, accesible = false) {
    this.id = id;
    this.edificio = edificio;
    this.piso = piso;
    this.capacidad = capacidad;
    this.accesible = accesible;
    this.horariosOcupados = [];
    this.grupoAsignadoFijo = null;
  }

  estaDisponible(horario, dia) {
    return !this.horariosOcupados.some(h =>
      h.dia === dia && this.horariosSeSuperponen(h.horario, horario)
    );
  }

  horariosSeSuperponen(horario1, horario2) {
    const inicio1 = this.convertirHoraAMinutos(horario1.horaInicio);
    const fin1 = this.convertirHoraAMinutos(horario1.horaFin);
    const inicio2 = this.convertirHoraAMinutos(horario2.horaInicio);
    const fin2 = this.convertirHoraAMinutos(horario2.horaFin);
    return inicio1 < fin2 && fin1 > inicio2;
  }

  convertirHoraAMinutos(hora) {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  ocupar(dia, horario, grupoId) {
    const existe = this.horariosOcupados.some(h =>
      h.dia === dia &&
      h.horario.horaInicio === horario.horaInicio &&
      h.horario.horaFin === horario.horaFin
    );
    if (!existe) {
      this.horariosOcupados.push({ dia, horario, grupoId });
    }
  }
}

class Grupo {
  constructor(id, carrera, semestre, numero, cantidadAlumnos, tieneDiscapacidad = false) {
    this.id = id;
    this.carrera = carrera;
    this.semestre = semestre;
    this.numero = numero;
    this.cantidadAlumnos = cantidadAlumnos;
    this.tieneDiscapacidad = tieneDiscapacidad;
    this.salonAsignado = null;
  }
}

class Horario {
  constructor(horaInicio, horaFin) {
    this.horaInicio = horaInicio;
    this.horaFin = horaFin;
  }
}

class Clase {
  constructor(datos) {
    this.idUnico = datos.id_unico || datos.id || Utilities.getUuid();
    this.codigoAsignatura = datos.codigo_asignatura || datos.codigo || '';
    this.nombreAsignatura = datos.nombre_asignatura || datos.nombre || '';
    this.maestro = datos.maestro || datos.profesor || '';
    this.edificioActual = datos.edificio || '';
    this.salonActual = datos.salon || '';
    this.capacidadRequerida = parseInt(datos.capacidad) || 0;
    this.grupoId = datos.grupo || '';
    this.diaSemana = datos.dia_semana || datos.dia || '';
    this.horaInicio = datos.hora_inicio || datos.inicio || '';
    this.horaFin = datos.hora_fin || datos.fin || '';
    this.duracionMin = parseInt(datos.duracion_min) || 0;
    this.modalidad = datos.modalidad || 'Presencial';
    this.tipo = datos.tipo || 'normal';
    this.extraerInfoGrupo();
  }

  extraerInfoGrupo() {
    if (this.grupoId && this.grupoId !== 'VIR' && this.grupoId.length >= 3) {
      const mapaCarrera = { '2': 200, '3': 300, '4': 400, '5': 500, '6': 600, '9': 900 };
      this.carrera = mapaCarrera[this.grupoId[0]] || parseInt(this.grupoId[0]) * 100;
      const s = parseInt(this.grupoId[1]);
      const n = parseInt(this.grupoId[2]);
      this.semestre = Number.isInteger(s) ? s : null;
      this.numeroGrupo = Number.isInteger(n) ? n : null;
    } else {
      this.carrera = null;
      this.semestre = null;
      this.numeroGrupo = null;
    }
  }
}

// ============================================
// CLASES DE LÓGICA DE NEGOCIO
// ============================================

class SistemaAsignacion {
  constructor() {
    this.salones = [];
    this.grupos = new Map();
    this.clases = [];
    this.clasesLaboratorio = [];
    this.clasesVirtuales = [];
    this.asignaciones = [];
    this.errores = [];
    this.gruposDivididos = new Map();
  }

  inicializarSalones() {
    const config = {
      'D': { pisos: 4, salonesPorPiso: [6, 6, 6, 6] },
      'E': { pisos: 4, salonesPorPiso: [6, 6, 6, 5] },
      'F': { pisos: 4, salonesPorPiso: [4, 4, 4, 4] }
    };

    for (const [edificio, cfg] of Object.entries(config)) {
      for (let piso = 1; piso <= cfg.pisos; piso++) {
        const cantidad = cfg.salonesPorPiso[piso - 1];
        for (let i = 1; i <= cantidad; i++) {
          const id = `${edificio}-${piso}${i.toString().padStart(2, '0')}`;
          const accesible = piso === 1;
          this.salones.push(new Salon(id, edificio, piso, 40, accesible));
        }
      }
    }
  }

  esMateriaLaboratorio(clase) {
    const materiasLab = {
      'TroncoComun': { 1: ["38973"], 2: ["38982"] },
      'LIN': {
        3: ["38984", "39038", "39039", "39040", "39041", "39042"],
        4: ["39043", "39044", "39047", "50600", "50601"],
        5: ["39048", "39049", "39050", "39051", "39058"],
        6: ["39056", "39052", "13595"],
        7: ["39060", "39062", "39061", "39063", "50602"],
        8: ["39067", "39068", "39076", "39083", "39088"]
      },
      'LC': { 6: ["39025"], 7: ["39009"], 8: ["39014"] },
      'LAE': { 4: ["40309"] }
    };

    if (!clase.semestre) return null;
    if (materiasLab.TroncoComun[clase.semestre]?.includes(clase.codigoAsignatura)) return 'Tronco Común';
    if (materiasLab.LIN[clase.semestre]?.includes(clase.codigoAsignatura)) return 'LIN';
    if (materiasLab.LC[clase.semestre]?.includes(clase.codigoAsignatura)) return 'LC';
    if (materiasLab.LAE[clase.semestre]?.includes(clase.codigoAsignatura)) return 'LAE';
    return null;
  }

  procesarClase(clase) {
    const tipoLaboratorio = this.esMateriaLaboratorio(clase);
    if (tipoLaboratorio) {
      this.clasesLaboratorio.push({ clase, tipo: tipoLaboratorio });
    } else if (clase.modalidad === 'Virtual') {
      this.clasesVirtuales.push({ clase, mensaje: 'Clase virtual' });
    } else {
      this.clases.push(clase);
      if (!this.grupos.has(clase.grupoId)) {
        this.grupos.set(clase.grupoId, new Grupo(
          clase.grupoId, clase.carrera, clase.semestre,
          clase.numeroGrupo, clase.capacidadRequerida
        ));
      } else {
        const grupo = this.grupos.get(clase.grupoId);
        if (clase.capacidadRequerida > grupo.cantidadAlumnos) {
          grupo.cantidadAlumnos = clase.capacidadRequerida;
        }
      }
    }
  }

  procesarArchivosCSV(contenidos) {
    for (const contenido of contenidos) {
      const datos = this.parsearCSV(contenido);
      for (const fila of datos) {
        try {
          const clase = new Clase(fila);
          this.procesarClase(clase);
        } catch (e) {
          this.errores.push({ clase: fila, mensaje: e.message });
        }
      }
    }
  }

  procesarMultiplesArchivos(archivos) {
    // Método para procesar archivos de Google Drive
    const contenidos = [];
    try {
      for (const archivo of archivos) {
        const contenido = archivo.getBlob().getDataAsString();
        contenidos.push(contenido);
      }
      this.procesarArchivosCSV(contenidos);
      return { exito: true, mensaje: `${contenidos.length} archivos procesados` };
    } catch (error) {
      return { exito: false, mensaje: error.message };
    }
  }

  parsearCSV(contenido) {
    const lineas = contenido.split('\n').filter(l => l.trim() !== '');
    if (lineas.length === 0) return [];

    const encabezados = lineas[0].split(',').map(h => h.trim().toLowerCase());
    const datos = [];

    for (let i = 1; i < lineas.length; i++) {
      const valores = lineas[i].split(',').map(v => v.trim());
      const fila = {};
      encabezados.forEach((enc, idx) => {
        fila[enc] = valores[idx] || '';
      });
      datos.push(fila);
    }
    return datos;
  }

  generarReporte() {
    return {
      resumen: {
        totalClases: this.clases.length + this.clasesVirtuales.length + this.clasesLaboratorio.length,
        clasesPresenciales: this.clases.length,
        clasesVirtuales: this.clasesVirtuales.length,
        clasesLaboratorio: this.clasesLaboratorio.length,
        asignadas: this.asignaciones.length,
        errores: this.errores.length,
        gruposDivididos: this.gruposDivididos.size
      },
      asignaciones: this.asignaciones,
      errores: this.errores,
      laboratorio: this.clasesLaboratorio,
      virtuales: this.clasesVirtuales,
      gruposDivididos: Array.from(this.gruposDivididos.entries())
    };
  }

  ordenarClasesConPrioridades(gruposPrioritarios = []) {
    // Ordenar clases por prioridad: grupos prioritarios primero, luego por semestre
    this.clases.sort((a, b) => {
      // Primero grupos prioritarios
      const aEsPrioritario = gruposPrioritarios.includes(a.grupoId);
      const bEsPrioritario = gruposPrioritarios.includes(b.grupoId);
      if (aEsPrioritario && !bEsPrioritario) return -1;
      if (!aEsPrioritario && bEsPrioritario) return 1;

      // Luego por semestre
      if (a.semestre !== b.semestre) {
        return (a.semestre || 0) - (b.semestre || 0);
      }

      // Luego por grupo
      return a.grupoId.localeCompare(b.grupoId);
    });
    return this.clases;
  }
}

class AsignadorAutomatico {
  constructor(sistema, gruposPrioritarios = []) {
    this.sistema = sistema;
    this.gruposPrioritarios = Array.isArray(gruposPrioritarios) ? gruposPrioritarios : [];
    this.gruposDivididos = new Map();
  }

  asignarSalones() {
    const gruposUnicos = [...new Set(this.sistema.clases.map(c => c.grupoId))].sort((a, b) => {
      const aTemprano = this.grupoTieneHorarioTemprano(a);
      const bTemprano = this.grupoTieneHorarioTemprano(b);
      if (aTemprano && !bTemprano) return -1;
      if (!aTemprano && bTemprano) return 1;

      const aPrioritario = this.gruposPrioritarios.includes(a);
      const bPrioritario = this.gruposPrioritarios.includes(b);
      if (aPrioritario && !bPrioritario) return -1;
      if (!aPrioritario && bPrioritario) return 1;

      const grupoA = this.sistema.grupos.get(a);
      const grupoB = this.sistema.grupos.get(b);
      if (grupoA && grupoB && grupoA.semestre !== grupoB.semestre) {
        return grupoA.semestre - grupoB.semestre;
      }
      return a.localeCompare(b);
    });

    for (const grupoId of gruposUnicos) {
      const grupo = this.sistema.grupos.get(grupoId);
      const horariosOcupados = this.calcularHorariosOcupadosPorGrupo(grupoId);
      if (horariosOcupados.length === 0) continue;

      let salon = this.buscarSalonDisponibleParaHorarios(grupo, horariosOcupados);
      if (salon) {
        this.asignarSalonAGrupo(grupo, salon, horariosOcupados);
      } else {
        const asignacionDividida = this.intentarAsignacionDividida(grupo, horariosOcupados);
        if (!asignacionDividida) {
          const clasesGrupo = this.sistema.clases.filter(c => c.grupoId === grupoId);
          clasesGrupo.forEach(clase => {
            this.sistema.errores.push({ clase, mensaje: 'No hay salones disponibles' });
          });
        }
      }
    }

    // Agregar clases de laboratorio
    this.sistema.clasesLaboratorio.forEach(item => {
      this.sistema.asignaciones.push({
        clase: item.clase,
        salon: null,
        bloque: 'Laboratorio',
        mensaje: `Laboratorio: ${item.tipo}`
      });
    });
  }

  grupoTieneHorarioTemprano(grupoId) {
    const clasesGrupo = this.sistema.clases.filter(c => c.grupoId === grupoId);
    return clasesGrupo.some(c => ['07:00', '08:00', '09:00'].includes(c.horaInicio));
  }

  calcularHorariosOcupadosPorGrupo(grupoId) {
    const clasesPresenciales = this.sistema.clases.filter(c => c.grupoId === grupoId);
    const horariosOcupados = [];
    clasesPresenciales.forEach(clase => {
      horariosOcupados.push({ dia: clase.diaSemana, horario: new Horario(clase.horaInicio, clase.horaFin) });
    });
    return horariosOcupados;
  }

  buscarSalonDisponibleParaHorarios(grupo, horariosOcupados) {
    let salonesCandidatos = this.sistema.salones.filter(salon => {
      for (const horarioInfo of horariosOcupados) {
        if (!this.salonDisponibleEnBloque(salon, grupo, horarioInfo.horario, horarioInfo.dia)) {
          return false;
        }
      }
      return true;
    });

    if (salonesCandidatos.length === 0) return null;

    if (this.gruposPrioritarios.includes(grupo.id)) {
      const salonesPiso1 = salonesCandidatos.filter(s => s.piso === 1);
      if (salonesPiso1.length > 0) {
        salonesCandidatos = salonesPiso1;
      }
    }

    salonesCandidatos.sort((a, b) => {
      const ajusteA = Math.abs(a.capacidad - grupo.cantidadAlumnos);
      const ajusteB = Math.abs(b.capacidad - grupo.cantidadAlumnos);
      if (ajusteA !== ajusteB) return ajusteA - ajusteB;
      return a.piso - b.piso;
    });

    return salonesCandidatos[0];
  }

  salonDisponibleEnBloque(salon, grupo, horario, dia) {
    if (salon.capacidad < grupo.cantidadAlumnos) return false;
    return salon.estaDisponible(horario, dia);
  }

  asignarSalonAGrupo(grupo, salon, horariosOcupados) {
    const diasHorarios = new Set(horariosOcupados.map(h => h.dia));
    const clasesGrupo = this.sistema.clases.filter(c => c.grupoId === grupo.id && diasHorarios.has(c.diaSemana));

    clasesGrupo.forEach(clase => {
      clase.salonActual = salon.id;
      clase.edificioActual = salon.edificio;
      this.sistema.asignaciones.push({
        clase,
        salon,
        bloque: 'Asignado',
        mensaje: `${clase.nombreAsignatura} en ${salon.id}`
      });
    });

    horariosOcupados.forEach(horarioInfo => {
      salon.ocupar(horarioInfo.dia, horarioInfo.horario, grupo.id);
    });
    salon.grupoAsignadoFijo = grupo.id;
  }

  intentarAsignacionDividida(grupo, horariosOcupados) {
    const diasUnicos = [...new Set(horariosOcupados.map(h => h.dia))].sort();
    if (diasUnicos.length < 2) return false;

    const puntoDivision = Math.floor(diasUnicos.length / 2);
    const diasPrimera = diasUnicos.slice(0, puntoDivision);
    const diasSegunda = diasUnicos.slice(puntoDivision);

    const horariosPrimera = horariosOcupados.filter(h => diasPrimera.includes(h.dia));
    const horariosSegunda = horariosOcupados.filter(h => diasSegunda.includes(h.dia));

    const salonPrimera = this.buscarSalonDisponibleParaHorarios(grupo, horariosPrimera);
    const salonSegunda = this.buscarSalonDisponibleParaHorarios(grupo, horariosSegunda);

    if (salonPrimera && salonSegunda) {
      this.asignarSalonAGrupo(grupo, salonPrimera, horariosPrimera);
      this.asignarSalonAGrupo(grupo, salonSegunda, horariosSegunda);
      this.gruposDivididos.set(grupo.id, {
        salones: [salonPrimera, salonSegunda],
        dias: { [salonPrimera.id]: diasPrimera, [salonSegunda.id]: diasSegunda }
      });
      return true;
    }
    return false;
  }
}

// ============================================
// FUNCIÓN PRINCIPAL DE ENTRADA (doGet)
// ============================================

function doGet(e) {
  const page = e?.parameter?.page || 'login';

  try {
    if (page === 'login') {
      return serveLoginPage();
    } else if (page === 'principal') {
      return servePrincipalPage();
    } else if (page === 'asignacion') {
      return serveAsignacionPage();
    } else {
      return serveIndexPage();
    }
  } catch (error) {
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1 style="color: #d32f2f;">Error del Sistema</h1>
        <p>${error.message}</p>
      </body>
      </html>
    `);
  }
}

// ============================================
// FUNCIONES DE SERVICIO DE PÁGINAS
// ============================================

function serveIndexPage() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Sistema de Gestión - UABC')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function serveLoginPage() {
  return HtmlService.createTemplateFromFile('Login')
    .evaluate()
    .setTitle('Inicio de Sesión - UABC')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function servePrincipalPage() {
  return HtmlService.createTemplateFromFile('Principal')
    .evaluate()
    .setTitle('Gestión de Edificios - UABC')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function serveAsignacionPage() {
  return HtmlService.createTemplateFromFile('AsignacionSalones')
    .evaluate()
    .setTitle('Asignación de Salones - UABC')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ============================================
// FUNCIONES AUXILIARES PARA HTML
// ============================================

function include(filename) {
  try {
    const htmlContent = HtmlService.createHtmlOutputFromFile(filename).getContent();
    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return bodyMatch ? bodyMatch[1] : htmlContent;
  } catch (error) {
    console.error(`Error al incluir ${filename}:`, error);
    return `<div style="color: red;">Error al cargar: ${filename}</div>`;
  }
}

function getBaseUrl() {
  return ScriptApp.getService().getUrl();
}

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

function autenticarUsuario(userId, password) {
  try {
    const normalizedInputId = String(userId).toLowerCase().trim();

    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      return { success: false, message: "Error: Hoja 'Data' no encontrada." };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const idIndex = headers.indexOf("ID");
    const nombreIndex = headers.indexOf("Nombre");
    const emailIndex = headers.indexOf("Email");
    const passwordIndex = headers.indexOf("Contraseña");
    const rolIndex = headers.indexOf("Rol");
    const activoIndex = headers.indexOf("Activo");

    if (idIndex === -1 || passwordIndex === -1) {
      return { success: false, message: "Error: Columnas requeridas no encontradas." };
    }

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const idUsuario = String(row[idIndex] || '').toLowerCase().trim();
      const contrasena = String(row[passwordIndex] || '');
      const activo = row[activoIndex];

      if (idUsuario === normalizedInputId && contrasena === password) {
        if (activo === true || activo === "TRUE" || activo === "true") {
          const usuario = {
            id: row[idIndex],
            nombre: row[nombreIndex],
            email: row[emailIndex],
            rol: row[rolIndex],
            esAdmin: String(row[rolIndex]).toLowerCase() === 'admin'
          };

          const token = crearTokenSesion(usuario.id);
          return { success: true, message: "Autenticación exitosa", user: usuario, token: token };
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

    const normalizedSessionId = String(userId).toLowerCase().trim();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const normalizedDbId = String(row[idIndex] || '').toLowerCase().trim();

      if (normalizedDbId === normalizedSessionId && (row[activoIndex] === true || row[activoIndex] === "TRUE")) {
        return {
          valid: true,
          user: { id: row[idIndex], nombre: row[nombreIndex], email: row[emailIndex], rol: row[rolIndex] }
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
    return { success: false, message: "Error cerrando sesión" };
  }
}

/**
 * Obtiene la lista de todos los usuarios registrados en la hoja 'Data'
 * @returns {Object} Lista de usuarios y estado de la operación
 */
function obtenerUsuarios() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      return { success: false, message: "Error: Hoja 'Data' no encontrada." };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const idIndex = headers.indexOf("ID");
    const nombreIndex = headers.indexOf("Nombre");
    const emailIndex = headers.indexOf("Email");
    const rolIndex = headers.indexOf("Rol");
    const activoIndex = headers.indexOf("Activo");

    if (idIndex === -1 || nombreIndex === -1) {
      return { success: false, message: "Error: Estructura de la hoja de usuarios no es válida." };
    }

    const usuarios = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Solo agregamos usuarios que tengan un ID válido
      if (row[idIndex]) {
        usuarios.push({
          id: String(row[idIndex]),
          nombre: row[nombreIndex],
          email: row[emailIndex] || '',
          rol: row[rolIndex] || 'usuario',
          activo: row[activoIndex] === true || String(row[activoIndex]).toLowerCase() === 'true'
        });
      }
    }

    return { success: true, usuarios: usuarios };

  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return { success: false, message: "Error del sistema: " + error.toString() };
  }
}

/**
 * Actualiza los datos de un usuario en la hoja 'Data'
 * @param {Object} userData Datos del usuario a actualizar
 * @returns {Object} Estado de la operación
 */
function actualizarUsuario(userData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      return { success: false, message: "Error: Hoja 'Data' no encontrada." };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf("ID");
    const nombreIndex = headers.indexOf("Nombre");
    const emailIndex = headers.indexOf("Email");
    const rolIndex = headers.indexOf("Rol");

    const idABuscar = String(userData.id).toLowerCase().trim();
    let filaEncontrada = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIndex]).toLowerCase().trim() === idABuscar) {
        filaEncontrada = i + 1; // +1 porque las filas en Sheets son Base-1 y los arreglos Base-0
        break;
      }
    }

    if (filaEncontrada === -1) {
      return { success: false, message: "Usuario no encontrado." };
    }

    // Actualizar los campos (excepto el ID)
    if (nombreIndex !== -1) sheet.getRange(filaEncontrada, nombreIndex + 1).setValue(userData.nombre);
    if (emailIndex !== -1) sheet.getRange(filaEncontrada, emailIndex + 1).setValue(userData.email);
    if (rolIndex !== -1) sheet.getRange(filaEncontrada, rolIndex + 1).setValue(userData.rol);

    return { success: true, message: "Usuario actualizado correctamente." };

  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return { success: false, message: "Error del sistema: " + error.toString() };
  }
}

/**
 * Cambia el estado (activo/inactivo) de un usuario en la hoja 'Data'
 * @param {string} id ID del usuario
 * @param {boolean} nuevoEstado Nuevo estado (true para activo, false para inactivo)
 * @returns {Object} Estado de la operación
 */
function cambiarEstadoUsuario(id, nuevoEstado) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      return { success: false, message: "Error: Hoja 'Data' no encontrada." };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf("ID");
    const activoIndex = headers.indexOf("Activo");

    if (idIndex === -1 || activoIndex === -1) {
      return { success: false, message: "Error: Estructura de la hoja no válida." };
    }

    const idABuscar = String(id).toLowerCase().trim();
    let filaEncontrada = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIndex]).toLowerCase().trim() === idABuscar) {
        filaEncontrada = i + 1;
        break;
      }
    }

    if (filaEncontrada === -1) {
      return { success: false, message: "Usuario no encontrado." };
    }

    sheet.getRange(filaEncontrada, activoIndex + 1).setValue(nuevoEstado);

    const accion = nuevoEstado ? "activado" : "desactivado";
    return { success: true, message: `Usuario ${accion} correctamente.` };

  } catch (error) {
    console.error("Error cambiando estado de usuario:", error);
    return { success: false, message: "Error del sistema: " + error.toString() };
  }
}

/**
 * Crea un nuevo usuario en la hoja 'Data'
 * @param {Object} userData Datos del nuevo usuario
 * @returns {Object} Estado de la operación
 */
function crearUsuario(userData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      return { success: false, message: "Error: Hoja 'Data' no encontrada." };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf("ID");
    const nombreIndex = headers.indexOf("Nombre");
    const emailIndex = headers.indexOf("Email");
    const rolIndex = headers.indexOf("Rol");
    const activoIndex = headers.indexOf("Activo");
    const passwordIndex = headers.indexOf("Password"); // Por si acaso existe

    // Verificar si el ID ya existe
    const idNuevo = String(userData.id).toLowerCase().trim();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIndex]).toLowerCase().trim() === idNuevo) {
        return { success: false, message: "Error: El ID o Matrícula ya existe en el sistema." };
      }
    }

    // Preparar fila
    const newRow = new Array(headers.length).fill("");
    if (idIndex !== -1) newRow[idIndex] = userData.id;
    if (nombreIndex !== -1) newRow[nombreIndex] = userData.nombre;
    if (emailIndex !== -1) newRow[emailIndex] = userData.email;
    if (rolIndex !== -1) newRow[rolIndex] = userData.rol;
    if (activoIndex !== -1) newRow[activoIndex] = true;

    // Contraseña inicial simple (sería mejor si el sistema la manejara de otra forma)
    if (passwordIndex !== -1) newRow[passwordIndex] = "123456";

    sheet.appendRow(newRow);

    return { success: true, message: "Usuario creado correctamente." };

  } catch (error) {
    console.error("Error creando usuario:", error);
    return { success: false, message: "Error del sistema: " + error.toString() };
  }
}


// ============================================
// FUNCIONES DE EDIFICIOS Y SALONES
// ============================================

function obtenerEdificios() {
  try {
    const edificios = {};

    for (const [key, cfg] of Object.entries(CONFIG.edificios)) {
      const salones = {};
      for (let piso = 1; piso <= cfg.pisos; piso++) {
        const cantidad = cfg.salonesPorPiso[piso - 1];
        salones[piso.toString()] = [];
        for (let i = 1; i <= cantidad; i++) {
          salones[piso.toString()].push(`${key}${piso}${i.toString().padStart(2, '0')}`);
        }
      }

      edificios[key] = {
        nombre: cfg.nombre,
        pisos: cfg.pisos,
        totalSalones: cfg.salonesPorPiso.reduce((a, b) => a + b, 0),
        salones: salones
      };
    }

    return { success: true, edificios: edificios };
  } catch (error) {
    console.error("Error obteniendo edificios:", error);
    return { success: false, message: error.toString() };
  }
}

function obtenerEstadoSalon(salonId) {
  // Función mock - en producción conectaría a base de datos
  return {
    success: true,
    salon: salonId,
    estado: { estado: "disponible", grupos: [] }
  };
}

// ============================================
// FUNCIÓN PRINCIPAL DE PROCESAMIENTO Y ASIGNACIÓN
// ============================================

/**
 * Procesa archivos CSV y asigna salones a las clases
 * @param {string[]} contenidosCSV - Array de contenidos CSV como strings
 * @param {string[]} gruposPrioritarios - Array de IDs de grupos prioritarios
 * @returns {Object} Resultado del procesamiento
 */
function procesarArchivosYAsignar(contenidosCSV, gruposPrioritarios) {
  try {
    // 1. Crear sistema y procesar archivos
    const sistema = new SistemaAsignacion();
    sistema.inicializarSalones();
    sistema.procesarArchivosCSV(contenidosCSV);

    // 2. Asignar salones
    const asignador = new AsignadorAutomatico(sistema, gruposPrioritarios || []);
    asignador.asignarSalones();

    // 3. Generar reporte
    const reporte = sistema.generarReporte();

    // 4. Preparar respuesta
    return {
      exito: true,
      mensaje: `Procesamiento completado. ${sistema.asignaciones.length} clases asignadas.`,
      reporte: reporte,
      datosSalones: sistema.salones,
      datosAsignaciones: sistema.asignaciones,
      gruposDivididos: asignador.gruposDivididos.size > 0 ?
        Object.fromEntries(asignador.gruposDivididos) : null,
      gruposDetectados: [...new Set(sistema.clases.map(c => c.grupoId))].sort()
    };

  } catch (error) {
    console.error("Error en procesamiento:", error);
    return { exito: false, mensaje: error.toString() };
  }
}

// ============================================
// MENÚ PERSONALIZADO
// ============================================

function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('Sistema de Salones')
      .addItem('Abrir Panel', 'showSidebar')
      .addItem('Procesar Archivos', 'showFilePicker')
      .addToUi();
  } catch (e) {
    // Puede fallar si no hay UI disponible (ej. en trigger)
    console.log("No se pudo crear el menú: " + e.message);
  }
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('MainInterface')
    .setTitle('Sistema de Asignación de Salones')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

// ============================================
// PRUEBAS Y DIAGNÓSTICO
// ============================================

function testConexion() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      return "ERROR: No se encontró la hoja 'Data'";
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const requiredColumns = ["ID", "Nombre", "Email", "Contraseña", "Rol", "Activo"];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
      return `ERROR: Faltan columnas: ${missingColumns.join(', ')}`;
    }

    return "Conexión exitosa. Total de registros: " + (data.length - 1);
  } catch (error) {
    return "ERROR: " + error.toString();
  }
}

function testSistema() {
  return {
    status: "OK",
    message: "Sistema funcionando correctamente",
    runtime: "V8",
    timestamp: new Date().toISOString()
  };
}


// ============================================
// PERSISTENCIA DE ESTADO EN EL SERVIDOR
// ============================================

/**
 * Guarda el estado de la asignación en una hoja dedicada
 * @param {Object} datos - Objeto con el estado completo
 * @returns {Object} Resultado de la operación
 */
function guardarEstadoAsignacion(datos) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName("SystemState");

    if (!sheet) {
      sheet = spreadsheet.insertSheet("SystemState");
      sheet.appendRow(["Timestamp", "JSON_Data"]);
      // Ocultar hoja para evitar confusiones al usuario
      sheet.hideSheet();
    }

    const jsonString = JSON.stringify(datos);
    const timestamp = new Date().toISOString();

    // Limpiar hoja antes de guardar el nuevo estado (solo mantenemos el último)
    sheet.getRange(2, 1, sheet.getLastRow(), 2).clearContent();

    // Google Sheets tiene un límite de 50,000 caracteres por celda.
    // Si los datos exceden este límite, avisar o dividir.
    if (jsonString.length > 50000) {
      console.warn("Advertencia: El tamaño de los datos excede el límite de celda. Se guardará truncado o fallará.");
    }

    sheet.getRange(2, 1).setValue(timestamp);
    sheet.getRange(2, 2).setValue(jsonString);

    return { success: true, message: "Estado guardado en el servidor correctamente" };
  } catch (error) {
    console.error("Error guardando estado en servidor:", error);
    return { success: false, message: "Error al guardar en servidor: " + error.toString() };
  }
}

/**
 * Recupera el último estado de asignación guardado en el servidor
 * @returns {Object} Datos del estado o null
 */
function obtenerEstadoAsignacion() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName("SystemState");

    if (!sheet || sheet.getLastRow() < 2) {
      return { success: false, message: "No hay datos guardados en el servidor" };
    }

    const jsonData = sheet.getRange(2, 2).getValue();
    const datos = JSON.parse(jsonData);

    return { success: true, datos: datos };
  } catch (error) {
    console.error("Error cargando estado desde servidor:", error);
    return { success: false, message: "Error al cargar desde servidor: " + error.toString() };
  }
}

// ============================================
// EXPORTACIÓN PARA APPS SCRIPT
// ============================================

// Exponer clases y funciones al scope global de Apps Script
if (typeof globalThis !== 'undefined') {
  globalThis.Salon = Salon;
  globalThis.Grupo = Grupo;
  globalThis.Horario = Horario;
  globalThis.Clase = Clase;
  globalThis.SistemaAsignacion = SistemaAsignacion;
  globalThis.AsignadorAutomatico = AsignadorAutomatico;
  globalThis.procesarArchivosYAsignar = procesarArchivosYAsignar;
  globalThis.CONFIG = CONFIG;
  globalThis.testConexion = testConexion;
  globalThis.testSistema = testSistema;
  globalThis.guardarEstadoAsignacion = guardarEstadoAsignacion;
  globalThis.obtenerEstadoAsignacion = obtenerEstadoAsignacion;
  globalThis.guardarHorariosEnSheet = guardarHorariosEnSheet;
  globalThis.obtenerEstadisticasDashboard = obtenerEstadisticasDashboard;
  globalThis.guardarResultadosAsignacion = guardarResultadosAsignacion;
  globalThis.obtenerResultadosAsignacion = obtenerResultadosAsignacion;
}

/**
 * Guarda los datos del CSV en una pestaña específica de Google Sheets
 * @param {Object[]} datos - Array de objetos del CSV
 * @returns {Object} Resultado de la operación
 */
function guardarHorariosEnSheet(datos) {
  try {
    if (!datos || !Array.isArray(datos) || datos.length === 0) {
      return { success: false, message: "No hay datos para guardar" };
    }

    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheetName = "Horarios_CSV";
    let sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    } else {
      sheet.clear();
    }

    // Obtener todos los encabezados únicos de los objetos
    const headers = [...new Set(datos.reduce((acc, obj) => acc.concat(Object.keys(obj)), []))];

    // Preparar matriz de datos para volcar masivamente (mejor performance)
    const values = [headers];
    datos.forEach(row => {
      values.push(headers.map(header => row[header] || ""));
    });

    // Guardar en la hoja
    sheet.getRange(1, 1, values.length, headers.length).setValues(values);

    // Aplicar formato básico
    sheet.getRange(1, 1, 1, headers.length).setBackground("#4CAF50").setFontColor("#FFFFFF").setFontWeight("bold");
    sheet.setFrozenRows(1);

    // Forzar actualización inmediata para asegurar persistencia
    SpreadsheetApp.flush();

    return { success: true, message: `Se guardaron ${datos.length} registros en la hoja ${sheetName}` };
  } catch (error) {
    console.error("Error guardando horarios en Sheet:", error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Guarda los resultados de la asignación en una nueva pestaña con el formato solicitado
 * @param {Object[]} asignaciones - Array de objetos de asignación
 */
function guardarResultadosAsignacion(asignaciones) {
  try {
    if (!asignaciones || !Array.isArray(asignaciones) || asignaciones.length === 0) {
      return { success: false, message: "No hay resultados para guardar" };
    }

    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheetName = "Resultados_Acomodo";
    let sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    } else {
      sheet.clear();
    }

    // Encabezados exactos solicitados
    const headers = ["Grupo", "Asignatura", "Día", "Horario", "Salón", "Edificio", "Estado"];

    // Preparar matriz de valores
    const values = [headers];
    asignaciones.forEach(a => {
      // Logic to handle both flat and nested (clase/salon) objects
      const grupoId = a.grupoId || (a.clase ? a.clase.grupoId : "");
      const materia = a.materia || (a.clase ? a.clase.nombreAsignatura : "");
      const dia = a.dia || (a.clase ? a.clase.diaSemana : "");

      let horaInicio = "", horaFin = "";
      if (a.horario && a.horario.horaInicio) {
        horaInicio = a.horario.horaInicio;
        horaFin = a.horario.horaFin;
      } else if (a.clase) {
        horaInicio = a.clase.horaInicio;
        horaFin = a.clase.horaFin;
      }
      const horarioStr = (horaInicio && horaFin) ? `${horaInicio} - ${horaFin}` : "";

      const salonId = a.salonId || (a.salon ? a.salon.id : "");
      const edificio = a.edificio || (a.salon ? a.salon.edificio : "");

      let estado = a.estado || (salonId ? "Asignado" : "No Asignado");
      if (a.bloque === 'Laboratorio') estado = "Laboratorio";

      values.push([
        grupoId,
        materia,
        dia,
        horarioStr,
        salonId,
        edificio,
        estado
      ]);
    });

    // Escribir en la hoja
    sheet.getRange(1, 1, values.length, headers.length).setValues(values);

    // Formato visual
    sheet.getRange(1, 1, 1, headers.length).setBackground("#4CAF50").setFontColor("#FFFFFF").setFontWeight("bold");
    sheet.setFrozenRows(1);
    SpreadsheetApp.flush();

    return { success: true, message: `Resultados guardados: ${asignaciones.length} registros` };
  } catch (error) {
    console.error("Error guardando resultados:", error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Obtiene los resultados y los parsea de vuelta al objeto original
 */
function obtenerResultadosAsignacion() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName("Resultados_Acomodo");

    if (!sheet || sheet.getLastRow() < 2) {
      return { success: false, message: "No hay resultados guardados", asignaciones: [] };
    }

    const data = sheet.getDataRange().getValues();
    const rows = data.slice(1); // Saltar headers

    const asignaciones = rows.map(row => {
      // Parsear horario "HH:MM - HH:MM"
      let inicio = "", fin = "";
      if (row[3] && typeof row[3] === 'string' && row[3].includes('-')) {
        const partes = row[3].split('-').map(p => p.trim());
        if (partes.length === 2) {
          inicio = partes[0];
          fin = partes[1];
        }
      }

      return {
        grupoId: row[0],
        materia: row[1],
        dia: row[2],
        horario: { horaInicio: inicio, horaFin: fin },
        salonId: row[4],
        edificio: row[5],
        // No necesitamos mapear Estado de vuelta para la lógica interna, pero podríamos
      };
    });

    return { success: true, asignaciones: asignaciones };
  } catch (error) {
    console.error("Error obteniendo resultados:", error);
    return { success: false, message: error.toString(), asignaciones: [] };
  }
}

/**
 * Calcula estadísticas rápidas desde la hoja Horarios_CSV para el Dashboard
 */
function obtenerEstadisticasDashboard() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName("Horarios_CSV");

    if (!sheet || sheet.getLastRow() < 2) {
      // Si no hay hoja de horarios, intentar obtener del estado guardado
      const estado = obtenerEstadoAsignacion();
      if (estado.success && estado.datos && estado.datos.resumen) {
        return { success: true, datos: estado.datos.resumen };
      }
      return { success: false, message: "No hay datos disponibles" };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => h.toLowerCase());
    const rows = data.slice(1);

    const idxModalidad = headers.indexOf("modalidad");
    const idxGrupo = headers.indexOf("grupo") !== -1 ? headers.indexOf("grupo") : headers.indexOf("grupo_id");

    const totalSesiones = rows.length;
    let clasesPresenciales = 0;
    const gruposUnicos = new Set();

    rows.forEach(row => {
      const mod = String(row[idxModalidad] || '').toLowerCase();
      if (mod.includes("presencial") || mod === "") {
        clasesPresenciales++;
      }
      if (idxGrupo !== -1 && row[idxGrupo]) {
        gruposUnicos.add(row[idxGrupo]);
      }
    });

    // Intentar obtener el número de asignaciones del estado del sistema
    const estado = obtenerEstadoAsignacion();
    const asignadas = (estado.success && estado.datos && estado.datos.resumen) ? estado.datos.resumen.asignadas : 0;
    const salonesUsados = (estado.success && estado.datos && estado.datos.salones) ?
      estado.datos.salones.filter(s => s.horariosOcupados && s.horariosOcupados.length > 0).length : 0;

    return {
      success: true,
      datos: {
        totalClases: totalSesiones,
        clasesPresenciales: clasesPresenciales,
        asignadas: asignadas,
        totalSalones: salonesUsados,
        totalGrupos: gruposUnicos.size
      }
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return { success: false, message: error.toString() };
  }
}

// Log de inicialización para Apps Script
if (typeof Logger !== 'undefined') {
  Logger.log('Sistema de Asignación de Salones cargado correctamente');
}
console.log('✅ Sistema de Asignación de Salones cargado');
