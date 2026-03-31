const PDFDocument = require("pdfkit");
const path = require("path");

// ─── Constantes ──────────────────────────────────────────────────────────────
const GRAY_HEADER  = "#d0d0d0";
const GRAY_SECTION = "#e8e8e8";
const BLACK        = "#000000";
const DARK         = "#1a1a1a";
const ORANGE       = "#f4b183";
const ORANGE_DARK  = "#c0704a";
const ORANGE_LIGHT = "#fdf3ec";
const RED          = "#b71c1c";
const RED_LIGHT    = "#FFEBEE";
const BLUE         = "#1565C0";
const PAGE_MARGIN  = 40;
const COL_GAP      = 12;

const LOGO_PATH = path.join(__dirname, "../assets/logotipoP.png");

// ─── Número a Letras (español) ───────────────────────────────────────────────

const UNIDADES = [
  "", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
  "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS",
  "DIECISIETE", "DIECIOCHO", "DIECINUEVE", "VEINTE",
];
const DECENAS = [
  "", "", "VEINTI", "TREINTA", "CUARENTA", "CINCUENTA",
  "SESENTA", "SETENTA", "OCHENTA", "NOVENTA",
];
const CENTENAS = [
  "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
  "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS",
];

function convertirGrupo(n) {
  if (n === 0) return "";
  if (n === 100) return "CIEN";
  if (n <= 20) return UNIDADES[n];

  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;

  let resultado = c > 0 ? CENTENAS[c] + (n % 100 > 0 ? " " : "") : "";

  if (d === 2 && u > 0) {
    resultado += "VEINTI" + UNIDADES[u];
  } else if (d >= 3) {
    resultado += DECENAS[d];
    if (u > 0) resultado += " Y " + UNIDADES[u];
  } else if (d === 0 && u > 0) {
    resultado += UNIDADES[u];
  } else if (d > 0) {
    resultado += UNIDADES[d * 10 + u] || (DECENAS[d] + (u > 0 ? " Y " + UNIDADES[u] : ""));
  }

  return resultado.trim();
}

function numeroALetras(num) {
  if (!num || isNaN(num)) return "-";
  const numero = Math.abs(Number(num));
  const entero = Math.floor(numero);
  const centavos = Math.round((numero - entero) * 100);

  if (entero === 0) return `CERO PESOS ${centavos.toString().padStart(2, "0")}/100 M.N.`;

  const millones   = Math.floor(entero / 1_000_000);
  const miles      = Math.floor((entero % 1_000_000) / 1_000);
  const cientos    = entero % 1_000;

  let letras = "";

  if (millones > 0) {
    letras += (millones === 1 ? "UN MILLÓN" : convertirGrupo(millones) + " MILLONES") + " ";
  }
  if (miles > 0) {
    letras += (miles === 1 ? "MIL" : convertirGrupo(miles) + " MIL") + " ";
  }
  if (cientos > 0) {
    letras += convertirGrupo(cientos);
  }

  return `${letras.trim()} PESOS ${centavos.toString().padStart(2, "0")}/100 M.N.`;
}

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
  y = checkPageBreak(doc, y, 100);
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
  y += 6;

  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => {
      d.font("Helvetica-Bold").fontSize(7).fillColor("#555555");
      d.text("CUENTA MAESTRA", x, sy, { width: w, lineBreak: false });

      const cuentaStr = evento.cuenta_maestra ? String(evento.cuenta_maestra) : "-";
      d.font("Helvetica-Bold").fontSize(9).fillColor(RED);
      d.text(cuentaStr, x, sy + 10, { continued: Boolean(evento.extension_cuenta), lineBreak: false });

      if (evento.extension_cuenta) {
        d.font("Helvetica").fontSize(8).fillColor("#555555");
        d.text(`  Ext. ${evento.extension_cuenta}`, { lineBreak: false });
      }

      return sy + 22;
    },
    (d, x, sy, w) => {
      d.font("Helvetica-Bold").fontSize(7).fillColor("#555555");
      d.text("FACTURA", x, sy, { width: w, lineBreak: false });

      const facturaVal = (evento.factura || "-").toString().toUpperCase().trim();

      d.font("Helvetica-Bold").fontSize(9).fillColor(BLUE);
      d.text(facturaVal, x, sy + 10, { width: w, lineBreak: false });

      return sy + 22;
    }
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

  // ── Cálculo anticipado del total global de servicios ──────────────────────
  const totalGlobal = servicios.reduce((acc, servicio) => {
    const precio = Number(servicio.precio_unitario || 0);
    const pax    = Number(evento.numero_personas   || 0);
    return acc + precio * pax;
  }, 0);

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

  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => { labelValue(d, x, sy, w, "Tipo de servicio", evento.tipo_servicio); return d.y; },
    (d, x, sy, w) => { return d.y; }
  );
  y += 6;

  y = twoColumns(
    doc, y, pageWidth,
    (d, x, sy, w) => {
      labelValue(d, x, sy, w, "Cargo", `$${totalGlobal.toFixed(2)}`);
      return d.y;
    },
    (d, x, sy, w) => { return d.y; }
  );
  y += 6;

  // ── DETALLE DE MENÚ ────────────────────────────────────────────────────────
  if (servicios.length > 0) {
    y = checkPageBreak(doc, y, 100);

    y = sectionHeader(doc, y, "Descripción del menú", pageWidth);
    y += 4;

    const nombreW = totalW * 0.50;
    const cColW   = Math.floor((totalW - nombreW) / 3);
    const cPreX   = PAGE_MARGIN + nombreW;
    const cPaxX   = cPreX + cColW;
    const cSubX   = cPaxX + cColW;
    const tableR  = PAGE_MARGIN + totalW;

    const HDR_H = 16;

    doc.rect(cPreX, y, tableR - cPreX, HDR_H).fill(ORANGE);

    [cPaxX, cSubX].forEach((divX) => {
      doc
        .moveTo(divX, y)
        .lineTo(divX, y + HDR_H)
        .strokeColor(ORANGE_DARK)
        .lineWidth(0.6)
        .stroke();
    });

    doc
      .rect(cPreX, y, tableR - cPreX, HDR_H)
      .strokeColor(ORANGE_DARK)
      .lineWidth(0.6)
      .stroke();

    doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK);
    ["PRECIO", "PAX", "SUBTOTAL"].forEach((lbl, i) => {
      const xs = [cPreX, cPaxX, cSubX];
      doc.text(lbl, xs[i] + 2, y + 4, {
        width: cColW - 4,
        align: "center",
        lineBreak: false,
      });
    });

    y += HDR_H + 2;

    let rowIndex = 0;

    servicios.forEach((servicio) => {
      y = checkPageBreak(doc, y, 50);

      const precio    = Number(servicio.precio_unitario || 0);
      const pax       = Number(evento.numero_personas   || 0);
      const subtotalS = precio * pax;

      const ROW_H  = 18;
      const ROW_BG = rowIndex % 2 === 0 ? ORANGE_LIGHT : "#ffffff";
      rowIndex++;

      doc.rect(PAGE_MARGIN, y, totalW, ROW_H).fill(ROW_BG);

      doc
        .moveTo(PAGE_MARGIN, y + ROW_H)
        .lineTo(tableR, y + ROW_H)
        .strokeColor("#e0c0aa")
        .lineWidth(0.4)
        .stroke();

      [cPaxX, cSubX].forEach((divX) => {
        doc
          .moveTo(divX, y)
          .lineTo(divX, y + ROW_H)
          .strokeColor("#e0c0aa")
          .lineWidth(0.4)
          .stroke();
      });

      const textY = y + (ROW_H - 9) / 2;
      doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK);
      doc.text(
        `${servicio.nombre.toUpperCase()}:`,
        PAGE_MARGIN + 4, textY,
        { width: nombreW - 8, lineBreak: false }
      );

      doc.font("Helvetica").fontSize(9).fillColor(DARK);
      doc.text(`$${precio.toFixed(2)}`,    cPreX, textY, { width: cColW, align: "center", lineBreak: false });
      doc.text(`${pax}`,                   cPaxX, textY, { width: cColW, align: "center", lineBreak: false });
      doc.text(`$${subtotalS.toFixed(2)}`, cSubX, textY, { width: cColW, align: "center", lineBreak: false });

      y += ROW_H + 2;

      if (servicio.secciones && Object.keys(servicio.secciones).length > 0) {
        for (const [seccion, items] of Object.entries(servicio.secciones)) {
          y = checkPageBreak(doc, y, 28);

          doc.rect(PAGE_MARGIN, y, nombreW, 13).fill(GRAY_SECTION);
          doc.fillColor(DARK).font("Helvetica-Bold").fontSize(7.5);
          doc.text(seccion.toUpperCase(), PAGE_MARGIN + 4, y + 3, {
            width: nombreW - 8,
            lineBreak: false,
          });
          y += 14;

          doc.font("Helvetica").fontSize(8.5).fillColor(DARK);
          doc.text(items.join(", "), PAGE_MARGIN + 4, y, { width: nombreW - 8 });
          y = doc.y + 5;
        }
      }
    });

    // ── Fila TOTAL ──────────────────────────────────────────────────────────
    y = checkPageBreak(doc, y, 20);
    const TOT_H = 16;

    doc.rect(cPreX, y, tableR - cPreX, TOT_H).fill(GRAY_HEADER);
    doc
      .rect(cPreX, y, tableR - cPreX, TOT_H)
      .strokeColor("#999999")
      .lineWidth(0.5)
      .stroke();

    doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK);
    doc.text("TOTAL:", PAGE_MARGIN + 4, y + 4, {
      width: nombreW - 8,
      align: "right",
      lineBreak: false,
    });

    doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK);
    doc.text(`$${totalGlobal.toFixed(2)}`, cSubX, y + 4, {
      width: cColW,
      align: "center",
      lineBreak: false,
    });

    y += TOT_H + 8;
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

  // ── OBSERVACIONES ─────────────────────────────────────────────────────────
  y = checkPageBreak(doc, y, 40);

  doc.font("Helvetica-Bold").fontSize(8).fillColor("#555555");
  doc.text("OBSERVACIONES:", PAGE_MARGIN + 4, y);
  y += 10;

  doc.font("Helvetica").fontSize(9).fillColor(DARK);
  doc.text(evento.observaciones || "Sin observaciones", PAGE_MARGIN + 4, y, { width: totalW - 8 });
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
    ["EQUIPO AUDIOVISUAL",  evento.equipo_audiovisual],
    ["DECORACIÓN",          evento.decoracion],
    ["GUARDARROPA",         evento.guardarropa],
    ["USO SALÓN",           evento.uso_salon],
    ["USO MOBILIARIO",      evento.uso_mobiliario],
    ["SERVICIO MESEROS",    evento.servicio_meseros],
    ["USO ESTACIONAMIENTO", evento.uso_estacionamiento],
    ["OTROS",               evento.otros_servicios],
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

  // ── SECCIÓN FINANCIERA ────────────────────────────────────────────────────
  y = checkPageBreak(doc, y, 160);
  y += 6;

  const subtotal      = Number(evento.subtotal              || 0);
  const iva           = Number(evento.iva                   || 0);
  const total         = Number(evento.total                 || 0);
  const montoAnticipo = Number(evento.monto_anticipo        || 0);
  const restante      = Number(evento.restante              || 0);
  const pctAnticipo   = evento.porcentaje_anticipo          || 0;

  // ── FIX: total_en_letra se genera automáticamente si viene vacío ──────────
  const totalEnLetra  = evento.total_en_letra
    ? evento.total_en_letra
    : numeroALetras(total);

  // ── Sub-header: DATOS DE COBRANZA ─────────────────────────────────────────
  doc.rect(PAGE_MARGIN, y, totalW, 14).fill(GRAY_SECTION);
  doc.fillColor(DARK).font("Helvetica-Bold").fontSize(8)
    .text("DATOS DE COBRANZA", PAGE_MARGIN + 4, y + 3, {
      width: totalW - 8, align: "center", lineBreak: false,
    });
  y += 14 + 4;

  const labelColW = totalW * 0.60;
  const valueColX = PAGE_MARGIN + labelColW;
  const valueColW = totalW - labelColW;

  // ── Fila: MONTO DEL SERVICIO S/IVA ────────────────────────────────────────
  doc.font("Helvetica").fontSize(8.5).fillColor(DARK);
  doc.text("MONTO DEL SERVICIO S/IVA", PAGE_MARGIN + 4, y, {
    width: labelColW - 8, lineBreak: false,
  });
  doc.font("Helvetica").fontSize(8.5).fillColor(DARK);
  doc.text(`$${subtotal.toFixed(2)}`, valueColX, y, {
    width: valueColW - 4, align: "right", lineBreak: false,
  });
  y += 13;

  // ── Fila: IVA ─────────────────────────────────────────────────────────────
  doc.font("Helvetica").fontSize(8.5).fillColor(DARK);
  doc.text("IVA", PAGE_MARGIN + 4, y, {
    width: labelColW - 8, lineBreak: false,
  });
  doc.font("Helvetica").fontSize(8.5).fillColor(DARK);
  doc.text(`$${iva.toFixed(2)}`, valueColX, y, {
    width: valueColW - 4, align: "right", lineBreak: false,
  });
  y += 13;

  // ── Línea separadora ──────────────────────────────────────────────────────
  doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + totalW, y)
    .strokeColor("#aaaaaa").lineWidth(0.5).stroke();
  y += 5;

  // ── Fila: PRECIO TOTAL PACTADO ────────────────────────────────────────────
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(DARK);
  doc.text("PRECIO TOTAL PACTADO", PAGE_MARGIN + 4, y, {
    width: labelColW - 8, lineBreak: false,
  });
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(DARK);
  doc.text(`$${total.toFixed(2)}`, valueColX, y, {
    width: valueColW - 4, align: "right", lineBreak: false,
  });
  y += 14;

  // ── EN LETRA ──────────────────────────────────────────────────────────────
  doc.font("Helvetica-Oblique").fontSize(7.5).fillColor("#555555");
  doc.text("(EN LETRA)", PAGE_MARGIN + 4, y, { lineBreak: false });
  y += 10;
  doc.font("Helvetica").fontSize(8).fillColor(DARK);
  doc.text(totalEnLetra, PAGE_MARGIN + 4, y, { width: totalW - 8 });
  y = doc.y + 8;

  // ── Sub-header: FECHAS E IMPORTES ─────────────────────────────────────────
  y = checkPageBreak(doc, y, 80);
  doc.rect(PAGE_MARGIN, y, totalW, 14).fill(GRAY_SECTION);
  doc.fillColor(DARK).font("Helvetica-Bold").fontSize(8)
    .text("FECHAS E IMPORTES A PAGAR DEL PRECIO", PAGE_MARGIN + 4, y + 3, {
      width: totalW - 8, align: "center", lineBreak: false,
    });
  y += 14 + 6;

  // ── Label ANTICIPOS ───────────────────────────────────────────────────────
  doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK);
  doc.text("ANTICIPOS", PAGE_MARGIN + 4, y);
  y += 12;

  // ── Encabezado tabla de anticipos ─────────────────────────────────────────
  const antColW  = Math.floor(totalW / 3);
  const antCol1X = PAGE_MARGIN;
  const antCol2X = antCol1X + antColW;
  const antCol3X = antCol2X + antColW;

  const ANT_HDR_H = 14;
  doc.rect(antCol1X, y, totalW, ANT_HDR_H).fill(GRAY_HEADER);

  [antCol2X, antCol3X].forEach(dx => {
    doc.moveTo(dx, y).lineTo(dx, y + ANT_HDR_H)
      .strokeColor("#999999").lineWidth(0.5).stroke();
  });
  doc.rect(antCol1X, y, totalW, ANT_HDR_H)
    .strokeColor("#999999").lineWidth(0.5).stroke();

  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(DARK);
  doc.text("PORCENTAJE",      antCol1X + 2, y + 3, { width: antColW - 4, align: "center", lineBreak: false });
  doc.text("FECHA DE PAGO",   antCol2X + 2, y + 3, { width: antColW - 4, align: "center", lineBreak: false });
  doc.text("IMPORTE A PAGAR", antCol3X + 2, y + 3, { width: antColW - 4, align: "center", lineBreak: false });
  y += ANT_HDR_H;

  // ── Fila de anticipo ──────────────────────────────────────────────────────
  const ANT_ROW_H = 16;
  doc.rect(antCol1X, y, totalW, ANT_ROW_H).fill(ORANGE_LIGHT);

  [antCol2X, antCol3X].forEach(dx => {
    doc.moveTo(dx, y).lineTo(dx, y + ANT_ROW_H)
      .strokeColor("#e0c0aa").lineWidth(0.4).stroke();
  });
  doc.rect(antCol1X, y, totalW, ANT_ROW_H)
    .strokeColor("#e0c0aa").lineWidth(0.4).stroke();

  doc.font("Helvetica").fontSize(8.5).fillColor(DARK);
  doc.text(`${pctAnticipo}%`,
    antCol1X + 2, y + 4, { width: antColW - 4, align: "center", lineBreak: false });
  doc.text(formatFecha(evento.fecha_pago_anticipo) || "-",
    antCol2X + 2, y + 4, { width: antColW - 4, align: "center", lineBreak: false });
  doc.text(`$  ${montoAnticipo.toFixed(2)}`,
    antCol3X + 2, y + 4, { width: antColW - 4, align: "right", lineBreak: false });
  y += ANT_ROW_H;

  // ── FIX: Fila TOTAL con importe ───────────────────────────────────────────
  const TOT_ROW_H = 14;
  doc.rect(antCol1X, y, totalW, TOT_ROW_H).fill("#f5f5f5");
  doc.rect(antCol1X, y, totalW, TOT_ROW_H)
    .strokeColor("#cccccc").lineWidth(0.4).stroke();
  doc.moveTo(antCol3X, y).lineTo(antCol3X, y + TOT_ROW_H)
    .strokeColor("#cccccc").lineWidth(0.4).stroke();

  doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK);
  doc.text("TOTAL", antCol1X + 2, y + 3, {
    width: antColW * 2 - 4, align: "right", lineBreak: false,
  });
  // ── Importe total en la columna derecha ───────────────────────────────────
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(DARK);
  doc.text(`$  ${montoAnticipo.toFixed(2)}`, antCol3X + 2, y + 3, {
    width: antColW - 4, align: "right", lineBreak: false,
  });
  y += TOT_ROW_H + 8;

  // ── Sub-header: LIQUIDACIÓN DEL MONTO TOTAL ───────────────────────────────
  y = checkPageBreak(doc, y, 40);
  doc.rect(PAGE_MARGIN, y, totalW, 14).fill(GRAY_SECTION);
  doc.fillColor(DARK).font("Helvetica-Bold").fontSize(8)
    .text("LIQUIDACIÓN DEL MONTO TOTAL", PAGE_MARGIN + 4, y + 3, {
      width: totalW - 8, align: "center", lineBreak: false,
    });
  y += 14;

  // ── Fila RESTAN ───────────────────────────────────────────────────────────
  const REST_ROW_H = 16;
  doc.rect(antCol1X, y, totalW, REST_ROW_H).fill(ORANGE_LIGHT);
  doc.rect(antCol1X, y, totalW, REST_ROW_H)
    .strokeColor("#e0c0aa").lineWidth(0.4).stroke();
  doc.moveTo(antCol3X, y).lineTo(antCol3X, y + REST_ROW_H)
    .strokeColor("#e0c0aa").lineWidth(0.4).stroke();

  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(DARK);
  doc.text("RESTAN",
    antCol1X + 2, y + 4, { width: antColW * 2 - 4, align: "right", lineBreak: false });
  doc.font("Helvetica").fontSize(8.5).fillColor(DARK);
  doc.text(`$  ${restante.toFixed(2)}`,
    antCol3X + 2, y + 4, { width: antColW - 4, align: "right", lineBreak: false });
  y += REST_ROW_H + 10;

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