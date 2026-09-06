// App.jsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import MainRouting from './routing/MainRouting';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import FloatingButtons from './components/FloatingButtons';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="App">
            <ErrorBoundary>
              <MainRouting />
            </ErrorBoundary>
          </div>
        </CartProvider>
      </AuthProvider>

      <FloatingButtons />
      
    </Router>
  );
}

export default App;
