import { useEffect, useState } from 'react';

function App() {
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    fetch('http://localhost:4000/health')
      .then((response) => response.json())
      .then((data) => {
        setStatus(data.status);
      })
      .catch(() => {
        setStatus('backend not reachable');
      });
  }, []);

  return (
    <div>
      <h1>DevPulse</h1>
      <p>Backend status: {status}</p>
    </div>
  );
}

export default App;