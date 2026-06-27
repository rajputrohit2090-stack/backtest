import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../app/App';

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, '', '/');
});

describe('App shell routing', () => {
  it('renders the existing authentication entry point for guests', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('renders the dashboard shell for authenticated users', async () => {
    localStorage.setItem('accessToken', 'test-token');
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Total Strategies')).toBeInTheDocument();
    expect(screen.getByText('Strategy Builder')).toBeInTheDocument();
  });
});
