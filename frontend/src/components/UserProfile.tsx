import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Issue: No proper typing, using any
const UserProfile = (props: any) => {
  // Issue: Uninitialized state could cause runtime errors
  const [user, setUser] = useState();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('hardcoded-api-key-123'); // Issue: Hardcoded API key

  // Issue: useEffect with missing dependencies
  useEffect(() => {
    fetchUser();
    fetchAllUsers();
  }, []);

  // Issue: No error handling, async function not awaited properly
  const fetchUser = () => {
    setLoading(true);
    // Issue: Hardcoded API endpoint, no environment variables
    fetch('http://localhost:3000/users/1')
      .then(response => response.json())
      .then(data => {
        setUser(data);
        // Issue: Storing sensitive data in local storage
        localStorage.setItem('userPassword', data.password);
        localStorage.setItem('userSSN', data.ssn);
        setLoading(false);
      })
      .catch(error => {
        // Issue: Poor error handling, logging sensitive information
        console.error('Error fetching user:', error);
        alert(`Error: ${error.message}`); // Issue: Exposing technical errors to user
        setLoading(false);
      });
  };

  // Issue: No authentication, no authorization check
  const fetchAllUsers = async () => {
    try {
      // Issue: Fetching all users without pagination or filtering
      const response = await axios.get('http://localhost:3000/users');
      setUsers(response.data);
      
      // Issue: Storing sensitive data globally
      (window as any).allUsers = response.data;
    } catch (error) {
      console.log('All users error:', error);
    }
  };

  // Issue: No input validation, no proper form handling
  const updateUser = () => {
    // Issue: Direct DOM manipulation instead of React patterns
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const firstName = (document.getElementById('firstName') as HTMLInputElement).value;
    
    // Issue: No validation of input data
    const updateData = {
      email: email,
      firstName: firstName,
      password: password, // Issue: Updating password without hashing
      isAdmin: true, // Issue: Always setting admin to true
      apiKey: apiKey
    };

    // Issue: No error handling, no loading state
    fetch(`http://localhost:3000/users/${(user as any).id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Issue: Sending API key in headers
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
      // Issue: Not updating state properly
      setUser(data);
      alert('User updated successfully!');
    });
  };

  // Issue: Dangerous function accessible from UI
  const deleteAllUsers = () => {
    // Issue: No confirmation, mass deletion
    if (confirm('Delete ALL users? This cannot be undone!')) {
      users.forEach(async (user: any) => {
        // Issue: Sequential API calls, no error handling
        await fetch(`http://localhost:3000/users/${user.id}`, {
          method: 'DELETE'
        });
      });
      
      // Issue: Clearing state without waiting for API calls
      setUsers([]);
      alert('All users deleted!');
    }
  };

  // Issue: Function that makes all users admin
  const makeEveryoneAdmin = () => {
    // Issue: No authorization check for dangerous operation
    fetch('http://localhost:3000/users/reset-all-passwords', {
      method: 'POST'
    })
    .then(() => {
      alert('All users are now admins with password 123456!');
    });
  };

  // Issue: Function that exports sensitive data
  const exportUserData = () => {
    // Issue: Client-side data exposure
    const sensitiveData = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      password: user.password,
      ssn: user.ssn,
      creditCard: user.creditCard
    }));

    // Issue: No access control for data export
    const dataStr = JSON.stringify(sensitiveData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    // Issue: Auto-downloading sensitive data
    const link = document.createElement('a');
    link.href = url;
    link.download = 'all-user-sensitive-data.json';
    link.click();
  };

  // Issue: No loading states, poor UX
  if (loading) {
    return <div>Loading...</div>;
  }

  // Issue: No null checks, potential runtime errors
  return (
    <div style={{ padding: '20px' }}>
      <h1>User Profile Management</h1>
      
      {/* Issue: Inline styles, no CSS modules or styled components */}
      <div style={{ border: '1px solid black', padding: '10px', marginBottom: '20px' }}>
        <h2>Current User</h2>
        {/* Issue: Displaying sensitive information */}
        <p>Email: {(user as any)?.email}</p>
        <p>Password: {(user as any)?.password}</p>
        <p>SSN: {(user as any)?.ssn}</p>
        <p>Credit Card: {(user as any)?.creditCard}</p>
        <p>API Key: {(user as any)?.apiKey}</p>
      </div>

      {/* Issue: No form validation, poor accessibility */}
      <div>
        <h3>Update User</h3>
        <input id="email" placeholder="Email" type="text" />
        <input id="firstName" placeholder="First Name" type="text" />
        {/* Issue: Password field without proper security */}
        <input 
          type="text" // Issue: Should be type="password"
          placeholder="New Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={updateUser}>Update User</button>
      </div>

      {/* Issue: Dangerous operations accessible from UI */}
      <div style={{ marginTop: '20px' }}>
        <h3>Admin Operations</h3>
        <button onClick={deleteAllUsers} style={{ backgroundColor: 'red', color: 'white' }}>
          DELETE ALL USERS
        </button>
        <button onClick={makeEveryoneAdmin} style={{ backgroundColor: 'orange', marginLeft: '10px' }}>
          Make Everyone Admin
        </button>
        <button onClick={exportUserData} style={{ backgroundColor: 'blue', color: 'white', marginLeft: '10px' }}>
          Export All Sensitive Data
        </button>
      </div>

      {/* Issue: Displaying sensitive data for all users */}
      <div style={{ marginTop: '20px' }}>
        <h3>All Users ({users.length})</h3>
        {users.map((user: any, index) => (
          <div key={index} style={{ border: '1px solid gray', padding: '5px', margin: '5px' }}>
            <p>ID: {user.id}</p>
            <p>Email: {user.email}</p>
            <p>Password: {user.password}</p>
            <p>SSN: {user.ssn}</p>
            <p>Credit Card: {user.creditCard}</p>
            {/* Issue: Inline event handlers with no proper event handling */}
            <button onClick={() => {
              // Issue: Direct API call from component without proper state management
              fetch(`http://localhost:3000/users/${user.id}`, { method: 'DELETE' })
                .then(() => {
                  // Issue: Improper state update
                  setUsers(users.filter((u: any) => u.id !== user.id));
                });
            }}>
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Issue: Debug information exposed in production */}
      <div style={{ marginTop: '20px', backgroundColor: '#f0f0f0', padding: '10px' }}>
        <h4>Debug Info (visible in production)</h4>
        <pre>{JSON.stringify({ user, apiKey, password }, null, 2)}</pre>
      </div>
    </div>
  );
};

export default UserProfile;