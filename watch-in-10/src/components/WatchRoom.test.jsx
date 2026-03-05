import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WatchRoom from './WatchRoom';
import { I18nProvider } from '../i18n/I18nContext';

function renderWatchRoom(props = {}) {
  const defaults = {
    roomId: 'ABC123',
    roomData: {
      host: 'user1',
      video: { id: 'vid1', title: 'Test Video', channel: 'Test Channel', thumbnail: '', url: '' },
      state: { playing: false, currentTime: 0, updatedAt: Date.now(), updatedBy: 'user1' },
    },
    isHost: true,
    participants: {
      user1: { name: 'Alice', color: '#FF6B6B', joinedAt: Date.now() },
      user2: { name: 'Bob', color: '#4ECDC4', joinedAt: Date.now() },
    },
    reactions: [],
    messages: [],
    userId: 'user1',
    onSyncPlayback: vi.fn(),
    onSendReaction: vi.fn(),
    onSendMessage: vi.fn(),
    onSetVideo: vi.fn(),
    onLeave: vi.fn(),
    onChannelClick: vi.fn(),
  };
  return render(
    <I18nProvider>
      <WatchRoom {...defaults} {...props} />
    </I18nProvider>
  );
}

describe('WatchRoom', () => {
  it('renders room ID', () => {
    renderWatchRoom();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });

  it('renders participant names', () => {
    renderWatchRoom();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders video title', () => {
    renderWatchRoom();
    expect(screen.getByText('Test Video')).toBeInTheDocument();
  });

  it('renders channel name as clickable link', () => {
    const onChannelClick = vi.fn();
    renderWatchRoom({ onChannelClick });
    const channelBtn = screen.getByText('Test Channel');
    expect(channelBtn.tagName).toBe('BUTTON');
    fireEvent.click(channelBtn);
    expect(onChannelClick).toHaveBeenCalled();
  });

  it('renders Leave Room button and calls handler', () => {
    const onLeave = vi.fn();
    renderWatchRoom({ onLeave });
    const btn = screen.getByText('Leave Room');
    fireEvent.click(btn);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('renders reaction emoji buttons', () => {
    const onSendReaction = vi.fn();
    renderWatchRoom({ onSendReaction });
    const reactionBtns = screen.getAllByRole('button', { name: /React with/ });
    expect(reactionBtns.length).toBe(8);
    fireEvent.click(reactionBtns[0]);
    expect(onSendReaction).toHaveBeenCalledTimes(1);
  });

  it('renders chat section', () => {
    renderWatchRoom();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('sends chat message on form submit', () => {
    const onSendMessage = vi.fn();
    renderWatchRoom({ onSendMessage });
    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Hello!' } });
    fireEvent.submit(input.closest('form'));
    expect(onSendMessage).toHaveBeenCalledWith('Hello!');
  });

  it('displays chat messages', () => {
    renderWatchRoom({
      messages: [
        { key: 'm1', userId: 'user1', name: 'Alice', text: 'Hi there!', timestamp: Date.now() },
        { key: 'm2', userId: 'user2', name: 'Bob', text: 'Hey!', timestamp: Date.now() },
      ],
    });
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    expect(screen.getByText('Hey!')).toBeInTheDocument();
  });

  it('renders video chat toggle button', () => {
    renderWatchRoom();
    expect(screen.getByText('Start Video')).toBeInTheDocument();
  });

  it('renders Change Video button for host', () => {
    renderWatchRoom({ isHost: true });
    expect(screen.getByText('Change Video')).toBeInTheDocument();
  });

  it('does not render Change Video button for non-host', () => {
    renderWatchRoom({ isHost: false });
    expect(screen.queryByText('Change Video')).not.toBeInTheDocument();
  });

  it('shows Copy Link button', () => {
    renderWatchRoom();
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
  });

  it('shows participant count', () => {
    renderWatchRoom();
    expect(screen.getByText(/2 watching/)).toBeInTheDocument();
  });
});
