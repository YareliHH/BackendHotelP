import db from '../config/db.js';
import Evento from '../models/evento.model.js';
import generarContratoPDF from '../utils/contratoPdf.js';

//////////////////////////////////////////////////////
// CREAR EVENTO COMPLETO
//////////////////////////////////////////////////////

export const crearEvento = async (req, res) => {
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const { servicios, ...eventoData } = req.body;

    // 1️⃣ Generar numero_contrato
    const [ultimoEvento] = await connection.query(
      `SELECT numero_contrato FROM eventos 
       WHERE numero_contrato IS NOT NULL 
       ORDER BY numero_contrato DESC LIMIT 1`
    );

    let nuevoNumero = 1;
    if (ultimoEvento.length > 0 && ultimoEvento[0].numero_contrato) {
      const ultimo = ultimoEvento[0].numero_contrato;
      const partes = ultimo.split('-');
      nuevoNumero = parseInt(partes[partes.length - 1]) + 1;
    }

    const anio = new Date().getFullYear();
    eventoData.numero_contrato = `EVT-${anio}-${String(nuevoNumero).padStart(4, '0')}`;
    eventoData.fecha_contrato = new Date().toISOString().split('T')[0];

    // 2️⃣ Crear evento
    const idEvento = await Evento.createEvento(connection, eventoData);

    // 3️⃣ Insertar servicios y calcular subtotal
    let subtotal = 0;
    for (const servicio of servicios) {
      const idEventoServicio = await Evento.insertEventoServicio(
        connection,
        idEvento,
        servicio.id_servicio,
        servicio.cantidad_personas
      );

      const [servicioData] = await connection.query(
        `SELECT precio_unitario FROM servicios WHERE id_servicio = ?`,
        [servicio.id_servicio]
      );
      if (servicioData.length > 0) {
        subtotal += Number(servicioData[0].precio_unitario) * Number(servicio.cantidad_personas);
      }

      if (servicio.itemsSeleccionados && servicio.itemsSeleccionados.length > 0) {
        for (const idItem of servicio.itemsSeleccionados) {
          await Evento.insertEventoServicioItem(connection, idEventoServicio, idItem);
        }
      }
    }

    // 4️⃣ Calcular totales
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    const monto_anticipo = total * (Number(eventoData.porcentaje_anticipo) / 100);
    const restante = total - monto_anticipo;

    // 5️⃣ Actualizar totales
    await Evento.actualizarTotales(
      connection,
      idEvento,
      subtotal,
      iva,
      total,
      monto_anticipo,
      restante
    );

    await connection.commit();
    res.json({ message: 'Evento creado correctamente' });

  } catch (error) {
    await connection.rollback();
    console.error('ERROR DETALLADO:', error);
    res.status(500).json({
      detalle: 'Error al crear el evento',
      error
    });

  } finally {
    connection.release();
  }
};

//////////////////////////////////////////////////////
// OBTENER EVENTOS
//////////////////////////////////////////////////////

export const obtenerEventos = async (req, res) => {
  try {
    const eventos = await Evento.getEventos();
    res.json(eventos);
  } catch (error) {
    res.status(500).json(error);
  }
};

//////////////////////////////////////////////////////
// RESUMEN DASHBOARD
//////////////////////////////////////////////////////

export const obtenerResumen = async (req, res) => {
  try {
    const resumen = await Evento.getResumen();
    res.json(resumen);
  } catch (error) {
    console.error('Error en resumen:', error);
    res.status(500).json({ message: 'Error al obtener resumen' });
  }
};

//////////////////////////////////////////////////////
// 🔥 GENERAR CONTRATO PDF (YA CON HOTEL)
//////////////////////////////////////////////////////

export const generarContrato = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 EVENTO
    const [eventos] = await db.promise().query(
      `SELECT e.*, s.nombre AS nombre_salon
       FROM eventos e
       LEFT JOIN salones s ON e.id_salon = s.id_salon
       WHERE e.id_evento = ?`,
      [id]
    );

    if (eventos.length === 0) {
      return res.status(404).json({ mensaje: 'Evento no encontrado' });
    }

    const evento = eventos[0];

    // HOTEL (AQUÍ ESTÁ LA CLAVE)
    const [hotelRows] = await db.promise().query(
      `SELECT * FROM hotel LIMIT 1`
    );

    const hotel = hotelRows[0];

    // 🔹 ENVIAR AL PDF
    generarContratoPDF(res, evento, hotel);

  } catch (error) {
    console.error('Error al generar contrato:', error);
    res.status(500).json({ mensaje: 'Error al generar contrato' });
  }
};