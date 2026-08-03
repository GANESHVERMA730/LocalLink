import { useEffect, useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { fetchMessages } from '@/lib/queries';
import { joinBookingRoom, sendSocketMessage, onNewMessage, getSocket } from '@/lib/socket';
import PropTypes from 'prop-types';
import { Avatar } from '@/components/ui';
import { formatRelativeTime } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';

export function ChatWindow({ bookingId, otherName, otherAvatar }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let unsub;

    async function init() {
      try {
        const data = await fetchMessages(bookingId);
        setMessages(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }

      joinBookingRoom(bookingId);
      unsub = onNewMessage((msg) => {
        const message = msg;
        if (message.booking === bookingId) {
          setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
        }
      });
    }

    init();
    return () => {
      if (unsub) unsub();
      const s = getSocket();
      s.off('chat:newMessage');
    };
  }, [bookingId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    setText('');
    try {
      const response = await sendSocketMessage(bookingId, trimmed);
      if (response.success && response.message) {
        const msg = response.message;
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      }
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-ink-300" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-ink-400">No messages yet.</p>
            <p className="mt-1 text-xs text-ink-300">Start the conversation below.</p>
          </div>
        ) : (
          messages.map((m) => {
            const senderId = typeof m.sender === 'object' ? m.sender._id : m.sender;
            const isMe = senderId === user?._id;
            return (
              <div key={m._id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && <Avatar src={otherAvatar} name={otherName} size="sm" className="mt-1 shrink-0" />}
                <div className={`flex min-w-0 max-w-[78%] flex-col sm:max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`overflow-hidden whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm [overflow-wrap:anywhere] ${
                      isMe ? 'rounded-br-md bg-primary-600 text-white' : 'rounded-bl-md bg-ink-100 text-ink-800'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="mt-0.5 px-1 text-xs text-ink-400">{formatRelativeTime(m.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="shrink-0 border-t border-ink-100 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            className="input min-w-0 flex-1 resize-none py-2 text-base sm:text-sm"
            placeholder="Type a message…"
            disabled={sending}
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={sending || !text.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}

ChatWindow.propTypes = {
  bookingId: PropTypes.string.isRequired,
  otherName: PropTypes.string.isRequired,
  otherAvatar: PropTypes.string,
};
