import { useState } from 'react';

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #e2e8f0' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask about admissions, deadlines, fees…"
        disabled={disabled}
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: 20,
          border: '1px solid #cbd5e1',
          outline: 'none',
        }}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        style={{
          padding: '10px 20px',
          borderRadius: 20,
          border: 'none',
          background: disabled ? '#94a3b8' : '#2563eb',
          color: '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        Send
      </button>
    </form>
  );
}
