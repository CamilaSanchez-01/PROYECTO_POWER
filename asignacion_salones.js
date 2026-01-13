/**
 * Code.gs
 * 
 * LÓGICA DEL SERVIDOR para la aplicación de asignación de salones.
 * 
 * CAMBIOS CLAVE:
 * 1. Todas las clases y la lógica de procesamiento ahora viven aquí.
 * 2. La carga de archivos se hace con DriveApp.getFileById() en lugar de FileReader.
 * 3. El almacenamiento de grupos prioritarios usa PropertiesService en lugar de localStorage.
 * 4. Se crean funciones de "API" que el cliente llama con google.script.run.
 */

// ============================================
// CLASES DEL MODELO DE DATOS (IDÉNTICAS A LAS ORIGINALES)
// ============================================
// (Pega aquí todas las clases: Clase, Grupo, Horario, Salon, etc.)
// ... [Clase, Grupo, Horario, Salon] ...
// NOTA: Las clases Clase, Grupo, Horario y Salon ya están definidas en code.js

// ============================================
// CLASES DE LÓGICA DE NEGOCIO (IDÉNTICAS A LAS ORIGINALES)
// ============================================
// (Pega aquí las clases: SistemaAsignacion, AsignadorAutomatico, AssignmentOptimizer)
// ... [SistemaAsignacion, AsignadorAutomatico, AssignmentOptimizer] ...

// La clase SistemaAsignacion ya está definida en code.js

// La clase AsignadorAutomatico ya está definida en code.js

class AssignmentOptimizer {
  // ... (contenido de la clase original, sin cambios)
}


// ============================================
// FUNCIONES DE API (LLAMADAS POR EL CLIENTE)
// ============================================

/**
 * Función principal que orquesta el procesamiento y la asignación.
 * @param {string[]} fileIds - Array de IDs de archivos en Google Drive.
 * @param {string[]} gruposPrioritarios - Array de IDs de grupos prioritarios.
 * @returns {Object} Un objeto con los resultados para actualizar la UI.
 */
function procesarYAsignar(fileIds, gruposPrioritarios) {
  try {
    // 1. Crear sistema y procesar archivos
    const sistema = new SistemaAsignacion();
    sistema.inicializarSalones();
    sistema.procesarMultiplesArchivos(fileIds); // Ya no es async en el servidor

    // 2. Asignar salones
    sistema.ordenarClasesConPrioridades(gruposPrioritarios);
    const asignador = new AsignadorAutomatico(sistema, gruposPrioritarios);
    asignador.asignarSalones();

    // 3. Optimización
    const optimizer = new AssignmentOptimizer(sistema);
    optimizer.optimize();

    // 4. Preparar datos para la interfaz
    const reporte = sistema.generarReporte(asignador.gruposDivididos);
    
    // Convertir Map a Object para que se pueda serializar a JSON
    const gruposDivididosObj = asignador.gruposDivididos.size > 0 ? Object.fromEntries(asignador.gruposDivididos) : null;

    return {
      exito: true,
      mensaje: `Procesamiento completado. ${sistema.asignaciones.length} clases asignadas.`,
      reporte: reporte,
      datosSalones: sistema.salones,
      datosAsignaciones: sistema.asignaciones,
      gruposDivididos: gruposDivididosObj
    };

  } catch (error) {
    console.error(`Error en procesarYAsignar: ${error.message}`);
    return { exito: false, mensaje: error.message };
  }
}

/**
 * Muestra el selector de archivos de Google Drive.
 */
function showFilePicker() {
  const view = new DriveApp.FilePicker()
    .setViewMode(DriveApp.FilePicker.ViewMode.LIST)
    .setIncludeFolders(false)
    .setMimeTypeFilter('text/csv');

  const callback = (response) => {
    if (response.action === 'picked') {
      const fileIds = response.docs.map(doc => doc.id);
      // Llama a una función del cliente con los IDs
      google.script.run
        .withSuccessHandler(onFilesSelected)
        .withFailureHandler(showError)
        .returnFileIds(fileIds);
    }
  };
  view.show(callback);
}

function returnFileIds(fileIds) {
  return fileIds;
}

// --- GESTIÓN DE GRUPOS PRIORITARIOS (USANDO PROPERTIESSERVICE) ---

// Las funciones de gestión de grupos prioritarios están definidas en Logica_servidor.js

// --- FUNCIONES DE LA INTERFAZ (LLAMADAS POR EL CLIENTE) ---

function showNotificacion(message, type) {
  return { message, type };
}

function showIndicadorCarga(show) {
  return show;
}

function showError(error) {
  console.error("Error desde el servidor: " + error.message);
  return { message: error.message, type: 'error' };
}


// --- FUNCIÓN PARA INICIAR LA APLICACIÓN ---

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Sistema de Asignación de Salones');
  SpreadsheetApp.getUi().showSidebar(html);
}

function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Sistema de Salones')
      .addItem('Mostrar Panel de Control', 'showSidebar')
      .addToUi();
}