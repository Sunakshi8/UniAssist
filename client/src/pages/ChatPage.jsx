import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatWindow from '../components/ChatWindow';

export default function ChatPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <strong>UniAssist</strong>
        <div style={{ fontSize: 14 }}>
          {user?.name}{' '}
          <button onClick={handleLogout} style={{ marginLeft: 12, cursor: 'pointer' }}>
            Log out
          </button>
        </div>
      </header>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ChatWindow />
      </div>
    </div>
  );
}
