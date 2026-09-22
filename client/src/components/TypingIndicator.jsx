export default function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '8px 0' }}>
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 14,
          background: '#f1f5f9',
          color: '#64748b',
          fontStyle: 'italic',
        }}
      >
        UniAssist is typing…
      </div>
    </div>
  );
}
