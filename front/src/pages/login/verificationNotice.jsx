function VerificationNotice({ email, onBackToLogin }) {
  return (
    <div className="flex min-h-screen">
      {/* Lado izquierdo: contenido */}
      <div className="flex flex-col justify-center w-full max-w-md p-8 mx-auto">

        {/* Título */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Registro exitoso</h2>
          <p className="text-gray-600 mt-2">
            Revisa tu correo <strong>{email}</strong> para verificar tu cuenta antes de iniciar sesión.
          </p>
        </div>

        {/* Botón */}
        <button
          onClick={onBackToLogin}
          className="w-full py-3 bg-[#298f38] text-white rounded-lg font-medium hover:bg-[#287233] transition duration-150"
        >
          Ir al login
        </button>
      </div>

    </div>
  );
}

export default VerificationNotice;
