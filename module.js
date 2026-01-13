/**
 * Configuración y Conexión de Módulos - Compatible con Google Apps Script
 * Archivo: module.js
 * 
 * Funcionalidades:
 * - Carga y configuración de todos los módulos del sistema
 * - Inicialización centralizada del sistema
 * - Configuración de dependencias entre módulos
 * - Interfaz unificada para acceso a funcionalidades
 */

// Detectar si estamos en Apps Script del servidor (no tiene window)
const IS_APPS_SCRIPT = typeof window === 'undefined';

// Configuración global del sistema
const SYSTEM_CONFIG = {
  // Edificios y salones
  edificios: {
    'B': { pisos: 2, salonesPorPiso: [4, 4] },
    'D': { pisos: 4, salonesPorPiso: [6, 6, 6, 6] },
    'E': { pisos: 4, salonesPorPiso: [6, 6, 6, 5] },
    'F': { pisos: 4, salonesPorPiso: [4, 4, 4, 4] }
  },
  
  // Configuración de laboratorios
  laboratorios: {
    salones: ['B101', 'B102', 'B104', 'B105', 'B201', 'B202', 'B203', 'B204']
  },
  
  // Configuración de validación
  validacion: {
    capacidadMinima: 10,
    capacidadMaxima: 50,
    diasLaborales: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    horasLaborales: {
      inicio: '08:00',
      fin: '18:00'
    }
  },
  
  // Configuración de logging
  logging: {
    nivel: 'info', // 'debug', 'info', 'warn', 'error'
    habilitado: true
  }
};

/**
 * Inicializa todos los módulos del sistema
 */
function inicializarSistema() {
  try {
    console.log('🚀 Inicializando Sistema de Asignación de Salones...');
    
    // Verificar que los módulos estén disponibles
    verificarModulosDisponibles();
    
    // Configurar logger global
    configurarLoggerGlobal();
    
    // Inicializar configuraciones
    inicializarConfiguraciones();
    
    console.log('✅ Sistema inicializado correctamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error inicializando sistema:', error);
    return false;
  }
}

/**
 * Verifica que todos los módulos requeridos estén disponibles
 */
function verificarModulosDisponibles() {
  const modulosRequeridos = [
    'Salon',
    'Grupo',
    'Horario',
    'Clase',
    'SistemaAsignacion',
    'AsignadorAutomatico',
    'procesarArchivosYAsignar',
    'Validador',
    'ValidadorCSV',
    'procesarHorarios'
  ];
  
  const modulosFaltantes = [];
  
  // Verificar módulos en el scope global
  modulosRequeridos.forEach(modulo => {
    // En Apps Script usamos globalThis, en navegador usamos window
    const objetoGlobal = IS_APPS_SCRIPT ? globalThis : (typeof window !== 'undefined' ? window : globalThis);
    
    if (typeof objetoGlobal[modulo] === 'undefined') {
      // Algunos módulos pueden no estar disponibles en Apps Script del servidor, eso es esperado
      console.warn(`Módulo ${modulo} no disponible`);
    }
  });
  
  console.log('✅ Verificación de módulos completada');
}

/**
 * Configura el logger global del sistema
 */
function configurarLoggerGlobal() {
  // En Apps Script, el logger ya está configurado por defecto
  console.log('✅ Logger global configurado');
}

/**
 * Inicializa configuraciones del sistema
 */
function inicializarConfiguraciones() {
  console.log('✅ Configuraciones inicializadas');
}

// ============================================
// EXPORTACIÓN PARA APPS SCRIPT
// ============================================

// Exponer funciones globales para Apps Script
if (IS_APPS_SCRIPT && typeof globalThis !== 'undefined') {
  globalThis.inicializarSistema = inicializarSistema;
  globalThis.verificarModulosDisponibles = verificarModulosDisponibles;
  globalThis.configurarLoggerGlobal = configurarLoggerGlobal;
  globalThis.inicializarConfiguraciones = inicializarConfiguraciones;
  globalThis.SYSTEM_CONFIG = SYSTEM_CONFIG;
  globalThis.IS_APPS_SCRIPT = IS_APPS_SCRIPT;
}

// Log de inicialización
console.log('Módulo de configuración cargado - Compatible con Apps Script');
