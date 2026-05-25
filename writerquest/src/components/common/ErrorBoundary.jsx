import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('앱 오류:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', gap: '16px',
          fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '2rem',
        }}>
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <h2 style={{ margin: 0 }}>앱 오류가 발생했습니다</h2>
          <p style={{ color: '#888', fontSize: '14px', maxWidth: '400px' }}>
            {this.state.error?.message || '알 수 없는 오류입니다.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 24px', background: '#9b7fd4', color: '#fff',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
            }}
          >
            다시 시작
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
