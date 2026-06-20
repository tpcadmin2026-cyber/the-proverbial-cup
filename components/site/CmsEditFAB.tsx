'use client'

interface Props {
  onEdit: () => void
}

export function CmsEditFAB({ onEdit }: Props) {
  return (
    <button
      onClick={onEdit}
      title="Edit page content"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9000,
        backgroundColor: '#35291C',
        color: '#E8E6D8',
        border: '1px solid #C4AB77',
        borderRadius: '6px',
        padding: '8px 14px',
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
        letterSpacing: '0.02em',
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      Edit pages
    </button>
  )
}
