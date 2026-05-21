// src/pages/P-Admin/AdminRoutes.jsx - CORREGIDO
import AdminRoute from "../../components/common/adminRoute";
import AdminDashboardLayout from "./Dashboard";


const AdminRoutes = () => {
  return (
    <AdminRoute>
      <AdminDashboardLayout />
    </AdminRoute>
  );
};

export default AdminRoutes;