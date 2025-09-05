import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { api } from "../../services/api/api";

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
      setErrors(parsed.error.flatten().fieldErrors as Partial<Record<keyof LoginForm, string>>);
      return;
    }

    try {
      setLoading(true);
      const data = await api("/login", {
        method: "POST",
        body: JSON.stringify({ email: form.email, senha: form.password }),
      });

      if (form.remember && data.token) {
        // Persist token and full user info returned by the API
        localStorage.setItem(
          "auth-demo",
          JSON.stringify({
            token: data.token,
            usuario: data.usuario
              ? { ...data.usuario, nome: data.usuario.nome ?? data.usuario.nomeCompleto ?? data.usuario.name }
              : null,
            ts: Date.now(),
          })
        );
      }
      nav("/", { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) setServerError(err.message);
      else setServerError("Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
      <Stage>
        <LeftSide>
          <TruckArt aria-hidden>
           
          </TruckArt>
        </LeftSide>

        <RightSide>
          <DiagonalBg aria-hidden />
          <Panel>
            <LogoLine>
              <img src="/images/logo.png" alt="Vai Logística" style={{ width: 280, height: 200 }} />
            </LogoLine>

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

              <SlantedBtn disabled={!canSubmit} $loading={loading}>
                <button type="submit" disabled={!canSubmit}>
                  {loading ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Loader2 className="spin" size={18} /> Entrando…
                    </span>
                  ) : ("Entrar")}
                </button>
              </SlantedBtn>

              <AltBtn type="button" onClick={() => nav("/register")}>
                Criar nova conta
              </AltBtn>
            </Form>

            <Footer>
              <Small>Ao entrar, você concorda com os Termos e a Política de Privacidade.</Small>
            </Footer>
          </Panel>
        </RightSide>
      </Stage>
  );
}

/* ===================== layout ===================== */
const Stage = styled.section`
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  position: relative;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow.lg || theme.shadow.md};

  background: url("/images/bg-truck.png") center/cover no-repeat;

  @media (max-width: 940px) {
    grid-template-columns: 1fr;
    height: auto;
    background-position: top; /* melhora responsividade */
  }
`;


const LeftSide = styled.div`
  position: relative;
  /* background: ${({ theme }) => theme.colors.surface}; */
  display: grid;
  place-items: center;
  padding: 32px;
`;

const RightSide = styled.div`
  position: relative;
  isolation: isolate;
  display: grid;
  place-items: center;
  padding: 24px;
  background: transparent;
`;

const DiagonalBg = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;

  /* faixa diagonal laranja */
  &::before {
    content: "";
    position: absolute;
    inset: -20% 35% -20% -5%;
    background: ${({ theme }) => theme.colors.primary};
    opacity: 0.48;
    transform: rotate(18deg); /* inverti o sinal */
    border-radius: 24px;
  }
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    /* background: ${({ theme }) => theme.colors.surface}; */
    clip-path: polygon(0 0, 84% 0, 100% 100%, 0 100%);
    z-index: -1;
  }
`;
const Panel = styled.div`
  position: relative;
  z-index: 1;
  width: min(440px, 92%);
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.md};
  padding: 22px;
`;

const LogoLine = styled.header`
  display: flex; align-items: center; gap: 12px; margin-bottom: 14px; justify-content: center;
`;

/* ===================== form (reuso do teu estilo) ===================== */
const Form = styled.form`
  display: grid; gap: 14px; margin-top: 6px;
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
const PasswordWrap = styled.div` position: relative; `;
const IconBtn = styled.button`
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  border: none; background: transparent; padding: 6px; cursor: pointer;
  color: ${({ theme }) => theme.colors.textMuted};
  &:hover { color: ${({ theme }) => theme.colors.text}; }
`;
const Row = styled.div` display: flex; align-items: center; gap: 8px; `;
const Spacer = styled.div` margin-left: auto; `;
const Checkbox = styled.input` width: 16px; height: 16px; `;
const MutedLink = styled.a`
  color: ${({ theme }) => theme.colors.textMuted}; font-size: 14px;
  &:hover { color: ${({ theme }) => theme.colors.text }; text-decoration: underline; }
`;
const ErrorText = styled.span` color: #C23616; font-size: 12px; `;
const ServerError = styled.div`
  background: #FFE8E6; color: #8B1212; border: 1px solid #F5C2C0;
  padding: 10px 12px; border-radius: ${({ theme }) => theme.radius.md}; font-size: 14px;
`;

/* botão “faixa” inclinado */
const SlantedBtn = styled.div<{ $loading?: boolean; disabled?: boolean }>`
  --skew: -14deg;
  width: 100%;
  transform: skewX(var(--skew));
  button {
    transform: skewX(calc(var(--skew) * -1));
    width: 100%;
    border: none;
    cursor: pointer;
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primaryText};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 12px 14px; font-weight: 800; letter-spacing: 0.3px;
    opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
    pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
  }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const AltBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  width: 100%;
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 12px 14px;
  font-weight: 600;
  margin-top: 8px;
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.surfaceHover || "#f5f5f5"}; }
`;

const Footer = styled.footer` margin-top: 12px; text-align: center; `;
const Small = styled.small` color: ${({ theme }) => theme.colors.textMuted}; `;

/* ===================== truck placeholder ===================== */
const TruckArt = styled.div`
  width: min(520px, 90%); height: min(360px, 60%);
  position: relative; display: grid; place-items: center;
`;
