import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, Send, X, FileText, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  createSupportTicket,
  supportChat,
  supportSuggestions,
  type SupportArticle,
  type SupportChip,
  type SupportChatResponse,
  type SupportAudienceRole,
} from "@/lib/api";
import { markdownToPlainMultiline, markdownToPlainPreview } from "@/lib/markdownPlain";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ChatMessage = { from: "user" | "bot"; text: string };

function roleToAudienceRole(userType: string | undefined): SupportAudienceRole | undefined {
  if (!userType) return undefined;
  if (userType === "builder") return "builder";
  if (userType === "landowner") return "landowner";
  if (userType === "admin") return "admin";
  return undefined;
}

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "bot", text: "Hi! Ask me how the app works, or describe the issue you’re facing." },
  ]);
  const [chips, setChips] = useState<SupportChip[]>([]);
  const [articles, setArticles] = useState<SupportArticle[]>([]);
  const [ticketDraftOpen, setTicketDraftOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketStatus, setTicketStatus] = useState<string | null>(null);
  const [articleDetail, setArticleDetail] = useState<SupportArticle | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const listRef = useRef<HTMLDivElement | null>(null);

  const role = useMemo(() => roleToAudienceRole(user?.userType), [user?.userType]);
  const route = location.pathname;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await supportSuggestions({ route, role });
        if (cancelled) return;
        setChips(res.chips || []);
      } catch {
        if (!cancelled) setChips([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, route, role]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [open, messages.length, articles.length, chips.length]);

  const runChip = async (chip: SupportChip) => {
    const action = chip.action || {};
    const type = String((action as { type?: unknown }).type || "");
    if (type === "navigate") {
      const to = String((action as { to?: unknown }).to || "/");
      navigate(to);
      return;
    }
    if (type === "ask") {
      const text = String((action as { text?: unknown }).text || chip.label);
      await send(text);
      return;
    }
    if (type === "create_ticket") {
      setTicketDraftOpen(true);
      if (!ticketSubject) setTicketSubject("Need help");
      return;
    }
    // Fallback: treat as a user question
    await send(chip.label);
  };

  const applyChatResponse = (res: SupportChatResponse) => {
    setMessages((m) => [...m, { from: "bot", text: res.message }]);
    setChips(res.chips || []);
    setArticles(res.articles || []);
    if (res.flow?.prompt) {
      setMessages((m) => [...m, { from: "bot", text: res.flow!.prompt }]);
      if (res.flow?.options?.length) {
        // Convert flow options into chips
        setChips((prev) => [
          ...res.flow!.options.map((o) => ({ label: o.label, action: o.action })),
          ...prev,
        ]);
      }
    }
  };

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setTicketStatus(null);
    setSending(true);
    setMessages((m) => [...m, { from: "user", text: msg }]);
    setInput("");
    try {
      const res = await supportChat({
        message: msg,
        route,
        role,
        context: { userType: user?.userType, userName: user?.name, userEmail: user?.email },
      });
      applyChatResponse(res);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { from: "bot", text: `Sorry — I couldn’t fetch help right now. (${(e as Error).message})` },
      ]);
    } finally {
      setSending(false);
    }
  };

  const submitTicket = async () => {
    const subject = ticketSubject.trim();
    if (!subject) return;
    setTicketStatus(null);
    try {
      const res = await createSupportTicket({
        subject,
        description: ticketDescription.trim(),
        route,
        role,
        metadata: { lastMessages: messages.slice(-6) },
      });
      setTicketStatus(`Ticket created: ${res.ticketId} (${res.status})`);
      setTicketDraftOpen(false);
      setTicketSubject("");
      setTicketDescription("");
      setMessages((m) => [
        ...m,
        { from: "bot", text: `Created a support ticket: ${res.ticketId}. Our team will review it.` },
      ]);
    } catch (e) {
      setTicketStatus(`Could not create ticket: ${(e as Error).message}`);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-[70] rounded-full shadow-lg bg-primary text-primary-foreground w-14 h-14 flex items-center justify-center hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-target bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] max-[420px]:bottom-[max(5.5rem,env(safe-area-inset-bottom))]"
        aria-label="Open support chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed z-[80] left-3 right-3 sm:left-auto sm:w-[360px] sm:max-w-[calc(100vw-2rem-env(safe-area-inset-right))] sm:right-[max(0.75rem,env(safe-area-inset-right))] bottom-[max(0.75rem,env(safe-area-inset-bottom))] h-[min(520px,calc(100dvh-5.5rem-env(safe-area-inset-bottom)))] max-h-[min(520px,calc(100dvh-1.5rem))] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-primary" />
              <div>
                <div className="font-semibold leading-tight">Support</div>
                <div className="text-xs text-muted-foreground leading-tight">
                  {user ? `Signed in as ${user.userType}` : "Not signed in"}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-2 hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close support chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.from === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {chips.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {chips.slice(0, 8).map((c, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                    onClick={() => void runChip(c)}
                  >
                    {c.label}
                  </Button>
                ))}
              </div>
            )}

            {articles.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">Suggested articles</div>
                {articles.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setArticleDetail(a)}
                    className="w-full text-left rounded-xl border border-border bg-card p-3 hover:bg-muted/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground">{a.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {markdownToPlainPreview(a.content_md)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {ticketDraftOpen && (
            <div className="border-t border-border p-3 bg-background space-y-2">
              <div className="text-sm font-semibold">Create a ticket</div>
              <Input
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Subject"
              />
              <Input
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                placeholder="Describe the issue"
              />
              <div className="flex gap-2">
                <Button type="button" className="flex-1" onClick={() => void submitTicket()}>
                  Submit
                </Button>
                <Button type="button" variant="secondary" onClick={() => setTicketDraftOpen(false)}>
                  Cancel
                </Button>
              </div>
              {ticketStatus && <div className="text-xs text-muted-foreground">{ticketStatus}</div>}
            </div>
          )}

          {!ticketDraftOpen && (
            <div className="border-t border-border p-3 bg-background flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void send();
                }}
              />
              <Button type="button" className="shrink-0 gap-2" onClick={() => void send()} disabled={sending}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!articleDetail} onOpenChange={(open) => !open && setArticleDetail(null)}>
        <DialogContent className="max-w-md max-h-[min(70vh,520px)] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-left pr-8">{articleDetail?.title}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-foreground overflow-y-auto flex-1 min-h-0 whitespace-pre-wrap leading-relaxed pr-1">
            {articleDetail ? markdownToPlainMultiline(articleDetail.content_md) : ""}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

