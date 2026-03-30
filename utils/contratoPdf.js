const PDFDocument = require("pdfkit");
const path = require("path");

// ─── Constantes ──────────────────────────────────────────────────────────────
const GRAY_HEADER  = "#d0d0d0";
const GRAY_SECTION = "#e8e8e8";
const BLACK        = "#000000";
const DARK         = "#1a1a1a";
const PAGE_MARGIN  = 40;
const COL_GAP      = 12;

const LOGO_PATH = path.join(__dirname, "../assets/logotipoP.png");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFecha(valor) {
  if (!valor) return "-";
  const str = String(valor);
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const d = new Date(valor);
  if (isNaN(d.getTime())) return str;
  const dd   = String(d.getDate()).padStart(2, "0");
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

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

function labelValue(doc, x, y, w, label, value) {
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#555555");
  doc.text(label.toUpperCase(), x, y, { width: w, lineBreak: false });
  doc.font("Helvetica").fontSize(9).fillColor(DARK);
  doc.text(value || "-", x, y + 10, { width: w });
  return doc.y;
}

function twoColumns(doc, startY, pageWidth, leftFn, rightFn) {
  const totalW = pageWidth - PAGE_MARGIN * 2;
  const colW   = (totalW - COL_GAP) / 2;
  const leftX  = PAGE_MARGIN;
  const rightX = PAGE_MARGIN + colW + COL_GAP;

  let leftEndY  = startY;
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

function checkPageBreak(doc, y, neededSpace) {
  if (y + neededSpace > doc.page.height - PAGE_MARGIN) {
    doc.addPage();
    return PAGE_MARGIN;
  }
  return y;
}

// ─── Generador principal ─────────────────────────────────────────────────────

function generarContratoPDF(res, evento, hotel, servicios = []) {
  const doc       = new PDFDocument({ margin: PAGE_MARGIN, size: "LETTER" });
  const pageWidth = doc.page.width;
  const totalW    = pageWidth - PAGE_MARGIN * 2;
  const colW      = (totalW - COL_GAP) / 2;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=Contrato-${evento.numero_contrato}.pdf`
  );
  doc.pipe(res);

  // ── ENCABEZADO ─────────────────────────────────────────────────────────────
  const LOGO_W = 80;
  const LOGO_H = 50;
  const logoX  = pageWidth - PAGE_MARGIN - LOGO_W;

  try {
    doc.image(LOGO_PATH, logoX, PAGE_MARGIN, {
      width: LOGO_W,
      height: LOGO_H,
      fit: [LOGO_W, LOGO_H],
      align: "center",
      valign: "center",
    });
  } catch (_) {}

  const titleX    = PAGE_MARGIN;
  const titleW    = pageWidth - PAGE_MARGIN * 2 - LOGO_W - 10;
  const titleTopY = PAGE_MARGIN + 6;

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(DARK)
    .text(
      "CONTRATO DE PRESTACIÓN DE SERVICIOS DE EVENTOS SOCIALES Y EMPRESARIALES",
      titleX, titleTopY,
      { align: "center", width: titleW }
    );

  doc
    .font("Helvetica-Oblique")
    .fontSize(7.5)
    .fillColor("#555555")
    .text(
      "(Leer términos, condiciones y cláusula al reverso del documento)",
      titleX, doc.y + 2,
      { align: "center", width: titleW }
    );

  const afterTitleY = Math.max(doc.y, PAGE_MARGIN + LOGO_H) + 6;
  doc
    .moveTo(PAGE_MARGIN, afterTitleY)
    .lineTo(pageWidth - PAGE_MARGIN, afterTitleY)
    .strokeColor("#aaaaaa")
    .lineWidth(0.5)
    .stroke();

  // ── FECHA Y Nº CONTRATO ────────────────────────────────────────────────────
  let y = afterTitleY + 8;

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
  y = checkPageBreak(doc, y, 80);
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
  y = checkPageBreak(doc, y, 80);
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

  doc
    .moveTo(PAGE_MARGIN, y)
    .lineTo(pageWidth - PAGE_MARGIN, y)
    .strokeColor("#aaaaaa")
    .lineWidth(0.5)
    .stroke();
  y += 4;

  doc.font("Helvetica-Bold").fontSize(7).fillColor("#555555");
  doc.text("NOTA:", PAGE_MARGIN, y, { continued: true });
  doc.font("Helvetica").fillColor(DARK);
  doc.text(
    " LA ELABORACIÓN DE LA FACTURA SOLO TENDRÁ VIGENCIA DOS DÍAS POSTERIORES AL EVENTO REALIZADO.",
    { width: totalW }
  );
  y = doc.y + 8;

  // ── SECCIÓN 3: DATOS DEL EVENTO ───────────────────────────────────────────
  y = checkPageBreak(doc, y, 120);
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
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Duración del evento", `${evento.duracion_horas || "-"} HRS`); return d.y; }
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
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Nº de personas", String(evento.numero_personas || "-")); return d.y; },
    (d, x, sy, w) => {
      const precio = Number(evento.precio_persona_adicional || 0);
      labelValue(d, x, sy, w, "Precio P.P adicional", `$${precio.toFixed(2)}`);
      return d.y;
    }
  );
  y += 8;

  // ── DETALLE DE MENÚ ────────────────────────────────────────────────────────
  if (servicios.length > 0) {
    y = checkPageBreak(doc, y, 100);

    // Título con mismo estilo que todas las secciones
    y = sectionHeader(doc, y, "Descripción del menú", pageWidth);
    y += 8;

    // Columnas numéricas (derecha de la página)
    const nombreW = totalW * 0.50;   // ancho para la parte izquierda (nombre + secciones)
    const cColW   = 58;
    const cPreX   = PAGE_MARGIN + totalW * 0.55;
    const cPaxX   = PAGE_MARGIN + totalW * 0.70;
    const cSubX   = PAGE_MARGIN + totalW * 0.83;

    // Encabezado naranja de columnas (igual a la imagen de referencia)
    doc.rect(cPreX, y, cColW * 3 + 4, 14).fill("#f4b183");
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(8);
    doc.text("PRECIO",   cPreX, y + 3, { width: cColW, align: "center", lineBreak: false });
    doc.text("PAX",      cPaxX, y + 3, { width: cColW, align: "center", lineBreak: false });
    doc.text("SUBTOTAL", cSubX, y + 3, { width: cColW, align: "center", lineBreak: false });
    y += 20;

    servicios.forEach((servicio) => {
      y = checkPageBreak(doc, y, 50);

      const precio    = Number(servicio.precio_unitario || 0);
      const pax       = Number(evento.numero_personas   || 0);
      const subtotalS = precio * pax;

      // ── Fila: nombre del servicio (izquierda) + números (derecha) en la misma Y ──
      const rowY = y;

      // Nombre del servicio — bold, alineado verticalmente con los números
      doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK);
      doc.text(
        `${servicio.nombre.toUpperCase()}:`,
        PAGE_MARGIN,
        rowY,
        { width: nombreW, lineBreak: false }
      );

      // Números en exactamente la misma Y que el nombre
      doc.font("Helvetica").fontSize(9).fillColor(DARK);
      doc.text(`$${precio.toFixed(2)}`,    cPreX, rowY, { width: cColW, align: "center", lineBreak: false });
      doc.text(`${pax}`,                   cPaxX, rowY, { width: cColW, align: "center", lineBreak: false });
      doc.text(`$${subtotalS.toFixed(2)}`, cSubX, rowY, { width: cColW, align: "center", lineBreak: false });

      y = rowY + 16;

      // ── Secciones del menú (debajo del nombre, solo lado izquierdo) ───────
      if (servicio.secciones && Object.keys(servicio.secciones).length > 0) {
        for (const [seccion, items] of Object.entries(servicio.secciones)) {
          y = checkPageBreak(doc, y, 28);

          // Cabecera de subsección con fondo gris claro
          doc.rect(PAGE_MARGIN, y, nombreW, 13).fill(GRAY_SECTION);
          doc.fillColor(DARK).font("Helvetica-Bold").fontSize(7.5);
          doc.text(seccion.toUpperCase(), PAGE_MARGIN + 4, y + 3, {
            width: nombreW - 8,
            lineBreak: false,
          });
          y += 14;

          // Listado de ítems
          doc.font("Helvetica").fontSize(8.5).fillColor(DARK);
          doc.text(items.join(", "), PAGE_MARGIN + 4, y, { width: nombreW - 8 });
          y = doc.y + 5;
        }
      }

      // Línea separadora entre servicios (ancho completo)
      doc
        .moveTo(PAGE_MARGIN, y)
        .lineTo(pageWidth - PAGE_MARGIN, y)
        .strokeColor("#aaaaaa")
        .lineWidth(0.5)
        .stroke();
      y += 8;
    });

    y += 4;
  }

  // ── DESCRIPCIÓN DEL MONTAJE ───────────────────────────────────────────────
  y = checkPageBreak(doc, y, 50);
  doc.rect(PAGE_MARGIN, y, totalW, 14).fill(GRAY_SECTION);
  doc.fillColor(DARK).font("Helvetica-Bold").fontSize(8)
    .text("DESCRIPCIÓN DEL MONTAJE", PAGE_MARGIN + 4, y + 3, {
      width: totalW - 8, align: "center", lineBreak: false,
    });
  y += 14;

  doc.font("Helvetica").fontSize(9).fillColor(DARK);
  doc.text(evento.especificaciones_montaje || "No especificado", PAGE_MARGIN + 4, y + 4, { width: totalW - 8 });
  y = doc.y + 10;
  
  // ── OBSERVACIONES ─────────────────────────────────────────────
y = checkPageBreak(doc, y, 40);

doc.font("Helvetica-Bold").fontSize(8).fillColor("#555555");
doc.text("OBSERVACIONES:", PAGE_MARGIN + 4, y);

y += 10;

doc.font("Helvetica").fontSize(9).fillColor(DARK);
doc.text(evento.observaciones || "Sin observaciones", PAGE_MARGIN + 4, y, {
  width: totalW - 8
});

y = doc.y + 10;

  // ── SERVICIOS COMPLEMENTARIOS ─────────────────────────────────────────────
  y = checkPageBreak(doc, y, 80);
  doc.rect(PAGE_MARGIN, y, totalW, 14).fill(GRAY_SECTION);
  doc.fillColor(DARK).font("Helvetica-Bold").fontSize(8)
    .text("SERVICIOS COMPLEMENTARIOS", PAGE_MARGIN + 4, y + 3, {
      width: totalW - 8, align: "center", lineBreak: false,
    });
  y += 14 + 6;

  const serviciosComp = [
    ["EQUIPO AUDIOVISUAL",    evento.equipo_audiovisual],
    ["DECORACIÓN",            evento.decoracion],
    ["GUARDARROPA",           evento.guardarropa],
    ["USO SALÓN",             evento.uso_salon],
    ["USO MOBILIARIO",        evento.uso_mobiliario],
    ["SERVICIO MESEROS",      evento.servicio_meseros],
    ["USO ESTACIONAMIENTO",   evento.uso_estacionamiento],
    ["OTROS",                 evento.otros_servicios],
  ];

  const mid        = Math.ceil(serviciosComp.length / 2);
  const leftServs  = serviciosComp.slice(0, mid);
  const rightServs = serviciosComp.slice(mid);

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
  y = checkPageBreak(doc, y, 100);
  y = sectionHeader(doc, y, "4. Datos del hotel", pageWidth);
  y += 6;

  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Nombre del hotel", hotel.nombre_hotel); return d.y; },
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Razón social", hotel.razon_social); return d.y; }
  );
  y += 6;

  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => { labelValue(d, x, sy, w, "R.F.C", hotel.rfc); return d.y; },
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Contacto", hotel.nombre_contacto); return d.y; }
  );
  y += 6;

  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Teléfono", hotel.telefono); return d.y; },
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Email", hotel.email); return d.y; }
  );
  y += 6;

  doc.font("Helvetica-Bold").fontSize(7).fillColor("#555555");
  doc.text("DIRECCIÓN", PAGE_MARGIN, y, { width: totalW, lineBreak: false });
  doc.font("Helvetica").fontSize(9).fillColor(DARK);
  doc.text(hotel.direccion || "-", PAGE_MARGIN, y + 10, { width: totalW });
  y = doc.y + 6;

  labelValue(doc, PAGE_MARGIN, y, totalW, "Horarios", hotel.horarios);
  y = doc.y + 8;

  // ── DETALLE FINANCIERO ────────────────────────────────────────────────────
  y = checkPageBreak(doc, y, 100);
  y = sectionHeader(doc, y, "Detalle financiero", pageWidth);
  y += 8;

  const subtotal      = Number(evento.subtotal              || 0);
  const iva           = Number(evento.iva                   || 0);
  const total         = Number(evento.total                 || 0);
  const montoAnticipo = Number(evento.monto_anticipo         || 0);
  const restante      = Number(evento.restante              || 0);
  const pctAnticipo   = evento.porcentaje_anticipo           || 0;

  const finItems = [
    ["SUBTOTAL",  `$${subtotal.toFixed(2)}`],
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

  y += 10;

  // ── GARANTÍA POR SERVICIOS EXCEDENTES ────────────────────────────────────
  y = checkPageBreak(doc, y, 80);
  y = sectionHeader(doc, y, "Garantía por servicios excedentes", pageWidth);
  y += 10;

  const garantiaItems = [
    "GARANTÍA POR SERVICIOS EXCEDENTES",
    "PRECIO POR HORA EXCEDENTE DE SERVICIO (IVA INCLUIDO)",
  ];

  for (const txt of garantiaItems) {
    const lineY = y + 10;
    doc.font("Helvetica").fontSize(8).fillColor(DARK);
    doc.text(txt, PAGE_MARGIN, y, { width: totalW * 0.55, lineBreak: false });
    doc
      .moveTo(PAGE_MARGIN + totalW * 0.58, lineY)
      .lineTo(PAGE_MARGIN + totalW, lineY)
      .strokeColor("#555555")
      .lineWidth(0.5)
      .stroke();
    y += 22;
  }

  y += 6;

  // ── ACEPTACIÓN DE PUBLICIDAD ──────────────────────────────────────────────
  y = checkPageBreak(doc, y, 60);
  const pubTextW = totalW * 0.62;
  const pubBoxX  = PAGE_MARGIN + pubTextW + 10;
  const pubBoxW  = totalW - pubTextW - 10;

  const pubText =
    "EL CONSUMIDOR ACEPTA QUE EL PRESTADOR DE SERVICIOS LE ENVÍE PUBLICIDAD SOBRE SUS BIENES Y SERVICIOS, ASÍ COMO DE EMPRESAS SUBSIDIARIAS.";

  const pubTextStartY = y;
  doc.font("Helvetica").fontSize(8).fillColor(DARK);
  doc.text(pubText, PAGE_MARGIN, pubTextStartY, { width: pubTextW });
  const pubTextEndY = doc.y;

  const boxH    = 18;
  const boxW    = (pubBoxW - 8) / 2;
  const boxMidY = pubTextStartY + (pubTextEndY - pubTextStartY) / 2 - boxH / 2;

  doc.rect(pubBoxX, boxMidY, boxW, boxH).strokeColor(DARK).lineWidth(0.8).stroke();
  doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK);
  doc.text("SI", pubBoxX, boxMidY + 5, { width: boxW, align: "center", lineBreak: false });

  const noBoxX = pubBoxX + boxW + 8;
  doc.rect(noBoxX, boxMidY, boxW, boxH).strokeColor(DARK).lineWidth(0.8).stroke();
  doc.text("NO", noBoxX, boxMidY + 5, { width: boxW, align: "center", lineBreak: false });

  y = Math.max(pubTextEndY, boxMidY + boxH) + 12;

  // ── ACUERDO DEL CONTRATANTE ───────────────────────────────────────────────
  y = checkPageBreak(doc, y, 120);
  y = sectionHeader(doc, y, "Acuerdo del contratante y el prestador de servicios", pageWidth);
  y += 10;

  doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK);
  doc.text("FIRMA DEL PRESTADOR DE SERVICIOS", PAGE_MARGIN, y);
  y = doc.y + 24;

  // ── TABLA DE FIRMAS ───────────────────────────────────────────────────────
  const firmaColW   = (totalW - COL_GAP) / 2;
  const firmaLeftX  = PAGE_MARGIN;
  const firmaRightX = PAGE_MARGIN + firmaColW + COL_GAP;

  doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK);
  doc.text("FIRMA", firmaLeftX,  y, { width: firmaColW, align: "center", lineBreak: false });
  doc.text("FIRMA", firmaRightX, y, { width: firmaColW, align: "center", lineBreak: false });
  y += 14;

  doc
    .moveTo(firmaLeftX, y)
    .lineTo(firmaLeftX + firmaColW, y)
    .strokeColor(DARK).lineWidth(0.8).stroke();
  doc
    .moveTo(firmaRightX, y)
    .lineTo(firmaRightX + firmaColW, y)
    .stroke();

  y += 10;

  doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK);
  doc.text("CARGO:", firmaLeftX, y, { continued: true });
  doc.font("Helvetica").fillColor(DARK);
  doc.text(`  ${hotel.cargo_coordinador || "Coordinador de Eventos"}`, { lineBreak: false });
  y = doc.y + 6;

  const nombreCoordY = y;
  doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK);
  doc.text("NOMBRE", firmaLeftX, nombreCoordY, { continued: true });
  doc.font("Helvetica").fillColor(DARK);
  doc.text(`  ${hotel.nombre_coordinador || hotel.nombre_contacto || "-"}`, { lineBreak: false });

  doc.font("Helvetica").fontSize(9).fillColor(DARK);
  doc.text(evento.nombre_contratante || "-", firmaRightX, nombreCoordY, {
    width: firmaColW,
    align: "center",
    lineBreak: false,
  });

  y = doc.y + 10;

  doc.end();
}

module.exports = generarContratoPDF;