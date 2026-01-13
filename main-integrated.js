/**
 * ARCHIVO PRINCIPAL INTEGRADO - Compatible con Google Apps Script
 * Archivo: main-integrated.js
 * 
 * NOTA: Este archivo está COMPLETAMENTE COMMENT para evitar conflictos.
 * Las clases y CONFIG ya están definidas en code.js
 * DESCOMENTAR SECCIONES SOLO SI code.js NO ESTÁ PRESENTE
 */

// ============================================
// TODO EL CONTENIDO ESTÁ COMENTADO PARA EVITAR CONFLICTOS
// VER code.js PARA LA IMPLEMENTACIÓN COMPLETA
// ============================================

/*

// ============================================
// CONFIGURACIÓN CENTRALIZADA (YA DEFINIDA EN code.js)
// DESCOMENTAR SOLO SI code.js NO ESTÁ PRESENTE
// ============================================

/**
 * Configuración centralizada para reglas de validación y asignación
 * @type {Object}
 */
// const CONFIG = {
//   // Reglas de validación configurables
//   validaciones: {
//     accesibilidad: {
//       habilitado: true,
//       pisoRequerido: 1,
//       mensaje: "ACCESIBILIDAD: El grupo {grupo} requiere un salón en primer piso"
//     },
//     capacidad: {
//       habilitado: true,
//       margenExceso: 0,
//       mensaje: "CAPACIDAD: El grupo excede la capacidad del salón. Alumnos: {alumnos}, Capacidad: {capacidad}"
//     },
//     prioridadPiso: {
//       habilitado: true,
//       reglas: [
//         { semestres: [1, 2], pisoPreferido: 4, obligatorio: true },
//         { semestres: [6, 7, 8], pisoMaximo: 2, obligatorio: true }
//       ],
//       mensaje: "PRIORIDAD_PISO: Los grupos de {semestre}° semestre deben asignarse al {piso} piso"
//     },
//     distanciaEdificios: {
//       habilitado: true,
//       edificioPreferido: 'F',
//       pesoDistancia: 0.1
//     }
//   },
//   asignacion: {
//     maxReintentos: 3,
//     permitirReubicacion: true,
//     estrategiaFallback: 'consistente',
//     logDetallado: true
//   },
//   edificios: {
//     F: { pisos: 4, salonesPorPiso: [4, 4, 4, 4] },
//     E: { pisos: 4, salonesPorPiso: [6, 6, 6, 5] },
//     D: { pisos: 4, salonesPorPiso: [6, 6, 6, 6] }
//   },
//   prioridades: {
//     orden: ['prioritarios', 'semestre', 'tamano', 'dias'],
//     semestre: { orden: 'ascendente' },
//     tamano: { orden: 'descendente' },
//     gruposPrioritarios: []
//   }
// };

// ============================================
// FUNCIONES DE GESTIÓN DE CONFIGURACIÓN
// ============================================

/**
 * Función para obtener configuración con valores por defecto
 * @param {string} path - Ruta de la configuración (ej: 'validaciones.accesibilidad.habilitado')
 * @param {*} defaultValue - Valor por defecto si no se encuentra la configuración
 * @returns {*} Valor de la configuración o valor por defecto
 */
function getConfig(path, defaultValue = null) {
  try {
    const keys = path.split('.');
    let current = CONFIG;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        console.debug(`Configuración no encontrada: ${path}, usando valor por defecto: ${defaultValue}`);
        return defaultValue;
      }
    }
    
    console.debug(`Configuración obtenida: ${path} = ${JSON.stringify(current)}`);
    return current;
    
  } catch (error) {
    console.error(`Error obteniendo configuración ${path}:`, error);
    return defaultValue;
  }
}

// ============================================
// VALIDADORES DE DATOS - YA DEFINIDOS EN validators.js
// DESCOMENTAR SOLO SI validators.js NO ESTÁ PRESENTE
// ============================================

/**
 * Validador de datos principal
 */
// const Validador = {
//   /**
//    * Valida que un valor no esté vacío
//    */
//   noVacio(valor, campo = 'Campo') {
//     if (valor === null || valor === undefined || valor === '') {
//       return { valido: false, mensaje: `${campo} no puede estar vacío` };
//     }
//     if (typeof valor === 'string' && valor.trim() === '') {
//       return { valido: false, mensaje: `${campo} no puede contener solo espacios` };
//     }
//     return { valido: true };
//   },
//   
//   /**
//    * Valida que sea un número válido
//    */
//   esNumero(valor, campo = 'Campo') {
//     if (valor === null || valor === undefined) {
//       return { valido: false, mensaje: `${campo} es requerido` };
//     }
//     const num = parseFloat(valor);
//     if (isNaN(num)) {
//       return { valido: false, mensaje: `${campo} debe ser un número válido` };
//     }
//     return { valido: true, valor: num };
//   },
//   
//   /**
//    * Valida que sea un número entero
//    */
//   esEntero(valor, campo = 'Campo') {
//     const resultado = this.esNumero(valor, campo);
//     if (!resultado.valido) return resultado;
//     
//     if (!Number.isInteger(resultado.valor)) {
//       return { valido: false, mensaje: `${campo} debe ser un número entero` };
//     }
//     return { valido: true, valor: parseInt(valor, 10) };
//   },
//   
//   /**
//    * Valida rango numérico
//    */
//   rango(valor, min, max, campo = 'Campo') {
//     const resultado = this.esNumero(valor, campo);
//     if (!resultado.valido) return resultado;
//     
//     if (resultado.valor < min || resultado.valor > max) {
//       return { 
//         valido: false, 
//         mensaje: `${campo} debe estar entre ${min} y ${max}` 
//       };
//     }
//     return { valido: true, valor: resultado.valor };
//   },
//   
//   /**
//    * Valida que sea un valor de una lista
//    */
//   enLista(valor, lista, campo = 'Campo') {
//     if (!lista.includes(valor)) {
//       return { 
//         valido: false, 
//         mensaje: `${campo} debe ser uno de: ${lista.join(', ')}` 
//       };
//     }
//     return { valido: true };
//   }
// };

// ============================================
// PROCESAMIENTO DE ARCHIVOS CSV - YA DEFINIDO EN validators.js
// ============================================

/**
 * Procesa un archivo CSV y lo convierte a array de objetos
 * @param {File} archivo - Archivo CSV a procesar
 * @returns {Promise<Object>} Resultado del procesamiento
 */
async function procesarArchivoCSV(archivo) {
  try {
    // Validar tipo de archivo
    if (!archivo.name.match(/\.(csv)$/i)) {
      throw new Error(`ARCHIVO_INVALIDO: El archivo ${archivo.name} debe ser CSV`);
    }

    // Leer contenido del archivo
    const contenido = await leerArchivo(archivo);

    // Validar estructura del CSV
    validarEstructuraCSV(contenido, archivo.name);

    // Convertir CSV a array de objetos
    return parsearCSV(contenido);
  } catch (error) {
    throw error;
  }
}

/**
 * Lee el contenido de un archivo
 * @param {File} archivo - Archivo a leer
 * @returns {Promise<string>} Contenido del archivo
 */
function leerArchivo(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('ERROR_LECTURA: No se pudo leer el archivo'));
    reader.readAsText(archivo);
  });
}

/**
 * Valida la estructura del CSV
 * @param {string} contenido - Contenido del CSV
 * @param {string} fileName - Nombre del archivo
 * @throws {Error} Si la estructura es inválida
 */
function validarEstructuraCSV(contenido, fileName) {
  const lineas = contenido.split('\n').filter(linea => linea.trim() !== '');
  if (lineas.length < 2) {
    throw new Error(`CSV_INVALIDO: El archivo "${fileName}" debe contener al menos una fila de datos`);
  }

  const encabezados = lineas[0].split(',').map(h => h.trim());
  const encabezadosRequeridos = [
    'id_unico', 'codigo_asignatura', 'nombre_asignatura', 'maestro',
    'edificio', 'salon', 'capacidad', 'grupo', 'dia_semana',
    'hora_inicio', 'hora_fin', 'duracion_min', 'modalidad', 'tipo'
  ];

  for (const encabezado of encabezadosRequeridos) {
    if (!encabezados.includes(encabezado)) {
      throw new Error(`CSV_INVALIDO: Falta el encabezado requerido "${encabezado}" en el archivo "${fileName}"`);
    }
  }

  // Validar formato de cada fila
  for (let i = 1; i < lineas.length; i++) {
    const fila = lineas[i].split(',').map(c => c.trim());
    if (fila.length !== encabezados.length) {
      throw new Error(`CSV_INVALIDO: La fila ${i} del archivo "${fileName}" tiene un número incorrecto de columnas`);
    }

    // Validar formato de id_unico (número)
    if (!fila[0].match(/^\d+$/)) {
      throw new Error(`CSV_INVALIDO: Formato de id_unico inválido en fila ${i} del archivo "${fileName}"`);
    }

    // Validar formato de capacidad (número)
    if (!fila[6].match(/^\d+$/)) {
      throw new Error(`CSV_INVALIDO: Formato de capacidad inválido en fila ${i} del archivo "${fileName}"`);
    }

    // Validar formato de grupo (número de 3 dígitos o "VIR")
    if (!fila[7].match(/^\d{3}$/) && fila[7] !== 'VIR' && !fila[7].match(/^\d{1}$/)) {
      throw new Error(`CSV_INVALIDO: Formato de grupo inválido en fila ${i} del archivo "${fileName}"`);
    }

    // Validar formato de hora (HH:MM)
    if (!fila[9].match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/) ||
        !fila[10].match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      throw new Error(`CSV_INVALIDO: Formato de hora inválido en fila ${i} del archivo "${fileName}"`);
    }

    // Validar modalidad (Presencial o Virtual)
    if (!['Presencial', 'Virtual'].includes(fila[12])) {
      throw new Error(`CSV_INVALIDO: Modalidad inválida en fila ${i} del archivo "${fileName}"`);
    }
  }
}

/**
 * Parsea el contenido CSV a array de objetos
 * @param {string} contenido - Contenido del CSV
 * @returns {Array} Array de objetos con los datos
 */
function parsearCSV(contenido) {
  const lineas = contenido.split('\n').filter(linea => linea.trim() !== '');
  const encabezados = lineas[0].split(',').map(h => h.trim());
  const datos = [];
  
  for (let i = 1; i < lineas.length; i++) {
    const valores = lineas[i].split(',').map(v => v.trim());
    const fila = {};
    
    encabezados.forEach((encabezado, index) => {
      fila[encabezado] = valores[index];
    });
    
    datos.push(fila);
  }
  
  return datos;
}

// ============================================
// SISTEMA DE NOTIFICACIONES - YA DEFINIDO EN notificaciones-module.js
// ============================================

// ============================================
// CLASES PRINCIPALES (YA DEFINIDAS EN code.js)
// ============================================

// ============================================
// SELECTOR DE SALONES
// ============================================

/**
 * Selector inteligente de salones con múltiples criterios de optimización
 */
class SalonSelector {
  constructor(salones) {
    this.salones = salones;
    this.config = CONFIG.validaciones;
  }
  
  /**
   * Selecciona el mejor salón para un grupo de candidatos válidos
   * @param {Array} salonesCandidatos - Salones que pasan validaciones básicas
   * @param {Grupo} grupo - Grupo a asignar
   * @returns {Salon} Mejor salón seleccionado
   */
  seleccionarMejorSalon(salonesCandidatos, grupo) {
    if (salonesCandidatos.length === 0) return null;
    if (salonesCandidatos.length === 1) return salonesCandidatos[0];
    
    // Aplicar criterios de selección en orden de prioridad
    let candidatos = [...salonesCandidatos];
    
    // 1. Capacidad óptima
    candidatos = this.ordenarPorCapacidad(candidatos, grupo);
    
    // 2. Accesibilidad
    candidatos = this.ordenarPorAccesibilidad(candidatos, grupo);
    
    // 3. Distancia entre edificios
    candidatos = this.ordenarPorDistanciaEdificios(candidatos, grupo);
    
    // 4. Piso preferido
    candidatos = this.ordenarPorPisoPreferido(candidatos, grupo);
    
    // 5. Carga actual (menos ocupado)
    candidatos = this.ordenarPorCargaActual(candidatos);
    
    return candidatos[0];
  }
  
  /**
   * Ordena por ajuste de capacidad (mejor ajuste primero)
   */
  ordenarPorCapacidad(candidatos, grupo) {
    return candidatos.sort((a, b) => {
      const ajusteA = Math.abs(a.capacidad - grupo.cantidadAlumnos);
      const ajusteB = Math.abs(b.capacidad - grupo.cantidadAlumnos);
      return ajusteA - ajusteB;
    });
  }
  
  /**
   * Prioriza salones accesibles si el grupo lo requiere
   */
  ordenarPorAccesibilidad(candidatos, grupo) {
    if (!this.config.accesibilidad.habilitado || !grupo.tieneDiscapacidad) {
      return candidatos;
    }
    
    return candidatos.sort((a, b) => {
      const aAccesible = a.piso === this.config.accesibilidad.pisoRequerido ? 1 : 0;
      const bAccesible = b.piso === this.config.accesibilidad.pisoRequerido ? 1 : 0;
      return bAccesible - aAccesible; // Accesibles primero
    });
  }
  
  /**
   * Ordena por preferencia de edificio (minimizar distancia)
   */
  ordenarPorDistanciaEdificios(candidatos, grupo) {
    if (!this.config.distanciaEdificios.habilitado) {
      return candidatos;
    }
    
    const edificioPreferido = this.config.distanciaEdificios.edificioPreferido;
    return candidatos.sort((a, b) => {
      const aPreferido = a.edificio === edificioPreferido ? 1 : 0;
      const bPreferido = b.edificio === edificioPreferido ? 1 : 0;
      return bPreferido - aPreferido;
    });
  }
  
  /**
   * Ordena por piso preferido según semestre
   */
  ordenarPorPisoPreferido(candidatos, grupo) {
    if (!this.config.prioridadPiso.habilitado) {
      return candidatos;
    }
    
    const regla = this.config.prioridadPiso.reglas.find(r => r.semestres.includes(grupo.semestre));
    if (!regla) return candidatos;
    
    return candidatos.sort((a, b) => {
      let scoreA = 0, scoreB = 0;
      
      if (regla.pisoPreferido) {
        scoreA += a.piso === regla.pisoPreferido ? 10 : 0;
        scoreB += b.piso === regla.pisoPreferido ? 10 : 0;
      }
      
      if (regla.pisoMaximo) {
        scoreA += a.piso <= regla.pisoMaximo ? 5 : 0;
        scoreB += b.piso <= regla.pisoMaximo ? 5 : 0;
      }
      
      return scoreB - scoreA;
    });
  }
  
  /**
   * Ordena por carga actual (menos asignaciones primero)
   */
  ordenarPorCargaActual(candidatos) {
    return candidatos.sort((a, b) => {
      const cargaA = a.asignacionesBloques ? a.asignacionesBloques.length : 0;
      const cargaB = b.asignacionesBloques ? b.asignacionesBloques.length : 0;
      return cargaA - cargaB; // Menos carga primero
    });
  }
};

// ============================================
// SISTEMA DE ASIGNACIÓN PRINCIPAL
// ============================================

/**
 * Sistema principal de asignación de salones
 */
// class SistemaAsignacion {
//   constructor() {
//     this.salones = [];
//     this.clases = [];
//     this.grupos = [];
//     this.asignaciones = [];
//     this.selector = null;
//     this.inicializado = false;
//   }
   
  /**
   * Inicializa el sistema con los salones disponibles
   */
  // inicializar() {
  //   // Crear salones basados en la configuración
  //   const edificiosConfig = getConfig('edificios', {});
  //
  //   Object.entries(edificiosConfig).forEach(([edificio, config]) => {
  //     for (let piso = 1; piso <= config.pisos; piso++) {
  //       const salonesPorPiso = config.salonesPorPiso[piso - 1] || 0;
  //
  //       for (let i = 1; i <= salonesPorPiso; i++) {
  //         const nombre = `${edificio}${piso}${i < 10 ? '0' : ''}${i}`;
  //         const salon = new Salon(edificio, piso, nombre, 40); // Capacidad por defecto
  //         this.salones.push(salon);
  //       }
  //     }
  //   });
  //
  //   this.selector = new SalonSelector(this.salones);
  //   this.inicializado = true;
  //
  //   console.log(`Sistema inicializado con ${this.salones.length} salones`);
  // }
   
  /**
   * Procesa datos de archivos CSV y crea clases
   */
  // async procesarDatosCSV(archivos) {
  //   if (!this.inicializado) {
  //     this.inicializar();
  //   }
  //
  //   const resultados = [];
  //
  //   for (const archivo of archivos) {
  //     try {
  //       const datos = await procesarArchivoCSV(archivo);
  //       resultados.push(...datos);
  //
  //       // Crear clases a partir de los datos
  //       datos.forEach(dato => {
  //         const grupo = new Grupo(
  //           dato.grupo,
  //           `${dato.codigo_asignatura} - ${dato.grupo}`,
  //           dato.grupo === 'VIR' ? 1 : parseInt(dato.grupo.substring(0, 1)), // Extraer semestre
  //           parseInt(dato.capacidad)
  //         );
  //
  //         const horario = new Horario(
  //           dato.dia_semana,
  //           dato.hora_inicio,
  //           dato.hora_fin
  //         );
  //
  //         const clase = new Clase(
  //           dato.id_unico,
  //           dato.nombre_asignatura,
  //           grupo,
  //           horario,
  //           dato.modalidad
  //         );
  //
  //         this.clases.push(clase);
  //       });
  //
  //       console.log(`Procesado ${datos.length} registros de ${archivo.name}`);
  //
  //     } catch (error) {
  //       console.error(`Error procesando ${archivo.name}:`, error);
  //       Notificaciones.error(`Error procesando ${archivo.name}: ${error.message}`);
  //     }
  //   }
  //
  //   return resultados;
  // }
   
  /**
   * Asigna salones a todas las clases
   */
  // async asignarSalones() {
  //   if (!this.inicializado) {
  //     throw new Error('Sistema no inicializado. Llame a inicializar() primero.');
  //   }
  //
  //   const resultados = [];
  //   const errores = [];
  //
  //   // Primero asignar grupos prioritarios
  //   const gruposPrioritarios = CONFIG.prioridades.gruposPrioritarios || [];
  //   const clasesPrioritarias = this.clases.filter(clase =>
  //     gruposPrioritarios.includes(clase.grupo.nombre)
  //   );
  //
  //   // Asignar clases prioritarias primero
  //   for (const clase of clasesPrioritarias) {
  //     try {
  //       // Buscar salones disponibles en el primer piso para este horario
  //       const salonesDisponibles = this.salones.filter(salon => {
  //         return salon.piso === 1 && !salon.tieneConflicto(clase.horario);
  //       });
  //
  //     if (salonesDisponibles.length === 0) {
  //       throw new Error(`No hay salones disponibles en el primer piso para ${clase.materia} (${clase.grupo.nombre})`);
  //     }
  //
  //     // Seleccionar el mejor salón en el primer piso
  //     const mejorSalon = this.selector.seleccionarMejorSalon(
  //       salonesDisponibles,
  //       clase.grupo
  //     );
  //
  //     if (!mejorSalon) {
  //       throw new Error(`No se pudo seleccionar salón en el primer piso para ${clase.materia}`);
  //     }
  //
  //     // Asignar el salón
  //     clase.asignarSalon(mejorSalon);
  //
  //     resultados.push({
  //       clase: clase.id,
  //       materia: clase.materia,
  //       grupo: clase.grupo.nombre,
  //       salon: mejorSalon.nombre,
  //       edificio: mejorSalon.edificio,
  //       piso: mejorSalon.piso,
  //       horario: `${clase.horario.horaInicio} - ${clase.horario.horaFin}`,
  //       dia: clase.horario.dia,
  //       estado: 'asignado',
  //       prioritario: true
  //     });
  //
  //     console.log(`Asignado ${mejorSalon.nombre} a ${clase.materia} (${clase.grupo.nombre}) - PRIORITARIO`);
  //
  //     } catch (error) {
  //       console.error(`Error asignando salón prioritario a ${clase.materia}:`, error);
  //       errores.push({
  //         clase: clase.id,
  //         materia: clase.materia,
  //         grupo: clase.grupo.nombre,
  //         error: error.message,
  //         estado: 'error',
  //         prioritario: true
  //       });
  //     }
  //   }
  //
  //   // Luego asignar el resto de las clases
  //   const clasesNoPrioritarias = this.clases.filter(clase =>
  //     !gruposPrioritarios.includes(clase.grupo.nombre)
  //   );
  //
  //   for (const clase of clasesNoPrioritarias) {
  //     try {
  //       // Buscar salones disponibles para este horario
  //       const salonesDisponibles = this.salones.filter(salon => {
  //         return !salon.tieneConflicto(clase.horario);
  //       });
  //
  //     if (salonesDisponibles.length === 0) {
  //       throw new Error(`No hay salones disponibles para ${clase.materia} (${clase.grupo.nombre})`);
  //     }
  //
  //     // Seleccionar el mejor salón
  //     const mejorSalon = this.selector.seleccionarMejorSalon(
  //       salonesDisponibles,
  //       clase.grupo
  //     );
  //
  //     if (!mejorSalon) {
  //       throw new Error(`No se pudo seleccionar salón para ${clase.materia}`);
  //     }
  //
  //     // Asignar el salón
  //     clase.asignarSalon(mejorSalon);
  //
  //     resultados.push({
  //       clase: clase.id,
  //       materia: clase.materia,
  //       grupo: clase.grupo.nombre,
  //       salon: mejorSalon.nombre,
  //       edificio: mejorSalon.edificio,
  //       piso: mejorSalon.piso,
  //       horario: `${clase.horario.horaInicio} - ${clase.horario.horaFin}`,
  //       dia: clase.horario.dia,
  //       estado: 'asignado',
  //       prioritario: false
  //     });
  //
  //     console.log(`Asignado ${mejorSalon.nombre} a ${clase.materia} (${clase.grupo.nombre})`);
  //
  //     } catch (error) {
  //       console.error(`Error asignando salón a ${clase.materia}:`, error);
  //       errores.push({
  //         clase: clase.id,
  //         materia: clase.materia,
  //         grupo: clase.grupo.nombre,
  //         error: error.message,
  //         estado: 'error',
  //         prioritario: false
  //       });
  //     }
  //   }
  //
  //   return {
  //     asignaciones: resultados,
  //     errores: errores,
  //     estadisticas: {
  //       totalClases: this.clases.length,
  //       asignadas: resultados.length,
  //       conErrores: errores.length,
  //       porcentajeExito: (resultados.length / this.clases.length * 100).toFixed(2),
  //       prioritariasAsignadas: resultados.filter(r => r.prioritario).length,
  //       noPrioritariasAsignadas: resultados.filter(r => !r.prioritario).length
  //     }
  //   };
  // }
   
  /**
   * Genera un reporte de asignaciones
   */
  // generarReporte() {
  //   const reporte = {
  //     salones: this.salones.map(salon => ({
  //       nombre: salon.nombre,
  //       edificio: salon.edificio,
  //       piso: salon.piso,
  //       capacidad: salon.capacidad,
  //       asignaciones: salon.asignacionesBloques.length,
  //       disponible: salon.disponible
  //     })),
  //     clases: this.clases.map(clase => ({
  //       id: clase.id,
  //       materia: clase.materia,
  //       grupo: clase.grupo.nombre,
  //       salon: clase.salonAsignado ? clase.salonAsignado.nombre : 'Sin asignar',
  //       horario: `${clase.horario.horaInicio} - ${clase.horario.horaFin}`,
  //       dia: clase.horario.dia
  //     })),
  //     estadisticas: {
  //       totalSalones: this.salones.length,
  //       salonesOcupados: this.salones.filter(s => !s.disponible).length,
  //       totalClases: this.clases.length,
  //       clasesAsignadas: this.clases.filter(c => c.salonAsignado).length
  //     }
  //   };
  //
  //   return reporte;
  // }
// };

// ============================================
// FUNCIONES DE INTEGRACIÓN CON LA INTERFAZ
// ============================================

/**
 * Función principal para cargar archivos y asignar salones
 */
async function cargarArchivosYAsignar() {
  try {
    // Mostrar indicador de carga
    if (typeof Notificaciones !== 'undefined') {
      Notificaciones.mostrarProgreso('Procesando archivos', 0, 'Iniciando...');
    }
    
    // En Apps Script, no se puede acceder al DOM directamente
    // Esta función se deja vacía para evitar errores
    console.log('Función cargarArchivosYAsignar llamada, pero no implementada en Apps Script');
    
  } catch (error) {
    console.error('Error en el proceso principal:', error);
    if (typeof Notificaciones !== 'undefined') {
      Notificaciones.error(`Error en el proceso: ${error.message}`);
    }
  }
}

/**
 * Muestra los salones en la interfaz
 */
function mostrarSalonesEnInterfaz(salones) {
  // En Apps Script, no se puede manipular el DOM directamente
  // Esta función se deja vacía para evitar errores
  console.log('Función mostrarSalonesEnInterfaz llamada, pero no implementada en Apps Script');
}

/**
 * Muestra estadísticas de asignación
 */
function mostrarEstadisticas(estadisticas) {
  // En Apps Script, no se puede manipular el DOM directamente
  // Esta función se deja vacía para evitar errores
  console.log('Función mostrarEstadisticas llamada, pero no implementada en Apps Script');
}

/**
 * Muestra las asignaciones realizadas
 */
function mostrarAsignaciones(asignaciones) {
  // En Apps Script, no se puede manipular el DOM directamente
  // Esta función se deja vacía para evitar errores
  console.log('Función mostrarAsignaciones llamada, pero no implementada en Apps Script');
}

/**
 * Muestra errores de asignación
 */
function mostrarErrores(errores) {
  // En Apps Script, no se puede manipular el DOM directamente
  // Esta función se deja vacía para evitar errores
  console.log('Función mostrarErrores llamada, pero no implementada en Apps Script');
}

/**
 * Muestra detalle de un salón
 */
function mostrarDetalleSalon(nombreSalon) {
  // Implementación para mostrar detalles del salón
  console.log('Mostrar detalles de:', nombreSalon);
}

/**
 * Agrega estilos CSS para los salones
 */
function agregarEstilosSalones() {
  // En Apps Script, no se puede manipular el DOM directamente
  // Esta función se deja vacía para evitar errores
  console.log('Función agregarEstilosSalones llamada, pero no implementada en Apps Script');
}

// ============================================
// FUNCIONES PARA SELECCIÓN DE GRUPOS PRIORITARIOS
// ============================================

/**
 * Abre el modal para seleccionar grupos prioritarios
 */
function abrirModalGruposPrioritarios() {
  // En Apps Script, no se puede manipular el DOM directamente
  // Esta función se adapta para evitar errores
  console.log('Función abrirModalGruposPrioritarios llamada, pero no implementada en Apps Script');
  cargarListaGrupos();
  cargarGruposGuardados();
}

/**
 * Cierra el modal de grupos prioritarios
 */
function cerrarModalGruposPrioritarios() {
  // En Apps Script, no se puede manipular el DOM directamente
  // Este método se adapta para evitar errores
  console.log('Función cerrarModalGruposPrioritarios llamada, pero no implementada en Apps Script');
}

/**
 * Carga la lista de grupos disponibles
 */
function cargarListaGrupos() {
  // Obtener grupos únicos de las clases cargadas
  const grupos = obtenerGruposUnicos();
  
  // En Apps Script, no se puede manipular el DOM directamente
  // Este método se adapta para evitar errores
  console.log('Grupos disponibles:', grupos);
  return grupos;
}

/**
 * Obtiene grupos únicos de las clases cargadas
 */
function obtenerGruposUnicos() {
  // Si hay clases cargadas, obtener grupos de ellas
  // Verificar que window existe (no existe en Apps Script del servidor)
  if (typeof window !== 'undefined' && window.sistemaAsignacion && window.sistemaAsignacion.clases) {
    const gruposSet = new Set();
    window.sistemaAsignacion.clases.forEach(clase => {
      gruposSet.add(clase.grupo.nombre);
    });
    return Array.from(gruposSet);
  }
  
  // Si no hay clases cargadas, usar lista predeterminada
  return [
    '231', '232', '233', '234',
    '241', '242', '243', '244', '245',
    '251', '252', '253', '255',
    '261', '262', '263', '264',
    '271', '272', '273', '274',
    '281', '282', '283',
    '431', '432', '433', '434', '435',
    '441', '442', '443', '444',
    '451', '452', '453', '454', '455',
    '461', '462', '463',
    '472', '473', '474',
    '481', '482',
    '531', '532', '533', '534', '535', '536',
    '541', '542', '543', '544', '545',
    '551', '552', '553', '554', '555',
    '561', '562', '563', '564', '565',
    '571', '572', '573', '574', '575', '576',
    '581', '582', '583', '584',
    '601', '602', '603', '604', '605', '606', '607', '608', '609', '610',
    '611', '612', '613', '614', '615', '616', '617', '618', '619', '620',
    '621', '622', '623', '624', '625', '626', '627', '628', '629', '630',
    '632', '633', '634', '635', '636',
    '931', '932',
    '941',
    '951', '952',
    '961', '962',
    '971', '972',
    '981', '982',
    'VIR'
  ];
}

/**
 * Alterna la selección de un grupo
 */
function toggleSeleccionGrupo(grupo) {
  // En Apps Script, no se puede manipular el DOM directamente
  // Este método se adapta para evitar errores
  console.log('Grupo seleccionado/deseleccionado:', grupo);
}

/**
 * Carga los grupos guardados en el modal
 */
function cargarGruposGuardados() {
  // En Apps Script, no se puede manipular el DOM directamente
  // Este método se adapta para evitar errores
  const gruposGuardados = JSON.parse(PropertiesService.getScriptProperties().getProperty('gruposPrioritarios')) || [];
  console.log('Grupos guardados cargados:', gruposGuardados);
  return gruposGuardados;
}

/**
 * Remueve un grupo de la lista de guardados
 */
function removerGrupoGuardado(grupo) {
  // En Apps Script, no se puede manipular el DOM directamente
  // Este método se adapta para evitar errores
  const gruposGuardados = JSON.parse(PropertiesService.getScriptProperties().getProperty('gruposPrioritarios')) || [];
  const nuevosGrupos = gruposGuardados.filter(g => g !== grupo);
  PropertiesService.getScriptProperties().setProperty('gruposPrioritarios', JSON.stringify(nuevosGrupos));
  console.log('Grupo removido:', grupo);
  return nuevosGrupos;
}

/**
 * Guarda los grupos seleccionados como prioritarios
 */
function guardarGruposPrioritarios() {
  // En Apps Script, no se puede acceder al DOM directamente
  // Esta función se adapta para evitar errores
  console.log('Función guardarGruposPrioritarios llamada, pero no implementada en Apps Script');
  
  // Guardar en PropertiesService de Apps Script
  const gruposSeleccionados = []; // En Apps Script, los grupos se manejan de otra forma
  PropertiesService.getScriptProperties().setProperty('gruposPrioritarios', JSON.stringify(gruposSeleccionados));
  
  // Actualizar configuración con verificación de existencia
  if (CONFIG && CONFIG.prioridades) {
    CONFIG.prioridades.gruposPrioritarios = gruposSeleccionados;
  } else if (CONFIG) {
    CONFIG.prioridades = CONFIG.prioridades || {};
    CONFIG.prioridades.gruposPrioritarios = gruposSeleccionados;
  }
  
  // Mostrar notificación
  if (typeof Notificaciones !== 'undefined') {
    Notificaciones.success(`Grupos prioritarios guardados: ${gruposSeleccionados.length} grupos`);
  }
  
  // Cerrar modal
  cerrarModalGruposPrioritarios();
  
  // Si hay un sistema de asignación cargado, reasignar con los nuevos grupos prioritarios
  // Verificar que window existe (no existe en Apps Script del servidor)
  if (typeof window !== 'undefined' && window.sistemaAsignacion) {
    reasignarConGruposPrioritarios(gruposSeleccionados);
  }
}

/**
 * Reasigna salones con los nuevos grupos prioritarios
 */
async function reasignarConGruposPrioritarios(gruposPrioritarios) {
  try {
    if (typeof Notificaciones !== 'undefined') {
      Notificaciones.mostrarProgreso('Reasignando salones', 0, 'Aplicando grupos prioritarios...');
    }
    
    // Actualizar grupos prioritarios en la configuración con verificación
    if (CONFIG && CONFIG.prioridades) {
      CONFIG.prioridades.gruposPrioritarios = gruposPrioritarios;
    } else if (CONFIG) {
      CONFIG.prioridades = CONFIG.prioridades || {};
      CONFIG.prioridades.gruposPrioritarios = gruposPrioritarios;
    }
    
    // Crear nuevo sistema de asignación
    const sistema = new SistemaAsignacion();
    
    // Procesar datos nuevamente (si hay datos)
    // Verificar que window existe (no existe en Apps Script del servidor)
    if (typeof window !== 'undefined' && window.sistemaAsignacion && window.sistemaAsignacion.clases.length > 0) {
      // Copiar clases del sistema anterior
      sistema.clases = window.sistemaAsignacion.clases.map(clase => {
        return new Clase(
          clase.id,
          clase.materia,
          clase.grupo,
          clase.horario,
          clase.modalidad
        );
      });
      
      // Asignar salones con los nuevos grupos prioritarios
      const resultados = await sistema.asignarSalones();
      
      // Mostrar resultados
      mostrarSalonesEnInterfaz(sistema.salones);
      mostrarAsignaciones(resultados.asignaciones);
      
      if (typeof Notificaciones !== 'undefined') {
        Notificaciones.mostrarProgreso('Reasignación completada', 100, 'Proceso finalizado');
        Notificaciones.success('Salones reasignados con grupos prioritarios actualizados');
      }
      
      // Actualizar referencia global
      // Verificar que window existe (no existe en Apps Script del servidor)
      if (typeof window !== 'undefined') {
        window.sistemaAsignacion = sistema;
      }
    }
    
  } catch (error) {
    console.error('Error en reasignación:', error);
    if (typeof Notificaciones !== 'undefined') {
      Notificaciones.error(`Error en reasignación: ${error.message}`);
    }
  }
}

/**
 * Filtra grupos según el término de búsqueda
 */
function filtrarGrupos(searchTerm) {
  // En Apps Script, no se puede manipular el DOM directamente
  // Este método se adapta para evitar errores
  const grupos = cargarListaGrupos();
  const term = searchTerm ? searchTerm.toLowerCase() : '';
  const gruposFiltrados = grupos.filter(grupo => grupo.toLowerCase().includes(term));
  console.log('Grupos filtrados:', gruposFiltrados);
  return gruposFiltrados;
}

// ============================================
// FUNCIONES DE MANEJO DE ARCHIVOS (SOLO NAVEGADOR)
// ComENTADO PARA APPS SCRIPT - Estas funciones requieren DOM
// ============================================

/**
 * Configura el área de arrastre de archivos
 */
function configurarAreaArrastre() {
  // En Apps Script, no se puede manipular el DOM directamente
  // Este método se adapta para evitar errores
  console.log('Función configurarAreaArrastre llamada, pero no implementada en Apps Script');
}

// --- FUNCIONES COMENTADAS REQUIEREN DOM (document) ---
/*
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight() {
  const dropArea = document.getElementById('file-drop-area');
  if (dropArea) {
    dropArea.classList.add('highlight');
  }
}

function unhighlight() {
  const dropArea = document.getElementById('file-drop-area');
  if (dropArea) {
    dropArea.classList.remove('highlight');
  }
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles({ target: { files } });
}

function handleFiles(e) {
  const files = e.target.files;
  const fileList = document.getElementById('file-list');
  
  if (!fileList) return;
  
  fileList.innerHTML = '';
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
      <i class="fas fa-file-csv"></i>
      <span>${file.name}</span>
      <span class="remove-file" onclick="removerArchivo(${i})">×</span>
    `;
    fileList.appendChild(fileItem);
  }
}

function removerArchivo(index) {
  const fileInput = document.getElementById('input-archivos');
  if (fileInput && fileInput.files.length > index) {
    const newFiles = Array.from(fileInput.files);
    newFiles.splice(index, 1);
    
    // Crear nuevo objeto FileList (simulado)
    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;
    
    // Actualizar lista de archivos
    handleFiles({ target: { files: fileInput.files } });
  }
}
*/

// ============================================
// INICIALIZACIÓN DEL SISTEMA
// ============================================

// Inicializar notificaciones (si está disponible desde notificaciones-module.js)
if (typeof Notificaciones !== 'undefined' && typeof Notificaciones.init === 'function') {
  Notificaciones.init();
}

// Cargar grupos prioritarios desde PropertiesService (Apps Script)
function cargarGruposPrioritariosDesdeStorage() {
  try {
    const gruposGuardados = JSON.parse(PropertiesService.getScriptProperties().getProperty('gruposPrioritarios')) || [];
    
    // Verificar que CONFIG.prioridades existe antes de asignar
    if (CONFIG && CONFIG.prioridades) {
      CONFIG.prioridades.gruposPrioritarios = gruposGuardados;
    } else {
      // Inicializar prioridades si no existe
      if (CONFIG) {
        CONFIG.prioridades = CONFIG.prioridades || {};
        CONFIG.prioridades.gruposPrioritarios = gruposGuardados;
      }
    }
    
    console.log('Grupos prioritarios cargados:', gruposGuardados);
  } catch (error) {
    console.error('Error cargando grupos prioritarios:', error);
  }
}

// Llamar a la función al inicializar
try {
  cargarGruposPrioritariosDesdeStorage();
} catch (e) {
  console.log('Error al cargar grupos prioritarios:', e.message);
}

// Configurar área de arrastre cuando se cargue la interfaz
// En Apps Script, no se puede manipular el DOM directamente
// Este bloque se adapta para evitar errores
console.log('Configuración de área de arrastre adaptada para Apps Script');

// Exportar funciones globales para uso en la interfaz
if (typeof window !== 'undefined') {
  window.cargarArchivosYAsignar = cargarArchivosYAsignar;
  window.mostrarSalonesEnInterfaz = mostrarSalonesEnInterfaz;
  window.mostrarEstadisticas = mostrarEstadisticas;
  window.mostrarAsignaciones = mostrarAsignaciones;
  window.mostrarErrores = mostrarErrores;
  window.mostrarDetalleSalon = mostrarDetalleSalon;
  if (typeof Notificaciones !== 'undefined') {
    window.Notificaciones = Notificaciones;
  }
  window.getConfig = getConfig;
  // SalonSelector y SistemaAsignacion ya están definidos en sus archivos propios
  // window.SalonSelector = SalonSelector;
  // window.SistemaAsignacion = SistemaAsignacion;
  // Validador ya está definido en validators.js
  // window.Validador = Validador;
  window.abrirModalGruposPrioritarios = abrirModalGruposPrioritarios;
  window.cerrarModalGruposPrioritarios = cerrarModalGruposPrioritarios;
  window.cargarListaGrupos = cargarListaGrupos;
  window.toggleSeleccionGrupo = toggleSeleccionGrupo;
  window.guardarGruposPrioritarios = guardarGruposPrioritarios;
  window.removerGrupoGuardado = removerGrupoGuardado;
  window.filtrarGrupos = filtrarGrupos;
  window.reasignarConGruposPrioritarios = reasignarConGruposPrioritarios;
}

console.log('🚀 Sistema de asignación de salones inicializado - Compatible con Apps Script');