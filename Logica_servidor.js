/**
 * Code.gs
 * 
 * LÓGICA DEL SERVIDOR para la aplicación de asignación de salones.
 * 
 * NOTA: Se asume que las clases 'SistemaAsignacion' y 'AsignadorAutomatico'
 * ya han sido convertidas a Apps Script y están disponibles en este mismo archivo
 * o en otro archivo .gs del proyecto.
 */

// --- DEPENDENCIAS GLOBALES (SIMULADAS) ---
// Debes reemplazar estas simulaciones con tus clases reales convertidas.
// Las clases SistemaAsignacion y AsignadorAutomatico ya están definidas en code.js

// --- FUNCIONES DEL SERVIDOR ---

/**
 * Función principal que orquesta el procesamiento y la asignación.
 * Es llamada desde el cliente con los IDs de los archivos y los grupos prioritarios.
 * @param {string[]} fileIds - Array de IDs de archivos en Google Drive.
 * @param {string[]} gruposPrioritarios - Array de IDs de grupos prioritarios.
 * @returns {Object} Un objeto con los resultados para actualizar la UI.
 */
function procesarYAsignar(fileIds, gruposPrioritarios) {
  try {
    // 1. Crear sistema y procesar archivos
    const sistema = new SistemaAsignacion();
    sistema.inicializarSalones();

    // Obtener archivos de Drive usando los IDs
    const archivos = fileIds.map(id => DriveApp.getFileById(id));
    const resultadoProcesamiento = sistema.procesarMultiplesArchivos(archivos);

    if (!resultadoProcesamiento.exito) {
      throw new Error(resultadoProcesamiento.mensaje);
    }

    // 2. Asignar salones
    sistema.ordenarClasesConPrioridades(gruposPrioritarios);
    const asignador = new AsignadorAutomatico(sistema, gruposPrioritarios);
    asignador.asignarSalones();

    // 3. Preparar datos para la interfaz
    const reporte = sistema.generarReporte(asignador.gruposDivididos);
    
    // Convertir Map a Object para que se pueda serializar a JSON
    const gruposDivididosObj = Object.fromEntries(asignador.gruposDivididos);

    const mensaje = `Procesamiento completado. ${sistema.asignaciones.length} clases asignadas. ${sistema.clasesLaboratorio.length} clases de laboratorio excluidas.`;

    return {
      exito: true,
      mensaje: mensaje,
      reporte: reporte,
      datosSalones: sistema.salones,
      datosAsignaciones: sistema.asignaciones,
      gruposDivididos: gruposDivididosObj
    };

  } catch (error) {
    console.error(`Error en procesarYAsignar: ${error.message}`);
    // Devolver un objeto de error para que el cliente lo maneje
    return { exito: false, mensaje: error.message };
  }
}

/**
 * Muestra el selector de archivos de Google Drive para que el usuario elija los archivos.
 * Esta función es llamada por el cliente para iniciar la carga de archivos.
 */
function showFilePicker() {
  const view = new DriveApp.FilePicker()
    .setViewMode(DriveApp.FilePicker.ViewMode.LIST)
    .setIncludeFolders(false)
    .setMimeTypeFilter('text/csv'); // Filtrar para mostrar solo CSVs

  // El callback se ejecuta cuando el usuario selecciona los archivos
  const callback = (response) => {
    if (response.action === 'picked') {
      const fileIds = response.docs.map(doc => doc.id);
      // Llama a una función del cliente con los IDs de los archivos seleccionados
      google.script.run
        .withSuccessHandler(onFilesSelected)
        .withFailureHandler(showError)
        .returnFileIds(fileIds);
    } else if (response.action === 'cancelled') {
      google.script.run
        .withFailureHandler(showError)
        .showNotificacion('Selección de archivos cancelada.', 'info');
    }
  };
  
  // Muestra el diálogo
  view.show(callback);
}

// Esta función es un truco para pasar los IDs del servidor al cliente
function returnFileIds(fileIds) {
  return fileIds;
}

// --- GESTIÓN DE GRUPOS PRIORITARIOS (USANDO PROPERTIESSERVICE) ---

const GRUPOS_PRIORITARIOS_KEY = 'grupos_prioritarios_guardados';

function guardarGruposPrioritarios(grupos) {
  PropertiesService.getUserProperties().setProperty(GRUPOS_PRIORITARIOS_KEY, JSON.stringify(grupos));
}

function cargarGruposPrioritarios() {
  const guardados = PropertiesService.getUserProperties().getProperty(GRUPOS_PRIORITARIOS_KEY);
  return guardados ? JSON.parse(guardados) : [];
}

// --- FUNCIONES DE LA INTERFAZ (LLAMADAS POR EL CLIENTE) ---

// Estas funciones son simples helpers para que el cliente pueda mostrar notificaciones
// o indicadores de carga, ya que el servidor no puede manipular el DOM directamente.
function showNotificacion(message, type) {
  // Esta función será llamada desde el cliente usando withSuccessHandler
  return { message, type };
}

function showIndicadorCarga(show) {
  return show;
}

function showError(error) {
  console.error("Error desde el servidor: " + error.message);
  // Podrías devolver un objeto formateado para el cliente
  return { message: error.message, type: 'error' };
}


// --- FUNCIÓN PARA INICIAR LA APLICACIÓN ---

/**
 * Crea y muestra una barra lateral (sidebar) con la aplicación.
 */
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Asignación de Salones');
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Crea un menú personalizado en la hoja de cálculo para facilitar el acceso.
 */
function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Sistema de Salones')
      .addItem('Mostrar Panel de Control', 'showSidebar')
      .addToUi();
}
