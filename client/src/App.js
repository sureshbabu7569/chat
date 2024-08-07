import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:3001');

function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    socket.on('init', (messages) => {
      setMessages(messages);
    });

    socket.on('message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off('init');
      socket.off('message');
    };
  }, []);

  const sendMessage = () => {
    const msg = { user: username, message };
    socket.emit('message', msg);
    setMessage('');
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3001/login', { username, password });
      if (response.data.token) {
        setIsLoggedIn(true);
        setError('');
      }
    } catch (error) {
      setError('Invalid credentials');
    }
  };

  const handleRegister = async () => {
    try {
      const response = await axios.post('http://localhost:3001/register', { username, password });
      if (response.data.message === 'User registered successfully') {
        setIsRegistering(false);
        setError('');
      }
    } catch (error) {
      setError('Registration failed');
    }
  };

  return (
    <div>
      {isLoggedIn ? (
        <div>
          <div>
            {messages.map((msg, index) => (
              <div key={index}>
                <strong>{msg.user}:</strong> {msg.message}
              </div>
            ))}
          </div>
          <input value={message} onChange={(e) => setMessage(e.target.value)} />
          <button onClick={sendMessage}>Send</button>
        </div>
      ) : (
        <div>
          {isRegistering ? (
            <div>
              <h2>Register</h2>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
              <button onClick={handleRegister}>Register</button>
              <button onClick={() => setIsRegistering(false)}>Back to Login</button>
              {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
          ) : (
            <div>
              <h2>Login</h2>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
              <button onClick={handleLogin}>Login</button>
              <button onClick={() => setIsRegistering(true)}>Register</button>
              {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
