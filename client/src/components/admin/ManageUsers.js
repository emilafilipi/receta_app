import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; 

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth(); 

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (userId) => {
    try {
      if (userId === currentUser.id) {
        alert("You cannot deactivate your own admin account");
        return;
      }

      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to toggle user status');
      }

      // Refresh users list
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="manage-users">
      <h2>Përdoruesit</h2>
      {loading ? (
        <div>Duke ngarkuar...</div>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Emri i Përdoruesit</th>
              <th>Adresa e Email-it</th>
              <th>Roli</th>
              <th>Statusi</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.perdoruesi_id}>
                <td>{user.emer_perdoruesi}</td>
                <td>{user.email}</td>
                <td>{user.roli}</td>
                <td>{user.eshte_aktiv ? 'Aktiv' : 'Jo Aktiv'}</td>
                <td>
                  <button 
                    className="action-button"
                    onClick={() => handleStatusToggle(user.perdoruesi_id)}
                    disabled={user.perdoruesi_id === currentUser.id}
                  >
                    {user.eshte_aktiv ? 'Çaktivizo' : 'Aktivizo'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ManageUsers;