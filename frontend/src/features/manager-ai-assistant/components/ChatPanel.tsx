import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatClock, formatNumber } from '../../../utils/format';
import { ASSISTANT_I18N, CHAT_PROMPTS, QUESTION_MAX_LENGTH } from '../constants/aiAssistant.constants';
import type { ChatMessage } from '../types/aiAssistant.types';
import { dayLabel } from '../utils/assistantDisplay';
import './ChatPanel.css';

interface ChatPanelProps {
  messages: ChatMessage[];
  /** The question being sent: shown right away, with "typing" under it */
  pendingQuestion: string | null;
  isLoading: boolean;
  onSend: (question: string) => void;
}

export function ChatPanel({ messages, pendingQuestion, isLoading, onSend }: ChatPanelProps) {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${ASSISTANT_I18N}.${key}`), [translate]);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const isSending = pendingQuestion !== null;
  // Same arrow as the design in both languages
  const SendIcon = ChevronRight;
  const tooLong = draft.trim().length > QUESTION_MAX_LENGTH;

  // Keep the newest message in view
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length, pendingQuestion]);

  function send(text: string) {
    const question = text.trim();
    if (!question || isSending || question.length > QUESTION_MAX_LENGTH) return;
    onSend(question);
    setDraft('');
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    send(draft);
  }

  // Enter sends, Shift+Enter starts a new line
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(draft);
    }
  }

  const firstAt = messages[0]?.createdAt ?? (isSending ? new Date().toISOString() : null);

  return (
    <section className="ai-chat" aria-label={t('chatTitle')}>
      <header className="ai-chat__header">
        <span className="ai-chat__avatar" aria-hidden="true"><Search /></span>
        <div>
          <h2>{t('chatTitle')}</h2>
          <span className="ai-chat__status"><span aria-hidden="true" />{t('ready')}</span>
        </div>
      </header>

      <div className="ai-chat__messages" ref={listRef} aria-live="polite" aria-busy={isSending || isLoading}>
        {isLoading ? (
          <p className="ai-chat__placeholder">{t('loadingConversation')}</p>
        ) : messages.length === 0 && !isSending ? (
          <div className="ai-chat__welcome">
            <strong>{t('welcomeTitle')}</strong>
            <p>{t('welcomeText')}</p>
          </div>
        ) : (
          <>
            {firstAt && (
              <span className="ai-chat__day">
                {dayLabel(firstAt, t, language)} · {formatClock(new Date(firstAt), language)}
              </span>
            )}
            {messages.map((message) => (message.role === 'USER' ? (
              <div key={message.id} className="ai-chat__bubble">
                <p>{message.content}</p>
                <time dateTime={message.createdAt}>{formatClock(new Date(message.createdAt), language)}</time>
              </div>
            ) : (
              <article key={message.id} className="ai-chat__answer">
                <h3><Search aria-hidden="true" />{t('chatTitle')}</h3>
                <p>{message.content}</p>
                <time dateTime={message.createdAt}>{formatClock(new Date(message.createdAt), language)}</time>
              </article>
            )))}
            {isSending && (
              <>
                <div className="ai-chat__bubble">
                  <p>{pendingQuestion}</p>
                </div>
                <article className="ai-chat__answer ai-chat__answer--typing">
                  <h3><Search aria-hidden="true" />{t('chatTitle')}</h3>
                  <p className="ai-chat__typing">
                    <span className="ai-chat__dots" aria-hidden="true"><span /><span /><span /></span>
                    {t('thinking')}
                  </p>
                </article>
              </>
            )}
          </>
        )}
      </div>

      <div className="ai-chat__composer">
        <div className="ai-chat__prompts">
          {CHAT_PROMPTS.map((prompt) => (
            <button key={prompt} type="button" className="ai-chat__prompt" disabled={isSending} onClick={() => send(t(`prompts.${prompt}`))}>
              {t(`prompts.${prompt}`)}
            </button>
          ))}
        </div>
        <form className="ai-chat__form" onSubmit={handleSubmit}>
          <label className="ai-chat__input">
            <span className="ai-chat__sr">{t('inputLabel')}</span>
            <textarea
              rows={1}
              value={draft}
              placeholder={t('inputPlaceholder')}
              maxLength={QUESTION_MAX_LENGTH + 50}
              aria-invalid={tooLong || undefined}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
            />
          </label>
          <button type="submit" className="ai-chat__send" disabled={isSending || !draft.trim() || tooLong} aria-label={t('send')}>
            <SendIcon aria-hidden="true" />
          </button>
        </form>
        {tooLong && (
          <span className="ai-chat__error" role="alert">
            {t('errors.tooLong').replace('{max}', formatNumber(QUESTION_MAX_LENGTH, language))}
          </span>
        )}
      </div>
    </section>
  );
}
