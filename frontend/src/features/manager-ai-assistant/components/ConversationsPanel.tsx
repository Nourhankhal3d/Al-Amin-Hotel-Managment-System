import { useCallback } from 'react';
import { ChevronRight, ReceiptText } from 'lucide-react';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatRelativeTime } from '../../../utils/date';
import { ASSISTANT_I18N, SIDE_PROMPTS } from '../constants/aiAssistant.constants';
import type { ConversationSummary } from '../types/aiAssistant.types';
import { pluralText } from '../utils/assistantDisplay';
import './ConversationsPanel.css';

interface ConversationsPanelProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  todayQuestions: number;
  todayConversations: number;
  now: number;
  isSending: boolean;
  onOpen: (id: string) => void;
  onAsk: (question: string) => void;
}

// Recent conversations, today's numbers and quick questions
export function ConversationsPanel({
  conversations,
  activeId,
  todayQuestions,
  todayConversations,
  now,
  isSending,
  onOpen,
  onAsk,
}: ConversationsPanelProps) {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${ASSISTANT_I18N}.${key}`), [translate]);
  const AskIcon = ChevronRight;

  return (
    <aside className="ai-side">
      <header className="ai-side__header">
        <h2>{t('recentTitle')}</h2>
        <p>{t('recentSubtitle')}</p>
      </header>

      {conversations.length === 0 ? (
        <p className="ai-side__empty">{t('noConversations')}</p>
      ) : (
        <ul className="ai-side__list">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                className={`ai-side__conversation${conversation.id === activeId ? ' ai-side__conversation--active' : ''}`}
                aria-current={conversation.id === activeId ? 'true' : undefined}
                onClick={() => onOpen(conversation.id)}
              >
                <span className="ai-side__icon" aria-hidden="true"><ReceiptText /></span>
                <span className="ai-side__text">
                  <strong>{conversation.title}</strong>
                  <span>{formatRelativeTime(conversation.updatedAt, language, now)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <section className="ai-side__section">
        <h3>{t('todayTitle')}</h3>
        <div className="ai-side__today">
          <span>{pluralText(t, 'questionsCount', todayQuestions, language)}</span>
          <span>{pluralText(t, 'conversationsCount', todayConversations, language)}</span>
        </div>
      </section>

      <section className="ai-side__section">
        <h3>{t('quickTitle')}</h3>
        <ul className="ai-side__prompts">
          {SIDE_PROMPTS.map((prompt) => (
            <li key={prompt}>
              <button type="button" className="ai-side__prompt" disabled={isSending} onClick={() => onAsk(t(`prompts.${prompt}`))}>
                <span>{t(`prompts.${prompt}`)}</span>
                <AskIcon aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
