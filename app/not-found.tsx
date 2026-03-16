import React from 'react'

export default function NotFound(): React.ReactElement {
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg)',
        color: 'var(--txt)',
      },
    },
    React.createElement(
      'h1',
      { style: { fontSize: '4rem', fontWeight: 300, marginBottom: '1rem' } },
      '404'
    ),
    React.createElement(
      'p',
      { style: { marginBottom: '2rem', color: 'var(--txt2)' } },
      'This page does not exist.'
    ),
    React.createElement(
      'a',
      {
        href: '/',
        style: {
          padding: '10px 20px',
          borderRadius: '12px',
          background: '#c9a86c',
          color: '#2a1a00',
          textDecoration: 'none',
          fontSize: '13px',
        },
      },
      'Back to Aurelius'
    )
  )
}