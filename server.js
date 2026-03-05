import express from 'express';
import cors from 'cors';
import salonRoutes from './routes/salon.routes.js';
import mobiliarioRoutes from './routes/mobiliario.routes.js';
import servicioRoutes from './routes/servicio.routes.js';
import eventoRoutes from './routes/evento.routes.js';
import authRoutes from './routes/auth.routes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/salones', salonRoutes);
app.use('/api/mobiliario', mobiliarioRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/eventos', eventoRoutes);


app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});