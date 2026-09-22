export default function MessageBubble({ role, content, sources }) {
  const isUser = role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', margin: '8px 0' }}>
      <div
        style={{
          maxWidth: '75%',
          padding: '10px 14px',
          borderRadius: 14,
          background: isUser ? '#2563eb' : '#f1f5f9',
          color: isUser ? '#fff' : '#0f172a',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.4,
        }}
      >
        <div>{content}</div>
        {!isUser && sources && sources.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
            Sources: {sources.map((s) => s.sourceTitle).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}
