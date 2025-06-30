const API_URL = 'http://localhost:5000/api/user';

export const userService = {
  async getProfile() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener el perfil');
    }

    return response.json();
  },

  async updateProfile(userData: {
    name: string;
    email: string;
    password?: string;
  }) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el perfil');
    }

    return response.json();
  }
};