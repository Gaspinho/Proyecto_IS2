import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { getUserInterests, updateInterestState } from '../services/interests';
import { authService } from '../services/authService';
import '../styles/Dashboard.css';
import AddActividadModal from './AddActividadModal';


interface UserProfile {
  name: string;
  email: string;
}


const Dashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: ''
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    name: '',
    email: ''
  });
  const [password, setPassword] = useState('');
  const [actividades, setActividades] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [nuevasActividades, setNuevasActividades] = useState<any[]>([]);
  const handleLogout = () => {
    authService.logout();
    window.location.assign('/');
  };
  useEffect(() => {
    if (!localStorage.getItem('token')) {
    }
  }, [navigate]);

  
  // UseEffect para borrar mensajes dentro de 2 segs.
  useEffect(() => {
    if (error || message) {
      const timer = setTimeout(() => {
        setError(null);
        setMessage(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [error, message]);
  
  // UseEffect para carga de datos.
  useEffect(() => {
    setError(null);
    setMessage(null);
    const cargarDatos = async () => {
      try {
        const userData = await userService.getProfile();
        const data = await getUserInterests();

        setProfile(userData);
        setEditedProfile(userData);
        setActividades(data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los datos');
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);


  const handleProfileUpdate = async () => {
  try {
    const updateData = {
      ...editedProfile,
      password: password || undefined
    };
    await userService.updateProfile(updateData);
    setProfile(editedProfile);
    setEditingProfile(false);
    setPassword('');
    setError(null);
    setMessage('Perfil actualizado correctamente');
  } catch (err) {
    setError('Error al actualizar el perfil');
  }
};



  if (!localStorage.getItem('token')) {
    navigate('/');
    return null;
  }

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <button 
          className={`sidebar-button ${activeSection === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveSection('profile')}
        >
          Perfil
        </button>
        <button 
          className={`sidebar-button ${activeSection === 'interests' ? 'active' : ''}`}
          onClick={() => setActiveSection('interests')}
        >
          Mis Intereses
        </button>
        <button 
          className={`sidebar-button ${activeSection === 'myInterests' ? 'active' : ''}`}
          onClick={() => setActiveSection('myInterests')}
        >
          Volver al Inicio
        </button>
        <button 
          className="sidebar-button logout-button"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </div>
      
      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        {activeSection === 'profile' && (
          <div className="profile-section">
            <h2>Mi Perfil</h2>
            {!editingProfile ? (
              <>
                <div className="profile-info">
                  <p><strong>Nombre:</strong> {profile.name}</p>
                  <p><strong>Email:</strong> {profile.email}</p>
                </div>
                <button 
                  className="edit-button"
                  onClick={() => setEditingProfile(true)}
                >
                  Editar Perfil
                </button>
              </>
            ) : (
              <form className="profile-form" onSubmit={(e) => {
                e.preventDefault();
                handleProfileUpdate();
              }}>
                <div className="form-group">
                  <label>Nombre</label>
                  <input 
                    type="text" 
                    value={editedProfile.name}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile,
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile,
                      email: e.target.value
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Nueva Contraseña (opcional)</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Dejar en blanco para mantener la actual"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit">Guardar Cambios</button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditingProfile(false);
                      setEditedProfile(profile);
                      setPassword('');
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
        
        {activeSection === 'interests' && (
          <div className="interests-section">
            <h2>Mis Intereses</h2>
            <div className="interests-grid">
              {actividades.map((actividad) => (
                <label key={actividad.id} className="interest-item">
                  <input
                    type="checkbox"
                    checked={actividad.estado}
                    onChange={async (e) => {
                      const nuevoEstado = e.target.checked;
                      try {
                        await updateInterestState(actividad.id, nuevoEstado);
                        // Actualizamos localmente el estado de esa actividad
                        setActividades((prev) =>
                          prev.map((a) =>
                            a.id === actividad.id ? { ...a, estado: nuevoEstado } : a
                          )
                        );
                        setMessage('Estado actualizado correctamente');
                      } catch (err) {
                        setError('Error al cambiar el estado');
                      }
                    }}
                  />
                  {actividad.name}
                </label>
              ))}
            </div>
            <button
              className="add-interest-button"
              onClick={() => setShowAddModal(true)}
              style={{ marginTop: '16px' }}
            >
              + Añadir
            </button>
          </div>
        )}

        {showAddModal && (
          <AddActividadModal
            onClose={() => setShowAddModal(false)}
            onAdd={(actividad) => setNuevasActividades(prev => [...prev, actividad])}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
