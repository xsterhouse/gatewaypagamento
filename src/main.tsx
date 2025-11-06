import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './registerSW'

// Registrar Service Worker para PWA
registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)
