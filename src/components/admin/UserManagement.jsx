import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

const UserManagement = ({ user }) => {
  const [users] = useState([
    { id: 1, name: 'John Smith', email: 'john@dealer.com', role: 'dealer-staff', status: 'active' },
    { id: 2, name: 'Jane Doe', email: 'jane@dealer.com', role: 'dealer-manager', status: 'active' },
    { id: 3, name: 'Mike Johnson', email: 'mike@evm.com', role: 'evm-staff', status: 'active' }
  ]);

  return (
    <div className="main">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>User Management</h2>
          <button className="btn btn-primary">
            <i className="bx bx-plus"></i>
            Create New User
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px' }}>{u.name}</td>
                <td style={{ padding: '12px' }}>{u.email}</td>
                <td style={{ padding: '12px' }}>{u.role}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ padding: '4px 12px', borderRadius: 'var(--radius)', background: 'var(--color-success)', color: 'white', fontSize: '12px' }}>
                    {u.status}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button className="btn btn-outline" style={{ padding: '6px', fontSize: '14px' }}>
                      <i className="bx bx-edit"></i>
                    </button>
                    <button className="btn btn-outline" style={{ padding: '6px', fontSize: '14px' }}>
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;

