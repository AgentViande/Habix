import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const FaultyComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Simulation crash critique');
  }
  return <div>Contenu normal</div>;
};

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <FaultyComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Contenu normal')).toBeInTheDocument();
  });

  it('catches error and displays recovery UI with Recharger and Exporter options', () => {
    // Suppress console.error in test output for intentional error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <FaultyComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Une erreur inattendue est survenue')).toBeInTheDocument();
    expect(screen.getByText(/Simulation crash critique/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recharger/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exporter mes données/i })).toBeInTheDocument();

    spy.mockRestore();
  });
});
