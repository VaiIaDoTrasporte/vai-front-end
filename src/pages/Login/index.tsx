import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const LoginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  remember: z.boolean().optional(),
});

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState<LoginForm>({ email: "", password: "", remember: true });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => form.email && form.password && !loading, [form, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const parsed = LoginSchema.safeParse({ ...form });
    if (!parsed.success) {
      console.log("🚀 ~ handleSubmit ~ parsed:", parsed)
      setErrors(parsed.error.flatten().fieldErrors as Partial<Record<keyof LoginForm, string>>);
      return;
    }

    try {
      setLoading(true);
      // 🔐 TODO: trocar por chamada real à sua API
      await new Promise((r) => setTimeout(r, 900));

      // Exemplo de persistência simplificada (troque por token real)
      if (form.remember) localStorage.setItem("auth-demo", JSON.stringify({ email: form.email, ts: Date.now() }));

      nav("/", { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Não foi possível entrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Viewport>
      <Card>
        <Header>
          <BrandIcon aria-hidden>
            <span>🚚</span>
          </BrandIcon>
          <div>
            <Title>IA para Transportes</Title>
            <Subtitle>Entre com sua conta</Subtitle>
          </div>
        </Header>

        <Form onSubmit={handleSubmit} noValidate>
          <FormGroup>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="voce@empresa.com"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-err" : undefined}
            />
            {errors.email && <ErrorText id="email-err">{errors.email}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Senha</Label>
            <PasswordWrap>
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "pwd-err" : undefined}
              />
              <IconBtn
                type="button"
                aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPwd((v) => !v)}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </IconBtn>
            </PasswordWrap>
            {errors.password && <ErrorText id="pwd-err">{errors.password}</ErrorText>}
          </FormGroup>

          <Row>
            <label style={{ display: "inline-flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <Checkbox
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setForm((s) => ({ ...s, remember: e.target.checked }))}
              />
              <span>Lembrar de mim</span>
            </label>
            <Spacer />
            <MutedLink href="#">Esqueci minha senha</MutedLink>
          </Row>

          {serverError && <ServerError role="alert">{serverError}</ServerError>}

          <SubmitBtn type="submit" disabled={!canSubmit} $loading={loading}>
            {loading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Loader2 className="spin" size={18} /> Entrando…
              </span>
            ) : (
              "Entrar"
            )}
          </SubmitBtn>
        </Form>

        <Footer>
          <Small>Ao entrar, você concorda com os Termos e a Política de Privacidade.</Small>
        </Footer>
      </Card>
    </Viewport>
  );
}

// ===================== styled ===================== //
const Viewport = styled.main`
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: ${({ theme }) => theme.colors.bg};
  padding: 24px;
`;

const Card = styled.section`
  width: 100%;
  max-width: 420px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.md};
  padding: 24px;
`;

const Header = styled.header`
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
`;

const BrandIcon = styled.div`
  width: 40px; height: 40px; border-radius: 10px;
  display: grid; place-items: center;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.primaryText};
  font-size: 20px;
`;

const Title = styled.h1`
  margin: 0; font-size: 18px; font-weight: 700; line-height: 1.2;
`;
const Subtitle = styled.p`
  margin: 2px 0 0; color: ${({ theme }) => theme.colors.textMuted}; font-size: 14px;
`;

const Form = styled.form`
  display: grid; gap: 14px; margin-top: 10px;
`;

const FormGroup = styled.div`
  display: grid; gap: 6px;
`;

const Label = styled.label`
  font-weight: 600; font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 10px 12px; outline: none;
  &:focus { box-shadow: 0 0 0 3px rgba(253,78,6,0.18); border-color: ${({ theme }) => theme.colors.primary}; }
`;

const PasswordWrap = styled.div`
  position: relative;
`;
const IconBtn = styled.button`
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  border: none; background: transparent; padding: 6px; cursor: pointer; color: ${({ theme }) => theme.colors.textMuted};
  &:hover { color: ${({ theme }) => theme.colors.text}; }
`;

const Row = styled.div`
  display: flex; align-items: center; gap: 8px;
`;
const Spacer = styled.div`
  margin-left: auto;
`;
const Checkbox = styled.input`
  width: 16px; height: 16px;
`;
const MutedLink = styled.a`
  color: ${({ theme }) => theme.colors.textMuted}; font-size: 14px;
  &:hover { color: ${({ theme }) => theme.colors.text }; text-decoration: underline; }
`;

const ErrorText = styled.span`
  color: #C23616; font-size: 12px;
`;

const ServerError = styled.div`
  background: #FFE8E6; color: #8B1212; border: 1px solid #F5C2C0;
  padding: 10px 12px; border-radius: ${({ theme }) => theme.radius.md}; font-size: 14px;
`;

const SubmitBtn = styled.button<{ $loading?: boolean }>`
  border: none; cursor: pointer; width: 100%;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.primaryText};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 12px 14px; font-weight: 700; letter-spacing: 0.2px;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const Footer = styled.footer`
  margin-top: 14px; text-align: center;
`;
const Small = styled.small`
  color: ${({ theme }) => theme.colors.textMuted};
`;
