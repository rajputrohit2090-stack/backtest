import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../app/App';

describe('Meta5 connection screen', () => {
  it('renders only the first-step MetaTrader 5 connection flow', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Connect to MetaTrader 5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect to Meta5' })).toBeInTheDocument();
    expect(screen.getByLabelText('Desktop bridge URL')).toHaveValue('http://localhost:8787');
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});
