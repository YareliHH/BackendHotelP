const PDFDocument = require("pdfkit");
const path = require("path");

// ─── Helpers ────────────────────────────────────────────────────────────────

const GRAY_HEADER = "#d0d0d0";
const GRAY_SECTION = "#e8e8e8";
const BLACK = "#000000";
const DARK = "#1a1a1a";
const PAGE_MARGIN = 40;
const COL_GAP = 12;

const LOGO_PATH = path.join(__dirname, "../assets/logotipoP.png");

/**
 * Formatea una fecha a DD/MM/YYYY.
 * Acepta un string "YYYY-MM-DD", un objeto Date, o cualquier valor parseable.
 */
function formatFecha(valor) {
  if (!valor) return "-";
  const d = new Date(valor);
  if (isNaN(d.getTime())) return String(valor);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Dibuja un rectángulo de fondo con texto CENTRADO (para encabezados de sección).
 */
function sectionHeader(doc, y, label, pageWidth) {
  const w = pageWidth - PAGE_MARGIN * 2;
  doc.rect(PAGE_MARGIN, y, w, 16).fill(GRAY_HEADER);
  doc
    .fillColor(DARK)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(label.toUpperCase(), PAGE_MARGIN + 4, y + 4, {
      width: w - 8,
      align: "center",
      lineBreak: false,
    });
  return y + 16;
}

/**
 * Dibuja una etiqueta pequeña en gris y su valor en negro.
 */
function labelValue(doc, x, y, w, label, value) {
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#555555");
  doc.text(label.toUpperCase(), x, y, { width: w, lineBreak: false });
  doc.font("Helvetica").fontSize(9).fillColor(DARK);
  doc.text(value || "-", x, y + 10, { width: w });
  return doc.y;
}

/**
 * Dibuja dos columnas (izq / der) dentro de una franja, devuelve la Y máxima.
 */
function twoColumns(doc, startY, pageWidth, leftFn, rightFn) {
  const totalW = pageWidth - PAGE_MARGIN * 2;
  const colW = (totalW - COL_GAP) / 2;
  const leftX = PAGE_MARGIN;
  const rightX = PAGE_MARGIN + colW + COL_GAP;

  let leftEndY = startY;
  let rightEndY = startY;

  doc.save();
  leftEndY = leftFn(doc, leftX, startY, colW);
  doc.restore();

  doc.save();
  rightEndY = rightFn(doc, rightX, startY, colW);
  doc.restore();

  const maxY = Math.max(leftEndY, rightEndY);
  doc.y = maxY;
  return maxY;
}

// ─── Generador principal ─────────────────────────────────────────────────────

function generarContratoPDF(res, evento, hotel) {
  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: "LETTER" });
  const pageWidth = doc.page.width;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=Contrato-${evento.numero_contrato}.pdf`
  );
  doc.pipe(res);

  // ── ENCABEZADO ────────────────────────────────────────────────────────────
  const LOGO_W = 80;
  const LOGO_H = 50;

  const logoX = pageWidth - PAGE_MARGIN - LOGO_W;
  try {
    doc.image(LOGO_PATH, logoX, PAGE_MARGIN, {
      width: LOGO_W,
      height: LOGO_H,
      fit: [LOGO_W, LOGO_H],
      align: "center",
      valign: "center",
    });
  } catch (_) {}

  const titleX = PAGE_MARGIN;
  const titleW = pageWidth - PAGE_MARGIN * 2 - LOGO_W - 10;
  const titleTopY = PAGE_MARGIN + 6;

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(DARK)
    .text(
      "CONTRATO DE PRESTACIÓN DE SERVICIOS DE EVENTOS SOCIALES Y EMPRESARIALES",
      titleX,
      titleTopY,
      { align: "center", width: titleW }
    );

  doc
    .font("Helvetica-Oblique")
    .fontSize(7.5)
    .fillColor("#555555")
    .text(
      "(Leer términos, condiciones y cláusula al reverso del documento)",
      titleX,
      doc.y + 2,
      { align: "center", width: titleW }
    );

  const afterTitleY = Math.max(doc.y, PAGE_MARGIN + LOGO_H) + 6;
  doc
    .moveTo(PAGE_MARGIN, afterTitleY)
    .lineTo(pageWidth - PAGE_MARGIN, afterTitleY)
    .strokeColor("#aaaaaa")
    .lineWidth(0.5)
    .stroke();

  // ── FECHA Y Nº CONTRATO ───────────────────────────────────────────────────
  let y = afterTitleY + 8;
  const totalW = pageWidth - PAGE_MARGIN * 2;
  const colW = (totalW - COL_GAP) / 2;

  doc.font("Helvetica-Bold").fontSize(8).fillColor("#555555");
  doc.text("FECHA DE CONTRATO", PAGE_MARGIN, y, { width: colW, lineBreak: false });
  doc.font("Helvetica").fontSize(9).fillColor(DARK);
  doc.text(formatFecha(evento.fecha_contrato), PAGE_MARGIN + 120, y, { lineBreak: false });

  const rightX = PAGE_MARGIN + colW + COL_GAP;
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#555555");
  doc.text("Nº CONTRATO", rightX, y, { lineBreak: false });
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#cc0000")
    .text(evento.numero_contrato || "-", rightX + 80, y, { lineBreak: false });

  y += 20;

  // ── SECCIÓN 1: DATOS DEL CONTRATANTE ──────────────────────────────────────
  y = sectionHeader(doc, y, "1. Datos del contratante", pageWidth);
  y += 6;

  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Nombre del contratante", evento.nombre_contratante); return d.y; },
    (d, x, sy, w) => { labelValue(d, x, sy, w, "E-mail", evento.email); return d.y; }
  );
  y += 6;

  doc.font("Helvetica-Bold").fontSize(7).fillColor("#555555");
  doc.text("DIRECCIÓN", PAGE_MARGIN, y, { width: totalW, lineBreak: false });
  doc.font("Helvetica").fontSize(9).fillColor(DARK);
  doc.text(evento.direccion_fiscal || "-", PAGE_MARGIN, y + 10, { width: totalW });
  y = doc.y + 6;

  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Teléfono 1", evento.telefono1); return d.y; },
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Teléfono 2", evento.telefono2); return d.y; }
  );
  y += 8;

  // ── SECCIÓN 2: DATOS PARA FACTURACIÓN ─────────────────────────────────────
  y = sectionHeader(doc, y, "2. Datos para facturación", pageWidth);
  y += 6;

  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Empresa", evento.empresa); return d.y; },
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Correo electrónico", evento.email); return d.y; }
  );
  y += 6;

  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => { labelValue(d, x, sy, w, "R.F.C", evento.rfc); return d.y; },
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Método de pago", evento.metodo_pago); return d.y; }
  );
  y += 8;

  // ── SECCIÓN 3: DATOS DEL EVENTO ───────────────────────────────────────────
  y = sectionHeader(doc, y, "3. Datos del evento", pageWidth);
  y += 6;

  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Fecha del evento", formatFecha(evento.fecha_evento)); return d.y; },
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Nombre del evento", evento.nombre_evento); return d.y; }
  );
  y += 6;

  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Salón", evento.nombre_salon); return d.y; },
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Duración del evento", `${evento.duracion_horas} HRS`); return d.y; }
  );
  y += 6;

  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Hora de inicio", evento.hora_inicio); return d.y; },
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Hora de finalización", evento.hora_fin); return d.y; }
  );
  y += 6;

  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Nº de personas", String(evento.numero_personas)); return d.y; },
    (d, x, sy, w) => {
      const precio = Number(evento.precio_persona_adicional || 0);
      labelValue(d, x, sy, w, "Precio P.P adicional", `$${precio.toFixed(2)}`);
      return d.y;
    }
  );
  y += 6;

  // ── DESCRIPCIÓN DEL MONTAJE ───────────────────────────────────────────────
  doc.rect(PAGE_MARGIN, y, totalW, 14).fill(GRAY_SECTION);
  doc.fillColor(DARK).font("Helvetica-Bold").fontSize(8)
    .text("DESCRIPCIÓN DEL MONTAJE", PAGE_MARGIN + 4, y + 3, { width: totalW - 8, align: "center", lineBreak: false });
  y += 14;

  doc.font("Helvetica").fontSize(9).fillColor(DARK);
  doc.text(evento.especificaciones_montaje || "No especificado", PAGE_MARGIN + 4, y + 4, { width: totalW - 8 });
  y = doc.y + 10;

  // ── SERVICIOS COMPLEMENTARIOS ─────────────────────────────────────────────
  doc.rect(PAGE_MARGIN, y, totalW, 14).fill(GRAY_SECTION);
  doc.fillColor(DARK).font("Helvetica-Bold").fontSize(8)
    .text("SERVICIOS COMPLEMENTARIOS", PAGE_MARGIN + 4, y + 3, { width: totalW - 8, align: "center", lineBreak: false });
  y += 14 + 6;

  const servicios = [
    ["EQUIPO AUDIOVISUAL", evento.equipo_audiovisual],
    ["DECORACIÓN", evento.decoracion],
    ["GUARDARROPA", evento.guardarropa],
    ["USO SALÓN", evento.uso_salon],
    ["USO MOBILIARIO", evento.uso_mobiliario],
    ["SERVICIO MESEROS", evento.servicio_meseros],
    ["USO ESTACIONAMIENTO", evento.uso_estacionamiento],
    ["OTROS", evento.otros_servicios],
  ];

  const mid = Math.ceil(servicios.length / 2);
  const leftServs = servicios.slice(0, mid);
  const rightServs = servicios.slice(mid);

  const drawServCol = (d, x, sy, w, items) => {
    let cy = sy;
    for (const [lbl, val] of items) {
      d.font("Helvetica-Bold").fontSize(7.5).fillColor("#555555");
      d.text(`${lbl}:`, x, cy, { continued: true });
      d.font("Helvetica").fillColor(DARK).text(` ${val || "-"}`, { lineBreak: false });
      cy = d.y + 3;
    }
    return cy;
  };

  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => drawServCol(d, x, sy, w, leftServs),
    (d, x, sy, w) => drawServCol(d, x, sy, w, rightServs)
  );
  y += 10;

  // ── SECCIÓN 4: DATOS DEL HOTEL ────────────────────────────────────────────
  // Usa el mismo encabezado gris oscuro (GRAY_HEADER) que las demás secciones
  y = sectionHeader(doc, y, "4. Datos del hotel", pageWidth);
  y += 6;

  // Fila 1: Nombre del hotel | Razón social
  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Nombre del hotel", hotel.nombre_hotel); return d.y; },
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Razón social", hotel.razon_social); return d.y; }
  );
  y += 6;

  // Fila 2: RFC | Contacto
  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => { labelValue(d, x, sy, w, "R.F.C", hotel.rfc); return d.y; },
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Contacto", hotel.nombre_contacto); return d.y; }
  );
  y += 6;

  // Fila 3: Teléfono | Email
  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Teléfono", hotel.telefono); return d.y; },
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Email", hotel.email); return d.y; }
  );
  y += 6;

  // Fila 4: Dirección (ancho completo)
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#555555");
  doc.text("DIRECCIÓN", PAGE_MARGIN, y, { width: totalW, lineBreak: false });
  doc.font("Helvetica").fontSize(9).fillColor(DARK);
  doc.text(hotel.direccion || "-", PAGE_MARGIN, y + 10, { width: totalW });
  y = doc.y + 6;

  // Fila 5: Horarios
  labelValue(doc, PAGE_MARGIN, y, totalW, "Horarios", hotel.horarios);
  y = doc.y + 8;

  // ── DETALLE FINANCIERO ────────────────────────────────────────────────────
  y = sectionHeader(doc, y, "Detalle financiero", pageWidth);
  y += 8;

  const subtotal = Number(evento.subtotal || 0);
  const iva = Number(evento.iva || 0);
  const total = Number(evento.total || 0);
  const montoAnticipo = Number(evento.monto_anticipo || 0);
  const restante = Number(evento.restante || 0);
  const pctAnticipo = evento.porcentaje_anticipo || 0;

  const finItems = [
    ["SUBTOTAL", `$${subtotal.toFixed(2)}`],
    ["IVA (16%)", `$${iva.toFixed(2)}`],
  ];

  for (const [lbl, val] of finItems) {
    doc.font("Helvetica").fontSize(9).fillColor(DARK);
    doc.text(`${lbl}: ${val}`, PAGE_MARGIN + 4, y);
    y = doc.y;
  }

  doc.font("Helvetica-Bold").fontSize(10).fillColor(DARK);
  doc.text(`TOTAL: $${total.toFixed(2)}`, PAGE_MARGIN + 4, y);
  y = doc.y;

  doc.font("Helvetica").fontSize(9).fillColor(DARK);
  doc.text(`ANTICIPO (${pctAnticipo}%): $${montoAnticipo.toFixed(2)}`, PAGE_MARGIN + 4, y);
  y = doc.y;
  doc.text(`RESTANTE: $${restante.toFixed(2)}`, PAGE_MARGIN + 4, y);
  y = doc.y + 4;

  if (evento.fecha_pago_anticipo) {
    doc.text(`FECHA PAGO ANTICIPO: ${formatFecha(evento.fecha_pago_anticipo)}`, PAGE_MARGIN + 4, y);
    y = doc.y;
  }

  // ── FIRMAS ────────────────────────────────────────────────────────────────
  y += 40;
  const firmaW = 160;
  const firmaLeftX = PAGE_MARGIN + 20;
  const firmaRightX = pageWidth - PAGE_MARGIN - firmaW - 20;

  doc.moveTo(firmaLeftX, y).lineTo(firmaLeftX + firmaW, y).strokeColor(DARK).lineWidth(0.8).stroke();
  doc.moveTo(firmaRightX, y).lineTo(firmaRightX + firmaW, y).stroke();

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(DARK)
    .text("Firma del Cliente", firmaLeftX, y + 4, { width: firmaW, align: "center" })
    .text("Representante del Hotel", firmaRightX, y + 4, { width: firmaW, align: "center" });

  doc.end();
}

module.exports = generarContratoPDF;