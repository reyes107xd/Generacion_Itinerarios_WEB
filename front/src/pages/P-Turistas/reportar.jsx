import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import usePageTitle from '../../Extras/nombre'; 
import { Flag } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useAlert } from '../../context/alertContext'; 
import { enviarReporteAPI } from '../../api/a-reporte';

const Reportar = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  usePageTitle('Reportar Publicación');
  const { token } = useAuth();
  const { showAlert } = useAlert(); 

  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const reasons = [
    'Spam',
    'Contenido de odio o acoso',
    'Información falsa',
    'Desnudos o contenido sexual',
    'Contenido violento o gráfico',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      showAlert('error', 'Formulario incompleto', 'Selecciona un motivo.');
      return;
    }

    try {
      setLoading(true);
      await enviarReporteAPI(token, {
        tipo: 'publicacion',
        id_objeto: id,
        motivo: reason
      });

      showAlert('success', '¡Reporte enviado con éxito!', `La publicación #${id} será revisada.`);
      setTimeout(() => {
        navigate('/home');
      }, 1000); 

    } catch (error) {
      console.error('Error al enviar reporte:', error);
      showAlert('error', 'Error al enviar reporte.', 'Inténtalo de nuevo mas tarde.');
    } finally {
      setLoading(false);
    }
  };
 return (
    <div className="flex items-center justify-center bg-gray-50">
      <div className="lg:max-w-xl xl:max-w-2xl mx-auto 
        bg-white rounded-2xl shadow-xl 
        sm:p-8 overflow-y-auto 
      ">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <Flag size={24} className="text-red-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Reportar Publicación</h1>
        </div>
        <p className="text-gray-600 mb-6">
          Ayúdanos a entender el problema. ¿Por qué estás reportando esta publicación?
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Opciones de reporte */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-700">Selecciona un motivo</label>
            {reasons.map((r) => (
              <label key={r} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  reason === r ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={loading}
                  className="form-radio text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-gray-700">{r}</span>
              </label>
            ))}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
            <Link
              to="/home"
              className={`text-sm font-medium text-gray-600 hover:text-gray-800 py-2 px-4 rounded-md ${loading ? 'pointer-events-none opacity-50' : ''}`}
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={`py-2 px-5 rounded-md transition-colors text-sm font-medium flex items-center gap-2 
                ${(!reason && !loading)
                  ? 'bg-red-600 opacity-50 text-white hover:opacity-70'
                  : 'bg-red-600 opacity-100 text-white hover:bg-red-700 shadow-md'
                }
                ${loading ? 'cursor-not-allowed' : ''}`}
            >
              {loading ? 'Enviando...' : 'Enviar Reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Reportar;