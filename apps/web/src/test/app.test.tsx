import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../app/App';

it('renders the foundation landing page', () => {
  render(<App />);
  expect(screen.getByText('Login')).toBeInTheDocument();
});
