function main(workbook: ExcelScript.Workbook) {
    // Definición de constantes para nombres de hojas y tablas
    const SHEET_DATOS_NAME = "JUNIO";
    const TABLE_NAME = "Tabla88621556816171820232425"; // ¡NOMBRE DE LA TABLA CORREGIDO!
    const SHEET_REPORTE_NAME = "Status de whatsapp";

    // --- Validación inicial y limpieza de la hoja de reporte ---
    const hojaReporte = workbook.getWorksheet(SHEET_REPORTE_NAME);
    if (!hojaReporte) {
        const errorMessage = `❌ Error: No se encontró la hoja '${SHEET_REPORTE_NAME}'. Creando la hoja...`;
        console.log(errorMessage);
        try {
            workbook.addWorksheet(SHEET_REPORTE_NAME);
            const newHojaReporte = workbook.getWorksheet(SHEET_REPORTE_NAME);
            if (newHojaReporte) {
                newHojaReporte.getRange("A1").setValue("Hoja de reporte creada. Por favor, ejecuta el script nuevamente.");
            }
            return;
        } catch (e) {
            console.log(`Error al crear la hoja: ${e}`);
            return;
        }
    }

    // Limpiar contenido previo en la hoja de reporte
    hojaReporte.getRange("A1:Z1000").clear();

    // --- Obtener la hoja y tabla de datos ---
    const sheetDatos = workbook.getWorksheet(SHEET_DATOS_NAME);
    if (!sheetDatos) {
        const errorMessage = `❌ Error: No se encontró la hoja '${SHEET_DATOS_NAME}'. Asegúrate de que la hoja exista.`;
        hojaReporte.getRange("A1").setValue(errorMessage);
        console.log(errorMessage);
        return;
    }

    const table = sheetDatos.getTable(TABLE_NAME);
    if (!table) {
        const errorMessage = `❌ Error: No se encontró la tabla '${TABLE_NAME}' en la hoja '${SHEET_DATOS_NAME}'. Asegúrate de que el nombre de la tabla sea correcto.`;
        hojaReporte.getRange("A1").setValue(errorMessage);
        console.log(errorMessage);
        return;
    }

    // Obtener todas las filas (sin encabezados ni totales)
  const rows = table.getRangeBetweenHeaderAndTotal().getTexts();

    // Definimos tipo para alerta
    interface Alerta {
        Alerta: string | number | null;
        Reportado: string | number | null;
        Estados: string | number | null;
        Actualizacion: string | number | null;
        Banco: string | number | null; // Añadimos Banco para las alertas externas
    }

    // NOMBRES EXACTOS DE LOS ENCABEZADOS DE LA TABLA SEGÚN TU IMAGEN
    const HEADERS_REQUIRED = [
        "BANCO",
        "ALERTA",
        "Reportado",
        "Estados",
        "Actualizacion/ticket"
    ];

    // Obtener los índices de las columnas
    const headers = table.getHeaderRowRange().getValues()[0] as string[];
    const idxBanco = headers.indexOf(HEADERS_REQUIRED[0]);
    const idxAlerta = headers.indexOf(HEADERS_REQUIRED[1]);
    const idxReportado = headers.indexOf(HEADERS_REQUIRED[2]);
    const idxEstados = headers.indexOf(HEADERS_REQUIRED[3]);
    const idxActualizacion = headers.indexOf(HEADERS_REQUIRED[4]);

    if (
        idxBanco === -1 ||
        idxAlerta === -1 ||
        idxReportado === -1 ||
        idxEstados === -1 ||
        idxActualizacion === -1
    ) {
        const missingHeaders = HEADERS_REQUIRED.filter(header => headers.indexOf(header) === -1);
        const errorMessage = `❌ Error: Faltan columnas requeridas en la tabla '${TABLE_NAME}'. Asegúrate de que existan las siguientes columnas (el nombre debe ser exacto, incluyendo mayúsculas/minúsculas): ${missingHeaders.join(", ")}.`;
        hojaReporte.getRange("A1").setValue(errorMessage);
        console.log(errorMessage);
        return;
    }

    // --- FILTRO DE ESTADOS: Ajusta estos valores según los estados que NO quieres mostrar como "en curso" ---
    const estadosExcluidos = ["Cerrado", "Resuelto", "Finalizado", "Completado", "Cerrada", "RESOLVIDA"];

    // Mapa para agrupar alertas por banco y una lista para alertas de servicios externos
    const alertasInternasPorBanco: { [key: string]: Alerta[] } = {
        "BSC": [],
        "BER": [],
        "BSF": [],
        "BSJ": []
    };
    const alertasServiciosExternos: Alerta[] = [];

    // Agrupar filas por banco o como servicio externo
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const bancoRaw = row[idxBanco];
        const banco = bancoRaw ? bancoRaw.toString().trim() : "";
        const estadoRaw = row[idxEstados];
        const estado = estadoRaw ? estadoRaw.toString().trim() : "";

        // Solo considerar alertas que no estén en los estados excluidos
        if (!estadosExcluidos.includes(estado)) {
            const alerta: Alerta = {
                Alerta: row[idxAlerta],
                Reportado: row[idxReportado],
                Estados: row[idxEstados],
                Actualizacion: row[idxActualizacion],
                Banco: banco // Guardar el banco para las alertas externas también
            };

            if (alertasInternasPorBanco[banco]) {
                alertasInternasPorBanco[banco].push(alerta);
            } else {
                // Si el banco no está en nuestra lista predefinida, lo consideramos un servicio externo
                alertasServiciosExternos.push(alerta);
            }
        }
    }

    // --- Construcción del reporte final ---
    let resultado = "Estimados, envío el reporte de status de los servicios:\n\n";

    // 1. Bloque de servicios internos por banco (parte fija)
    const bancosOrden = ["BSC", "BER", "BSF", "BSJ"]; // Definir orden de bancos
    for (const banco of bancosOrden) {
        resultado += `✅${banco} HBI\n`;
        resultado += `✅${banco} BEE\n`;
        resultado += `✅Sitio Institucional\n`; // Nota: En tu ejemplo, no tiene el nombre del banco aquí
        resultado += `✅Visualización de saldos\n`;
        resultado += `✅Mobile ${banco}\n`;
        resultado += `✅Web ${banco}\n`;
        resultado += `✅Billetera ${banco}\n\n`;
    }

    // 2. Bloque de Servicios Externos (mezclando fijos con alertas)
    resultado += "Servicios externos :\n\n";

    const serviciosExternosFijos = [
        "COELSA",
        "PRISMA",
        "CREDENCIAL",
        "AFIP",
        "RENAPER",
        "VU SECURITY",
        "MovilGate",
        "Nosis",
        "Pago Macro",
        "LINK",
        "MODO"
    ];

    for (const servicio of serviciosExternosFijos) {
        const alertasParaEsteServicio = alertasServiciosExternos.filter(alerta =>
            alerta.Banco && alerta.Banco.toString().toUpperCase().includes(servicio.toUpperCase())
        );

        if (alertasParaEsteServicio.length > 0) {
            // Si hay alertas para este servicio, las imprimimos con ⚠
            for (const alerta of alertasParaEsteServicio) {
                let ticket = alerta.Actualizacion;
                if (typeof ticket === 'number') {
                    ticket = Math.trunc(ticket).toString();
                } else if (ticket !== null && ticket !== undefined) {
                    ticket = ticket.toString().trim();
                } else {
                    ticket = 'N/A';
                }
                // Ajustamos el formato para que coincida con tu ejemplo
                resultado += `⚠${servicio} | ${alerta.Alerta} | Reportado: ${alerta.Reportado} | Estado: ${alerta.Estados} | Ticket: ${ticket}\n`;
            }
        } else {
            // Si no hay alertas, marcamos con ✅
            resultado += `✅${servicio}\n`;
        }
    }
    resultado += `\n`;

    // 3. Bloque de Detalles Adicionales (Alertas en curso por Banco)
    resultado += "Detalles adicionales :\n\n";

    for (const banco of bancosOrden) {
        resultado += `${banco}:\n`;
        const alertas = alertasInternasPorBanco[banco];
        if (alertas.length > 0) {
            alertas.sort((a, b) => { // Opcional: Ordenar las alertas por Alerta
                const alertaA = a.Alerta ? a.Alerta.toString().toLowerCase() : '';
                const alertaB = b.Alerta ? b.Alerta.toString().toLowerCase() : '';
                return alertaA.localeCompare(alertaB);
            });
            for (const alerta of alertas) {
                let ticket = alerta.Actualizacion;
                if (typeof ticket === 'number') {
                    ticket = Math.trunc(ticket).toString();
                } else if (ticket !== null && ticket !== undefined) {
                    ticket = ticket.toString().trim();
                } else {
                    ticket = 'N/A';
                }
                resultado += ` - Alerta: ${alerta.Alerta} | Reportado: ${alerta.Reportado} | Estado: ${alerta.Estados} | Ticket: ${ticket}\n`;
            }
        } else {
            resultado += ` 0 alertas en curso.\n`; // Mensaje si no hay alertas para el banco
        }
        resultado += `\n`; // Salto de línea entre bancos
    }


    // Insertar resultado en la hoja "Status de whatsapp"
    hojaReporte.getRange("A1").setValue(resultado);

    // Mostrar resultado en consola también
    console.log(resultado);
}