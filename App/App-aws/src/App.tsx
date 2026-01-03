import React from 'react';
import AppRouter from './router/AppRouter';
import ErrorBoundary from './components/shared/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}

export default App;
