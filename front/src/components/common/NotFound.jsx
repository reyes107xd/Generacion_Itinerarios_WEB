import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <h1 className="text-9xl font-bold text-gray-800">404</h1>
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">Página no encontrada</h2>
            <p className="text-gray-500 mb-8">Lo sentimos, la página que buscas no existe.</p>
            <Link 
                to="/home" 
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
                Volver al inicio
            </Link>
        </div>
    );
};

export default NotFound;