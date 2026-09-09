import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import DonorDashboard from "./pages/DonorDashboard.jsx";
import NGODashboard from "./pages/NGODashboard.jsx";
import RecipientDashboard from "./pages/RecipientDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import MapView from "./pages/MapView.jsx";
import ImpactDashboard from "./pages/ImpactDashboard.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/impact" element={<ImpactDashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />

          <Route path="/donor" element={<ProtectedRoute roles={["donor"]}><DonorDashboard /></ProtectedRoute>} />
          <Route path="/ngo" element={<ProtectedRoute roles={["ngo", "volunteer"]}><NGODashboard /></ProtectedRoute>} />
          <Route path="/recipient" element={<ProtectedRoute roles={["recipient"]}><RecipientDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
