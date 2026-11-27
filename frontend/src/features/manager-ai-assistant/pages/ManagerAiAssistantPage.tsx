import { useCallback, useMemo, useState } from 'react';
import { Bed, Check, FileText, Plus, Sparkles, UserRound, Wallet, Wrench } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ErrorState } from '../../../components/common/ErrorState';
import { LoadingState } from '../../../components/common/LoadingState';
import { PageHero } from '../../../components/common/PageHero';
import { Button } from '../../../components/ui/Button';
import { StatCard } from '../../../components/ui/StatCard';
import { useToast } from '../../../components/ui/ToastContext';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { exportCsv } from '../../../utils/exportCsv';
import { formatClock, formatNumber } from '../../../utils/format';
import { ChatPanel } from '../components/ChatPanel';
import { ConversationsPanel } from '../components/ConversationsPanel';
import { ASSISTANT_I18N, NEW_CONVERSATION } from '../constants/aiAssistant.constants';
import { useAiOverview, useConversation, useConversations, useSendQuestion } from '../hooks/useAiAssistant';
import type { ChatMessage } from '../types/aiAssistant.types';
import { apiErrorText } from '../utils/apiErrorText';
import { formatCompact, formatScore, isSameDay, twoDigits } from '../utils/assistantDisplay';
import './ManagerAiAssistantPage.css';

// URL param: c = the open conversation ("new" for a chat that starts with the next question)
export function ManagerAiAssistantPage() {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${ASSISTANT_I18N}.${key}`), [translate]);
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const overviewQuery = useAiOverview();
  const conversationsQuery = useConversations(language);
  const conversations = useMemo(() => conversationsQuery.data ?? [], [conversationsQuery.data]);
  // With no conversation in the URL, the newest one is open
  const activeId = searchParams.get('c') ?? conversations[0]?.id ?? NEW_CONVERSATION;
  const conversationQuery = useConversation(activeId, language);
  const sendQuestion = useSendQuestion(language);
  const messages: ChatMessage[] = activeId === NEW_CONVERSATION ? [] : conversationQuery.data?.messages ?? [];

  const openConversation = useCallback((id: string, replace = false) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('c', id);
      return next;
    }, { replace });
  }, [setSearchParams]);

  const today = useMemo(() => {
    const todays = conversations.filter((item) => isSameDay(new Date(item.updatedAt), new Date(now)));
    return {
      questions: todays.reduce((sum, item) => sum + item.questionCount, 0),
      conversations: todays.length,
    };
  }, [conversations, now]);

  async function ask(question: string) {
    if (pendingQuestion !== null) return;
    setPendingQuestion(question);
    try {
      const saved = await sendQuestion.mutateAsync({ conversationId: activeId, content: question });
      if (saved.id !== activeId) openConversation(saved.id, true);
    } catch (error) {
      toast.notify(apiErrorText(error, t, language), 'error');
    } finally {
      setPendingQuestion(null);
    }
  }

  function exportConversation() {
    const title = conversations.find((item) => item.id === activeId)?.title ?? t('chatTitle');
    const exported = exportCsv<ChatMessage>(messages, [
      { header: t('export.sender'), value: (message) => (message.role === 'USER' ? t('export.manager') : t('chatTitle')) },
      { header: t('export.time'), value: (message) => `${new Date(message.createdAt).toLocaleDateString()} ${formatClock(new Date(message.createdAt), language)}` },
      { header: t('export.message'), value: (message) => message.content },
    ], `ai-assistant-${new Date().toISOString().slice(0, 10)}.csv`);
    if (exported) toast.notify(t('toastExported').replace('{title}', title), 'success');
    else toast.notify(t('toastNothingToExport'), 'warning');
  }

  const hero = (withActions: boolean) => (
    <PageHero eyebrow={t('eyebrow')} title={t('title')} description={t('description')}>
      {withActions && (
        <>
          <Button variant="glass" onClick={exportConversation}>
            <FileText aria-hidden="true" />
            {t('exportButton')}
          </Button>
          <Button variant="gold" onClick={() => openConversation(NEW_CONVERSATION)} disabled={pendingQuestion !== null}>
            <Plus aria-hidden="true" />
            {t('newConversation')}
          </Button>
        </>
      )}
    </PageHero>
  );

  if (conversationsQuery.isPending) {
    return <div className="feature-page manager-ai-assistant">{hero(false)}<LoadingState label={t('loading')} /></div>;
  }

  if (conversationsQuery.isError) {
    return (
      <div className="feature-page manager-ai-assistant">
        {hero(false)}
        <ErrorState
          title={t('loadError')}
          message={getErrorMessage(conversationsQuery.error, language)}
          action={<Button onClick={() => { void conversationsQuery.refetch(); }}>{t('retry')}</Button>}
        />
      </div>
    );
  }

  const overview = overviewQuery.data;
  const card = (value: number | undefined, format: (n: number) => string) => (value === undefined ? '—' : format(value));

  return (
    <div className="feature-page manager-ai-assistant">
      {hero(true)}

      <div className="stat-grid manager-ai-assistant__stats">
        <StatCard label={t('stats.occupied')} value={card(overview?.occupiedRooms, (n) => twoDigits(n, language))} icon={<Bed size={20} aria-hidden="true" />} tone="green" />
        <StatCard label={t('stats.available')} value={card(overview?.availableRooms, (n) => twoDigits(n, language))} icon={<Check size={20} aria-hidden="true" />} tone="green" />
        <StatCard label={t('stats.maintenance')} value={card(overview?.maintenanceRequests, (n) => twoDigits(n, language))} icon={<Wrench size={20} aria-hidden="true" />} tone="gold" />
        <StatCard label={t('stats.cleaning')} value={card(overview?.cleaningRequests, (n) => twoDigits(n, language))} icon={<Sparkles size={20} aria-hidden="true" />} tone="gold" />
        <StatCard label={t('stats.revenue')} value={card(overview?.revenueToday, (n) => formatCompact(n, language))} icon={<Wallet size={20} aria-hidden="true" />} tone="green" />
        <StatCard
          label={t('stats.satisfaction')}
          value={card(overview?.guestSatisfaction, (n) => `${formatScore(n, language)} / ${formatNumber(5, language)}`)}
          icon={<UserRound size={20} aria-hidden="true" />}
          tone="green"
        />
      </div>

      <div className="manager-ai-assistant__layout">
        <ConversationsPanel
          conversations={conversations}
          activeId={activeId}
          todayQuestions={today.questions}
          todayConversations={today.conversations}
          now={now}
          isSending={pendingQuestion !== null}
          onOpen={(id) => openConversation(id)}
          onAsk={(question) => { void ask(question); }}
        />
        <ChatPanel
          messages={messages}
          pendingQuestion={pendingQuestion}
          isLoading={activeId !== NEW_CONVERSATION && conversationQuery.isPending}
          onSend={(question) => { void ask(question); }}
        />
      </div>
    </div>
  );
}
