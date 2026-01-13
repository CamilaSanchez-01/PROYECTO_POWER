/**
 * NOTA: Este código ha sido adaptado para Google Apps Script.
 * 
 * CAMBIOS PRINCIPALES:
 * 1. La función `procesarArchivoCSV` ya no es `async` y no usa `FileReader`.
 * 2. Ahora recibe el `fileId` de un archivo en Google Drive en lugar de un objeto `File`.
 * 3. Se utiliza `DriveApp.getFileById()` y `getBlob().getDataAsString()` para leer el contenido.
 * 4. Se ha reemplazado la dependencia de `ValidadorCSV._parsearHora` con una función local.
 * 5. Se ha eliminado `export default` para hacerlo una función global en el proyecto.
 */

/**
 * Convierte una cadena de hora "HH:MM" a minutos para facilitar la comparación.
 * @param {string} hora - La hora en formato "HH:MM".
 * @returns {number} La hora convertida a minutos desde medianoche.
 */
function parsearHoraA_Minutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Procesa un archivo CSV desde Google Drive y lo convierte a un array de objetos.
 * @param {string} fileId - El ID del archivo CSV en Google Drive.
 * @returns {Array<Object>} Un array de objetos con los datos del CSV.
 * @throws {Error} Si el archivo no se encuentra, es inválido o tiene datos incorrectos.
 */
function procesarArchivoCSV(fileId) {
  try {
    // 1. Obtener el archivo desde Google Drive usando su ID
    const archivo = DriveApp.getFileById(fileId);
    const fileName = archivo.getName();

    // 2. Validar tipo de archivo por su nombre
    if (!fileName.match(/\.(csv)$/i)) {
      throw new Error(`ARCHIVO_INVALIDO: El archivo "${fileName}" debe ser un archivo CSV.`);
    }

    // 3. Leer el contenido del archivo como texto
    // En Apps Script esto es síncrono, no se necesita FileReader ni Promesas.
    const contenido = archivo.getBlob().getDataAsString();

    // 4. Validar la estructura del CSV (encabezados y formato de columnas)
    validarEstructuraCSV(contenido, fileName);

    // 5. Convertir el contenido CSV a un array de objetos
    const datos = parsearCSV(contenido);
    
    // 6. Validar los datos adicionales (lógica de negocio)
    validarDatosAdicionales(datos, fileName);

    console.log(`Archivo "${fileName}" procesado exitosamente. Se encontraron ${datos.length} filas de datos.`);
    return datos;

  } catch (error) {
    console.error(`Error al procesar el archivo con ID ${fileId}: ${error.message}`);
    // Relanzamos el error para que la función que lo llamó pueda manejarlo.
    throw error;
  }
}

/**
 * Valida datos adicionales en el CSV ya parseado.
 * @param {Array<Object>} datos - Array de objetos con los datos del CSV.
 * @param {string} fileName - Nombre del archivo para mensajes de error.
 * @throws {Error} Si hay datos inválidos.
 */
function validarDatosAdicionales(datos, fileName) {
  for (let i = 0; i < datos.length; i++) {
    const fila = datos[i];
    const numeroFila = i + 2; // +2 porque la fila 1 es el encabezado y los arrays empiezan en 0.
     
    // Validar que la capacidad sea un número positivo
    if (isNaN(parseInt(fila.capacidad)) || parseInt(fila.capacidad) <= 0) {
      throw new Error(`CSV_INVALIDO: Capacidad inválida ("${fila.capacidad}") en la fila ${numeroFila} del archivo "${fileName}"`);
    }
     
    // Validar que el grupo sea válido (3 dígitos o "VIR")
    if (fila.grupo !== 'VIR' && !fila.grupo.match(/^\d{3}$/)) {
      throw new Error(`CSV_INVALIDO: Grupo inválido ("${fila.grupo}") en la fila ${numeroFila} del archivo "${fileName}"`);
    }
     
    // Validar que la hora de inicio sea menor que la hora de fin
    const horaInicio = parsearHoraA_Minutos(fila.hora_inicio);
    const horaFin = parsearHoraA_Minutos(fila.hora_fin);
     
    if (horaInicio >= horaFin) {
      throw new Error(`CSV_INVALIDO: La hora de inicio (${fila.hora_inicio}) es mayor o igual a la hora de fin (${fila.hora_fin}) en la fila ${numeroFila} del archivo "${fileName}"`);
    }
  }
}

/**
 * Valida la estructura del CSV (encabezados y formato de columnas).
 * @param {string} contenido - Contenido del archivo CSV.
 * @param {string} fileName - Nombre del archivo para mensajes de error.
 * @throws {Error} Si la estructura es inválida.
 */
function validarEstructuraCSV(contenido, fileName) {
  const lineas = contenido.split('\n').filter(linea => linea.trim() !== '');
  if (lineas.length < 2) {
    throw new Error(`CSV_INVALIDO: El archivo "${fileName}" debe contener al menos una fila de datos además del encabezado.`);
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

  // Validar formato de cada fila de datos
  for (let i = 1; i < lineas.length; i++) {
    const valores = lineas[i].split(',').map(c => c.trim());
    const numeroFila = i + 1;
    
    if (valores.length !== encabezados.length) {
      throw new Error(`CSV_INVALIDO: La fila ${numeroFila} del archivo "${fileName}" tiene ${valores.length} columnas, pero se esperaban ${encabezados.length}.`);
    }

    // Validar formato de id_unico (número)
    if (!valores[0].match(/^\d+$/)) {
      throw new Error(`CSV_INVALIDO: Formato de id_unico inválido ("${valores[0]}") en la fila ${numeroFila} del archivo "${fileName}". Debe ser un número.`);
    }

    // Validar formato de capacidad (número)
    if (!valores[6].match(/^\d+$/)) {
      throw new Error(`CSV_INVALIDO: Formato de capacidad inválido ("${valores[6]}") en la fila ${numeroFila} del archivo "${fileName}". Debe ser un número.`);
    }

    // Validar formato de grupo (número de 3 dígitos o "VIR")
    if (!valores[7].match(/^\d{3}$/) && valores[7] !== 'VIR') {
      throw new Error(`CSV_INVALIDO: Formato de grupo inválido ("${valores[7]}") en la fila ${numeroFila} del archivo "${fileName}". Debe ser un número de 3 dígitos o "VIR".`);
    }

    // Validar formato de hora (HH:MM)
    const formatoHora = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!valores[9].match(formatoHora) || !valores[10].match(formatoHora)) {
      throw new Error(`CSV_INVALIDO: Formato de hora inválido en la fila ${numeroFila} del archivo "${fileName}". Debe ser HH:MM.`);
    }

    // Validar modalidad (Presencial o Virtual)
    if (!['Presencial', 'Virtual'].includes(valores[12])) {
      throw new Error(`CSV_INVALIDO: Modalidad inválida ("${valores[12]}") en la fila ${numeroFila} del archivo "${fileName}". Debe ser "Presencial" o "Virtual".`);
    }
  }
}

/**
 * Parsea el contenido de un string CSV a un array de objetos.
 * @param {string} contenido - Contenido completo del CSV.
 * @returns {Array<Object>} Array de objetos, donde cada objeto representa una fila.
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


// --- FUNCIÓN DE EJEMPLO PARA SU USO EN GOOGLE APPS SCRIPT ---

/**
 * Función de prueba para demostrar cómo usar `procesarArchivoCSV`.
 * 
 * ANTES DE EJECUTAR:
 * 1. Crea un archivo CSV en tu Google Drive con el formato correcto.
 * 2. Copia el ID de ese archivo (está en la URL: .../drive/folders/FILE_ID_HERE/...).
 * 3. Pega el ID en la variable `TEST_FILE_ID` a continuación.
 */
function testProcesarCSV() {
  // ¡IMPORTANTE! Reemplaza con el ID de tu archivo CSV de prueba en Google Drive.
  const TEST_FILE_ID = '1aBcDeFgHiJkLmNoPqRsTuVwXyZ_1234567890abcdef'; 

  try {
    console.log(`Iniciando prueba de procesamiento para el archivo con ID: ${TEST_FILE_ID}`);
    
    // Llama a la función principal con el ID del archivo
    const datosProcesados = procesarArchivoCSV(TEST_FILE_ID);
    
    // Muestra los resultados en el log de la ejecución
    console.log('--- PROCESAMIENTO EXITOSO ---');
    console.log(`Se procesaron ${datosProcesados.length} registros.`);
    console.log('Primer registro como ejemplo:');
    console.log(datosProcesados[0]);
    
    // Opcional: Crear una nueva hoja de cálculo con los datos procesados para verificar visualmente
    const ss = SpreadsheetApp.create('Datos Procesados CSV - ' + new Date().toISOString());
    const sheet = ss.getActiveSheet();
    
    // Añadir encabezados
    const encabezados = Object.keys(datosProcesados[0]);
    sheet.appendRow(encabezados);
    
    // Añadir filas de datos
    datosProcesados.forEach(fila => {
      sheet.appendRow(encabezados.map(encabezado => fila[encabezado]));
    });
    
    console.log(`Se ha creado una nueva hoja de cálculo con los resultados: ${ss.getUrl()}`);
    
  } catch (error) {
    // Si algo falla, el error será capturado y mostrado en el log.
    console.error('--- LA PRUEBA FALLÓ ---');
    console.error(error.message);
  }
}