const ModalConfirmacion = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  titulo, 
  mensaje, 
  textoConfirmar = "Confirmar", 
  textoCancelar = "Cancelar",
  tipo = "eliminar" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {titulo}
        </h3>
        <p className="text-gray-600 mb-6">
          {mensaje}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            {textoCancelar}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white font-medium rounded-lg ${
              tipo === 'eliminar' 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacion;