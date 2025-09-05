import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { LogOut, Bot, User, Send, Loader2, Menu, X, History, Edit3 } from "lucide-react";
import { logout, getStoredUser } from "../../services/auth/auth";
import { nanoid } from "nanoid";
import { api } from "../../services/api/api";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
};

type Conversation = {
  id: string;
  title: string;
  updatedAt: number;
};

type CurrentUser = {
  name: string;
  email: string;
  avatarUrl?: string | null;
};

const SUGGESTIONS = [
  "Vale a pena aceitar frete a R$ 3,80/km nesta rota?",
  "Como reduzir custo de combustível na rota SP → RJ?",
  "Melhor alocar 2 ou 3 motoristas no turno noturno?",
  "Devo comprar pneus agora ou aguardar próxima safra?",
  "Qual impacto do diesel +5% no meu custo por km?",
];

export default function Home() {
  const nav = useNavigate();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [history, setHistory] = useState<Conversation[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{
    id: nanoid(),
    role: "assistant",
    ts: Date.now(),
    content: "Olá! Sou sua assistente de decisões para a transportadora. Pergunte sobre preços por km, roteirização, custos, contratos e alocação de motoristas que eu te ajudo com comparativos e cenários.",
  }]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);
  const listRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  useEffect(() => {
    async function loadHistory() {
      if (!drawerOpen) return;
      setHistoryError(null);
      setHistoryLoading(true);
      try {
        const data = await api("/ai/history");
        // Espera: [{ id, title, updatedAt }]
        const items = Array.isArray(data) ? data : data?.items || [];
        setHistory(items as Conversation[]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Não foi possível carregar o histórico";
        setHistoryError(msg);
      } finally {
        setHistoryLoading(false);
      }
    }
    void loadHistory();
  }, [drawerOpen]);

  useEffect(() => {
    // Load user from localStorage when opening the drawer
    if (!drawerOpen) return;
    setUserError(null);
    setUserLoading(true);
    try {
      const stored = getStoredUser<any>();
      if (stored) {
        const u: CurrentUser = {
          name: stored?.nome || stored?.nomeCompleto || stored?.name || "Usuário",
          email: stored?.email || "",
          avatarUrl: stored?.avatarUrl || stored?.avatar || null,
        };
        setUser(u);
      } else {
        setUser(null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Não foi possível carregar o usuário";
      setUserError(msg);
    } finally {
      setUserLoading(false);
    }
  }, [drawerOpen]);

  function handleLogout() {
    logout();
    nav("/login", { replace: true });
  }

  async function send(prompt?: string) {
    const text = (prompt ?? input).trim();
    if (!text) return;
    setError(null);

    const userMsg: Msg = { id: nanoid(), role: "user", content: text, ts: Date.now() };
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const payload = {
        messages: [...msgs, userMsg].map(({ role, content }) => ({ role, content })),
      };
      const data = await api("/ai/chat", { method: "POST", body: JSON.stringify(payload) });
      const reply = typeof data?.reply === "string" ? data.reply : "Não consegui obter uma resposta agora. Tente novamente.";
      const botMsg: Msg = { id: nanoid(), role: "assistant", content: reply, ts: Date.now() };
      setMsgs((m) => [...m, botMsg]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao consultar a IA";
      setError(msg);
      const botMsg: Msg = { id: nanoid(), role: "assistant", content: "Desculpe, houve um erro ao processar sua pergunta.", ts: Date.now() };
      setMsgs((m) => [...m, botMsg]);
    } finally {
      setLoading(false);
      taRef.current?.focus();
    }
  }

  async function openConversation(conv: Conversation) {
    try {
      setError(null);
      setLoading(true);
      const data = await api(`/ai/history/${conv.id}`);
      const messages: Msg[] = (data?.messages || []).map((m: any) => ({
        id: nanoid(),
        role: m.role === "user" ? "user" : "assistant",
        content: String(m.content || ""),
        ts: Date.now(),
      }));
      if (messages.length === 0) {
        messages.push({ id: nanoid(), role: "assistant", content: "Conversa vazia.", ts: Date.now() });
      }
      setMsgs(messages);
      setDrawerOpen(false);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }), 0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Não foi possível abrir a conversa";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) void send();
    }
  }

  function getInitials(text: string) {
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + last).toUpperCase();
  }

  return (
    <Viewport>
      <Topbar>
        <Brand>
          <HamburgerBtn onClick={() => setDrawerOpen(true)} aria-label="Abrir menu">
            <Menu size={18} />
          </HamburgerBtn>
          <img src="/images/logo.png" alt="Vai Logística" />
        </Brand>
        <Actions>
          <TopBtn onClick={handleLogout} aria-label="Sair">
            <LogOut size={18} />
            <span>Sair</span>
          </TopBtn>
        </Actions>
      </Topbar>

      <Container>
        <Panel>
          <PanelHead>
            <BotBadge>
              <Bot size={18} />
            </BotBadge>
            <div>
              <Title>Assistente de Decisões</Title>
              <Muted>IA especializada em transporte e logística</Muted>
            </div>
          </PanelHead>
          {msgs.length <= 2 && (
            <Suggestions>
              {SUGGESTIONS.map((s) => (
                <SugChip key={s} onClick={() => send(s)}>{s}</SugChip>
              ))}
            </Suggestions>
          )}

          <Divider />

          <ChatArea>
            <Messages ref={listRef} role="log" aria-live="polite">
              {msgs.map((m) => (
                <Bubble key={m.id} $role={m.role}>
                  {m.role === "assistant" ? (
                    <>
                      <IconCircle $role={m.role}><Bot size={16} /></IconCircle>
                      <BubbleText $role={m.role}>{m.content}</BubbleText>
                    </>
                  ) : (
                    <>
                      <BubbleText $role={m.role}>{m.content}</BubbleText>
                      <IconCircle $role={m.role}><User size={16} /></IconCircle>
                    </>
                  )}
                </Bubble>
              ))}

              {loading && (
                <Bubble $role="assistant">
                  <IconCircle $role="assistant"><Bot size={16} /></IconCircle>
                  <BubbleText $role="assistant">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Loader2 className="spin" size={16} /> Pensando…
                    </span>
                  </BubbleText>
                </Bubble>
              )}
            </Messages>

            {error && <ErrBanner role="alert">{error}</ErrBanner>}

            <InputRow>
              <Ta
                ref={taRef}
                rows={1}
                placeholder="Pergunte sobre preço por km, rotas, custos…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Pergunta para a assistente"
              />
              <SendBtn onClick={() => send()} disabled={!canSend} aria-label="Enviar">
                {loading ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
              </SendBtn>
            </InputRow>

            <FootNote>
              Recomendações são auxiliares e não substituem sua análise financeira e regulatória.
            </FootNote>
          </ChatArea>
        </Panel>
      </Container>

      <DrawerOverlay $open={drawerOpen} onClick={() => setDrawerOpen(false)} />
      <Drawer $open={drawerOpen} role="dialog" aria-label="Menu e histórico">
        <DrawerHeader>
          <strong>Histórico</strong>
          <CloseBtn onClick={() => setDrawerOpen(false)} aria-label="Fechar">
            <X size={18} />
          </CloseBtn>
        </DrawerHeader>

        {historyLoading && <DrawerHint><Loader2 className="spin" size={16} /> Carregando…</DrawerHint>}
        {historyError && <DrawerErr role="alert">{historyError}</DrawerErr>}

        <DrawerList>
          {history.map((c) => (
            <ConvItem key={c.id} onClick={() => openConversation(c)}>
              <History size={16} />
              <div className="meta">
                <div className="title">{c.title || "Conversa"}</div>
                <div className="sub">{new Date(c.updatedAt).toLocaleString()}</div>
              </div>
            </ConvItem>
          ))}

          {!historyLoading && history.length === 0 && !historyError && (
            <DrawerHint>Nenhuma conversa encontrada.</DrawerHint>
          )}
        </DrawerList>

        <DrawerFooter>
          <UserCard onClick={() => setUserMenuOpen((v) => !v)} aria-label="Abrir menu do usuário">
            <Avatar>
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user?.name || "Usuário"} />
              ) : (
                <span>{getInitials(user?.name || user?.email || "U")}</span>
              )}
            </Avatar>
            <div className="info">
              <div className="name">{userLoading ? "Carregando…" : user?.name || "Usuário"}</div>
              <div className="email">{userError ? "" : user?.email}</div>
            </div>
          </UserCard>

          <UserModalOverlay $open={userMenuOpen} onClick={() => setUserMenuOpen(false)} />
          <UserModal $open={userMenuOpen} role="dialog" aria-label="Opções do usuário">
            <UserAction onClick={() => { setUserMenuOpen(false); nav("/profile/edit"); }}>
              <Edit3 size={16} /> Editar perfil
            </UserAction>
          </UserModal>
        </DrawerFooter>
      </Drawer>
    </Viewport>
  );
}

// =============== styled ===============
const Viewport = styled.main`
  min-height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr;
  background: ${({ theme }) => theme.colors.bg};
  background-image:
    linear-gradient(180deg, rgba(253,78,6,0.05), transparent 40%),
    radial-gradient(1200px 400px at 20% -10%, rgba(253,78,6,0.05), transparent 60%);
`;

const Topbar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
`;

const Brand = styled.div`
  display: flex; align-items: center; gap: 10px;
  img { height: 48px; width: auto; display: block; }
`;

const HamburgerBtn = styled.button`
  display: inline-flex; align-items: center; justify-content: center;
  height: 34px; width: 34px; border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.surfaceHover || "#f5f5f5"}; }
`;

const Actions = styled.div`
  display: flex; align-items: center; gap: 10px;
`;

const TopBtn = styled.button`
  display: inline-flex; align-items: center; gap: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  padding: 8px 12px; border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.surfaceHover || "#f5f5f5"}; }
`;

const Container = styled.section`
  width: min(980px, 94%);
  margin: 0 auto;
  padding: 28px 0 36px;
`;

const Panel = styled.section`
  position: relative;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.lg};
  padding: 18px;
  overflow: hidden;
  display: grid; gap: 14px;

  &::before {
    content: "";
    position: absolute; inset: -30% 60% auto -10%; height: 140px;
    background: ${({ theme }) => theme.colors.primary};
    opacity: 0.09; transform: rotate(16deg);
    filter: blur(20px);
    pointer-events: none;
  }
`;

const PanelHead = styled.div`
  display: flex; align-items: center; gap: 10px;
`;

const BotBadge = styled.div`
  width: 36px; height: 36px; display: grid; place-items: center;
  background: ${({ theme }) => theme.colors.assistantBubbleBg};
  border-radius: 50%; color: ${({ theme }) => theme.colors.text};
`;

const Title = styled.h2` margin: 0; font-size: 18px; `;
const Muted = styled.div`
  color: ${({ theme }) => theme.colors.textMuted }; font-size: 14px;
  display: inline-flex; align-items: center; gap: 8px;
  &::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: #2ecc71; box-shadow: 0 0 0 3px rgba(46,204,113,0.15); }
`;

const Suggestions = styled.div`
  display: flex; flex-wrap: wrap; gap: 10px;
`;
const SugChip = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.assistantBubbleBg};
  color: ${({ theme }) => theme.colors.text};
  padding: 10px 12px; border-radius: 999px;
  cursor: pointer; font-weight: 600; font-size: 14px;
  transition: transform .12s ease, background .12s ease;
  &:hover { transform: translateY(-1px); }
`;

const Divider = styled.hr`
  border: none; border-top: 1px solid ${({ theme }) => theme.colors.border}; margin: 2px 0;
`;

const ChatArea = styled.div`
  display: grid; grid-template-rows: 1fr auto auto; gap: 10px; min-height: 50vh;
`;

const Messages = styled.div`
  overflow: auto; padding: 6px 4px; display: grid; gap: 10px;
  max-height: min(62vh, 620px);
  scrollbar-width: thin;
  &::-webkit-scrollbar { height: 8px; width: 8px; }
  &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.colors.border}; border-radius: 8px; }
`;

const Bubble = styled.div<{ $role: Msg["role"] }>`
  display: flex; align-items: flex-start; gap: 8px;
  justify-content: ${({ $role }) => ($role === "user" ? "flex-end" : "flex-start")};
`;

const IconCircle = styled.div<{ $role: Msg["role"] }>`
  width: 28px; height: 28px; display: grid; place-items: center;
  border-radius: 50%; flex: 0 0 auto;
  color: ${({ theme, $role }) => ($role === "user" ? theme.colors.primaryText : theme.colors.text)};
  background: ${({ theme, $role }) => ($role === "user" ? theme.colors.userBubbleBg : theme.colors.assistantBubbleBg)};
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
`;

const BubbleText = styled.div<{ $role?: Msg["role"] }>`
  max-width: min(70ch, 72%);
  background: ${({ theme, $role }) => ($role === "user" ? theme.colors.userBubbleBg : theme.colors.assistantBubbleBg)};
  border: 1px solid
    ${({ theme, $role }) => ($role === "user" ? "transparent" : theme.colors.border)};
  border-radius: ${({ $role }) => ($role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px")};
  padding: 12px 14px; line-height: 1.45;
  color: ${({ theme, $role }) => ($role === "user" ? theme.colors.primaryText : theme.colors.text)};
  white-space: pre-wrap; box-shadow: 0 2px 12px rgba(0,0,0,0.06);
`;

const ErrBanner = styled.div`
  background: #FFE8E6; color: #8B1212; border: 1px solid #F5C2C0;
  padding: 10px 12px; border-radius: ${({ theme }) => theme.radius.md}; font-size: 14px;
`;

const InputRow = styled.div`
  position: sticky; bottom: 0; background: ${({ theme }) => theme.colors.surface};
  display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: end;
  padding-top: 8px; border-top: 1px dashed ${({ theme }) => theme.colors.border};
`;

const Ta = styled.textarea`
  width: 100%; resize: vertical; min-height: 48px; max-height: 200px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.assistantBubbleBg};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 16px; padding: 12px 14px; outline: none;
  &:focus { box-shadow: 0 0 0 3px rgba(253,78,6,0.16); border-color: ${({ theme }) => theme.colors.primary}; }
`;

const SendBtn = styled.button`
  display: inline-flex; align-items: center; justify-content: center;
  height: 48px; aspect-ratio: 1/1; border-radius: 14px;
  border: none; cursor: pointer;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.primaryText};
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
  box-shadow: 0 6px 18px rgba(253,78,6,0.22);
  transform: translateZ(0);
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const FootNote = styled.div`
  text-align: center; color: ${({ theme }) => theme.colors.textMuted}; font-size: 12px;
`;

// Drawer lateral
const DrawerOverlay = styled.div<{ $open: boolean }>`
  position: fixed; inset: 0; background: rgba(0,0,0,0.28);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transition: opacity .22s ease;
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  z-index: 50;
`;

const Drawer = styled.aside<{ $open: boolean }>`
  position: fixed; left: 0; top: 0; bottom: 0; width: 320px;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadow.lg};
  padding: 12px; display: grid; grid-template-rows: auto 1fr auto; gap: 8px;
  transform: translateX(${({ $open }) => ($open ? '0' : '-100%')});
  transition: transform .26s ease;
  z-index: 51;
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
`;

const DrawerHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
`;

const CloseBtn = styled.button`
  display: inline-flex; align-items: center; justify-content: center;
  height: 32px; width: 32px; border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent; border-radius: 6px; cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.surfaceHover || "#f5f5f5"}; }
`;

const DrawerList = styled.div`
  overflow: auto; display: grid; gap: 6px; padding-right: 4px;
`;

const ConvItem = styled.button`
  display: grid; grid-template-columns: 20px 1fr; gap: 10px; align-items: center;
  text-align: left; border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.assistantBubbleBg};
  padding: 10px; border-radius: 10px; cursor: pointer;
  .meta { overflow: hidden; }
  .title { font-weight: 600; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
  .sub { color: ${({ theme }) => theme.colors.textMuted}; font-size: 12px; }
  &:hover { opacity: 0.9; }
`;

const DrawerHint = styled.div`
  color: ${({ theme }) => theme.colors.textMuted}; font-size: 14px; padding: 8px 4px;
`;

const DrawerErr = styled.div`
  background: #FFE8E6; color: #8B1212; border: 1px solid #F5C2C0;
  padding: 10px 12px; border-radius: ${({ theme }) => theme.radius.md}; font-size: 14px;
`;

const DrawerFooter = styled.div`
  position: relative; padding-top: 4px; border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const UserCard = styled.button`
  width: 100%; display: grid; grid-template-columns: 40px 1fr; gap: 10px; align-items: center;
  text-align: left; border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.assistantBubbleBg};
  padding: 10px; border-radius: 12px; cursor: pointer;
  .info { overflow: hidden; }
  .name { font-weight: 700; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
  .email { color: ${({ theme }) => theme.colors.textMuted}; font-size: 12px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
  &:hover { opacity: .95; }
`;

const Avatar = styled.div`
  width: 40px; height: 40px; border-radius: 50%; overflow: hidden; display: grid; place-items: center;
  background: ${({ theme }) => theme.colors.userBubbleBg}; color: ${({ theme }) => theme.colors.primaryText};
  img { width: 100%; height: 100%; object-fit: cover; }
  span { font-weight: 800; }
`;

const UserModalOverlay = styled.div<{ $open: boolean }>`
  position: absolute; inset: 0 0 56px 0; background: rgba(0,0,0,0.06);
  opacity: ${({ $open }) => ($open ? 1 : 0)}; transition: opacity .18s ease;
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')}; border-radius: 10px;
`;

const UserModal = styled.div<{ $open: boolean }>`
  position: absolute; left: 12px; right: 12px; bottom: 64px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px; box-shadow: ${({ theme }) => theme.shadow.md};
  transform: translateY(${({ $open }) => ($open ? '0' : '8px')});
  opacity: ${({ $open }) => ($open ? 1 : 0)}; transition: all .18s ease;
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
`;

const UserAction = styled.button`
  width: 100%; display: flex; align-items: center; gap: 8px;
  border: none; background: transparent; color: ${({ theme }) => theme.colors.text};
  padding: 12px; cursor: pointer; border-radius: 12px;
  &:hover { background: ${({ theme }) => theme.colors.assistantBubbleBg}; }
`;
