import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { api } from "../../services/api/api";

// ======= helpers simples (sem libs externas) =======
const onlyDigits = (v: string) => v.replace(/\D/g, "");
const maskPhoneBR = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, (m, a, b, c) => {
    return [a && `(${a}`, a && a.length === 2 ? ")" : "", b && ` ${b}`, c && `-${c}`].join("");
  }).trim();
  return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};
const maskCpfCnpj = (v: string) => {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 11) {
    // CPF: 000.000.000-00
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  }
  // CNPJ: 00.000.000/0000-00
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})/, "$1.$2.$3/$4-$5");
};

// ======= schema de validação =======
const RegisterSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().email("Informe um e-mail válido"),
  phone: z
    .string()
    .min(14, "Informe um celular válido") // ex: (99) 9999-9999
    .max(16, "Informe um celular válido"),
  document: z
    .string()
    .refine((v) => {
      const d = onlyDigits(v);
      return d.length === 11 || d.length === 14;
    }, "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido"),
  company: z.string().min(2, "Informe o nome da empresa"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirme sua senha"),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "As senhas não conferem",
});

type RegisterForm = z.infer<typeof RegisterSchema>;

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    phone: "",
    document: "",
    company: "",
    password: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    const filled = form.name && form.email && form.phone && form.document && form.company && form.password && form.confirmPassword;
    return !!filled && !loading;
  }, [form, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const parsed = RegisterSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors(fieldErrors as Partial<Record<keyof RegisterForm, string>>);
      return;
    }

    try {
        const doc = onlyDigits(form.document);
        console.log("🚀 ~ handleSubmit ~ doc:", doc.length)
      setLoading(true);
     const payload = {
       nome: form.name.trim(),
       email: form.email.trim(),
       celular: onlyDigits(form.phone),   // celular
       senha: form.password,              // senha
       empresa: form.company.trim(),      // empresa
       ...(doc.length === 11 ? { cpf: doc } : { cnpj: doc }), // cpf ou cnpj
     };

      const data = await api("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("🚀 ~ handleSubmit ~ data:", data)

      // se o backend retornar token, usuário, etc., você pode salvar aqui
      localStorage.setItem("auth-demo", JSON.stringify({ token: data.token, ts: Date.now() }));
      // redireciona para home
      nav("/", { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) setServerError(err.message);
      else setServerError("Não foi possível concluir o cadastro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Viewport>
      <Card>
        <Header>
              <img src="/images/logo.png" alt="Vai Logística" style={{ width: 280, height: 200 }} />
        </Header>

        <Form onSubmit={handleSubmit} noValidate>
          <FormGroup>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome completo"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-err" : undefined}
            />
            {errors.name && <ErrorText id="name-err">{errors.name}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="voce@empresa.com"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-err" : undefined}
              autoComplete="email"
            />
            {errors.email && <ErrorText id="email-err">{errors.email}</ErrorText>}
          </FormGroup>

          <Row2>
            <FormGroup style={{ flex: 1 }}>
              <Label htmlFor="phone">Celular</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(99) 99999-9999"
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: maskPhoneBR(e.target.value) }))}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-err" : undefined}
                autoComplete="tel"
              />
              {errors.phone && <ErrorText id="phone-err">{errors.phone}</ErrorText>}
            </FormGroup>

            <FormGroup style={{ flex: 1 }}>
              <Label htmlFor="document">CPF/CNPJ</Label>
              <Input
                id="document"
                type="text"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={form.document}
                onChange={(e) => setForm((s) => ({ ...s, document: maskCpfCnpj(e.target.value) }))}
                aria-invalid={!!errors.document}
                aria-describedby={errors.document ? "doc-err" : undefined}
              />
              {errors.document && <ErrorText id="doc-err">{errors.document}</ErrorText>}
            </FormGroup>
          </Row2>

          <FormGroup>
            <Label htmlFor="company">Empresa</Label>
            <Input
              id="company"
              type="text"
              placeholder="Razão social ou nome fantasia"
              value={form.company}
              onChange={(e) => setForm((s) => ({ ...s, company: e.target.value }))}
              aria-invalid={!!errors.company}
              aria-describedby={errors.company ? "company-err" : undefined}
            />
            {errors.company && <ErrorText id="company-err">{errors.company}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Senha</Label>
            <PasswordWrap>
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "pwd-err" : undefined}
                autoComplete="new-password"
              />
              <IconBtn type="button" aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPwd((v) => !v)}>
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </IconBtn>
            </PasswordWrap>
            {errors.password && <ErrorText id="pwd-err">{errors.password}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="confirmPassword">Repetir senha</Label>
            <PasswordWrap>
              <Input
                id="confirmPassword"
                type={showPwd2 ? "text" : "password"}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "pwd2-err" : undefined}
                autoComplete="new-password"
              />
              <IconBtn type="button" aria-label={showPwd2 ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPwd2((v) => !v)}>
                {showPwd2 ? <EyeOff size={18} /> : <Eye size={18} />}
              </IconBtn>
            </PasswordWrap>
            {errors.confirmPassword && <ErrorText id="pwd2-err">{errors.confirmPassword}</ErrorText>}
          </FormGroup>

          {serverError && <ServerError role="alert">{serverError}</ServerError>}

          <SubmitBtn type="submit" disabled={!canSubmit} $loading={loading}>
            {loading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Loader2 className="spin" size={18} /> Criando conta…
              </span>
            ) : (
              "Criar conta"
            )}
          </SubmitBtn>

          <AltBtn type="button" onClick={() => nav("/login")}>Voltar para o login</AltBtn>
        </Form>

        <Footer>
          <Small>Ao criar a conta, você concorda com os Termos e a Política de Privacidade.</Small>
        </Footer>
      </Card>
    </Viewport>
  );
}

// ===================== styled (mesmo padrão do Login) ===================== //
const Viewport = styled.main`
  min-height: 100dvh;
  display: grid;
  place-items: center;
  /* background: ${({ theme }) => theme.colors.bg}; */
  background: url("/images/bg-truck.png") center/cover no-repeat;
  padding: 24px;
`;
const Card = styled.section`
  width: 100%;
  max-width: 520px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.md};
  padding: 24px;
`;
const Header = styled.header`
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px; justify-content: center;
`;
const Form = styled.form`
  display: grid; gap: 14px; margin-top: 10px;
`;
const Row2 = styled.div`
  display: flex; gap: 12px; flex-wrap: wrap;
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
  &:hover { background: ${({ theme }) => (theme.colors.surfaceHover || "#f5f5f5")}; }
`;
const Footer = styled.footer`
  margin-top: 14px; text-align: center;
`;
const Small = styled.small`
  color: ${({ theme }) => theme.colors.textMuted};
`;
