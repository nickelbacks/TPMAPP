import React from 'react'
import ReactDOM from 'react-dom/client'
import { LangProvider } from './i18n.jsx'
import App from './App.jsx'
import './App.css'

class ErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ color: '#ef4444' }}>Erreur detectee</h1>
          <pre style={{ background: '#fef2f2', padding: 20, borderRadius: 10, overflow: 'auto' }}>
            {this.state.error.toString() + '\n\n' + this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LangProvider>
        <App />
      </LangProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
