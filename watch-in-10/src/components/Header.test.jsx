import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';
import { I18nProvider } from '../i18n/I18nContext';

function renderHeader(props = {}) {
  const defaults = {
    onSurpriseMe: vi.fn(),
    theme: 'light',
    onToggleTheme: vi.fn(),
    onOpenFavorites: vi.fn(),
    onOpenQueue: vi.fn(),
    onOpenStats: vi.fn(),
    onOpenRoom: vi.fn(),
    queueCount: 0,
  };
  return render(
    <I18nProvider>
      <Header {...defaults} {...props} />
    </I18nProvider>
  );
}

describe('Header', () => {
  it('renders title text', () => {
    renderHeader();
    expect(screen.getByText(/What Should I Watch/)).toBeInTheDocument();
  });

  it('renders language selector with options', () => {
    renderHeader();
    const select = screen.getByLabelText('Select language');
    expect(select).toBeInTheDocument();
    expect(select.options.length).toBeGreaterThanOrEqual(4);
  });

  it('renders Watch Room button and calls handler on click', () => {
    const onOpenRoom = vi.fn();
    renderHeader({ onOpenRoom });
    const btn = screen.getByTitle('Watch Room');
    fireEvent.click(btn);
    expect(onOpenRoom).toHaveBeenCalledTimes(1);
  });

  it('renders Surprise Me button and calls handler', () => {
    const onSurpriseMe = vi.fn();
    renderHeader({ onSurpriseMe });
    const btn = screen.getByText('Surprise Me');
    fireEvent.click(btn);
    expect(onSurpriseMe).toHaveBeenCalledTimes(1);
  });

  it('shows queue badge when queueCount > 0', () => {
    renderHeader({ queueCount: 5 });
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not show queue badge when queueCount is 0', () => {
    renderHeader({ queueCount: 0 });
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    const onToggleTheme = vi.fn();
    renderHeader({ onToggleTheme });
    const btn = screen.getByLabelText(/Switch to dark mode/);
    fireEvent.click(btn);
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('renders My List button', () => {
    const onOpenFavorites = vi.fn();
    renderHeader({ onOpenFavorites });
    const btn = screen.getByText(/My List/);
    fireEvent.click(btn);
    expect(onOpenFavorites).toHaveBeenCalledTimes(1);
  });

  it('header top bar is center-aligned', () => {
    renderHeader();
    const nav = screen.getByLabelText('Site actions');
    expect(nav).toBeInTheDocument();
  });
});
