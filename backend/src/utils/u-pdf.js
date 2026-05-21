//Se usa npm install pdfkit
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

export const generarPDF = async (itinerario) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const stream = new PassThrough();
      const chunks = [];

      doc.pipe(stream);

      // Encabezado
      doc.fontSize(20).text('Itinerario de Viaje', { align: 'center' });
      doc.moveDown();

      // Datos principales
      doc.fontSize(14).text(`Título: ${itinerario.titulo || 'Sin título'}`);
      doc.text(`Descripción: ${itinerario.descripcion || 'Sin descripción'}`);
      doc.text(`Fecha inicio: ${itinerario.fecha_inicio || 'N/A'}`);
      doc.text(`Fecha término: ${itinerario.fecha_termino || 'N/A'}`);
      doc.moveDown();

      // Lugares
      if (Array.isArray(itinerario.lugares) && itinerario.lugares.length > 0) {
        doc.fontSize(16).text('Lugares:', { underline: true });
        itinerario.lugares.forEach((l, i) => {
          doc.fontSize(12).text(`${i + 1}. ${l.nombre} (${l.categoria})`);
          doc.text(`Ubicación: ${l.ubicacion}`);
          doc.moveDown(0.5);
        });
      } else {
        doc.text('Este itinerario no tiene lugares registrados.');
      }

      doc.end();

      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};
