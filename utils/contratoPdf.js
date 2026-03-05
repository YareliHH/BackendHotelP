const PDFDocument = require("pdfkit");

function generarContratoPDF(res, evento) {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=Contrato-${evento.numero_contrato}.pdf`,
  );

  doc.pipe(res);

  // =========================
  // ENCABEZADO
  // =========================

  doc
    .fontSize(18)
    .text("CONTRATO DE PRESTACIÓN DE SERVICIOS", { align: "center" });

  doc.moveDown();

  doc.fontSize(10);
  doc.text(`Contrato No: ${evento.numero_contrato}`);
  doc.text(`Fecha de contrato: ${evento.fecha_contrato}`);
  doc.moveDown();

  // =========================
  // DATOS CLIENTE
  // =========================

  doc.fontSize(12).text("DATOS DEL CLIENTE", { underline: true });
  doc.moveDown(0.5);

  doc.text(`Nombre: ${evento.nombre_contratante}`);
  doc.text(`Teléfono 1: ${evento.telefono1}`);
  doc.text(`Teléfono 2: ${evento.telefono2 || "-"}`);
  doc.text(`Correo: ${evento.email}`);
  doc.text(`Empresa: ${evento.empresa}`);
  doc.text(`RFC: ${evento.rfc}`);
  doc.text(`Dirección Fiscal: ${evento.direccion_fiscal}`);
  doc.moveDown();

  // =========================
  // DATOS EVENTO
  // =========================

  doc.fontSize(12).text("DATOS DEL EVENTO", { underline: true });
  doc.moveDown(0.5);

  doc.text(`Nombre del evento: ${evento.nombre_evento}`);
  doc.text(`Fecha: ${evento.fecha_evento}`);
  doc.text(`Horario: ${evento.hora_inicio} - ${evento.hora_fin}`);
  doc.text(`Duración: ${evento.duracion_horas} horas`);
  doc.text(`Salón: ${evento.nombre_salon}`);
  doc.text(`Número de personas: ${evento.numero_personas}`);
  doc.text(`Método de pago: ${evento.metodo_pago}`);
  doc.moveDown();

  // =========================
  // MONTAJE
  // =========================

  doc.fontSize(12).text("ESPECIFICACIONES DEL MONTAJE", { underline: true });
  doc.moveDown(0.5);
  doc.text(evento.especificaciones_montaje || "No especificado");
  doc.moveDown();

  // =========================
  // SERVICIOS COMPLEMENTARIOS
  // =========================

  doc.fontSize(12).text("SERVICIOS COMPLEMENTARIOS", { underline: true });
  doc.moveDown(0.5);

  doc.text(`Equipo Audiovisual: ${evento.equipo_audiovisual}`);
  doc.text(`Decoración: ${evento.decoracion}`);
  doc.text(`Guardarropa: ${evento.guardarropa}`);
  doc.text(`Uso Salón: ${evento.uso_salon}`);
  doc.text(`Uso Mobiliario: ${evento.uso_mobiliario}`);
  doc.text(`Servicio Meseros: ${evento.servicio_meseros}`);
  doc.text(`Uso Estacionamiento: ${evento.uso_estacionamiento}`);
  doc.text(`Otros: ${evento.otros_servicios || "-"}`);
  doc.moveDown();

  // =========================
  // FINANZAS
  // =========================

  doc.fontSize(12).text("DETALLE FINANCIERO", { underline: true });
  doc.moveDown(0.5);

  const subtotal = Number(evento.subtotal || 0);
  const iva = Number(evento.iva || 0);
  const total = Number(evento.total || 0);
  const montoAnticipo = Number(evento.monto_anticipo || 0);
  const restante = Number(evento.restante || 0);

  doc.text(`Subtotal: $${subtotal.toFixed(2)}`);
  doc.text(`IVA (16%): $${iva.toFixed(2)}`);
  doc.text(`Total: $${total.toFixed(2)}`);
  doc.text(
    `Anticipo (${evento.porcentaje_anticipo}%): $${montoAnticipo.toFixed(2)}`,
  );
  doc.text(`Restante: $${restante.toFixed(2)}`);

  doc.text(`Fecha pago anticipo: ${evento.fecha_pago_anticipo}`);
  doc.moveDown(2);

  // =========================
  // FIRMAS
  // =========================

  doc.text("______________________________");
  doc.text("Firma del Cliente");
  doc.moveDown();

  doc.text("______________________________");
  doc.text("Representante del Hotel");

  doc.end();
}

module.exports = generarContratoPDF;
