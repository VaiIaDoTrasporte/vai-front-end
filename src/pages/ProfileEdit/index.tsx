import React, { useMemo, useRef, useState, useEffect } from "react";
import styled from "styled-components";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Upload } from "lucide-react";
import { getAuthData, getStoredUser } from "../../services/auth/auth";
import { api } from "../../services/api/api";

const Schema = z.object({
  nome: z.string().min(3, "Informe o nome"),
  celular: z.string().optional(),
  empresa: z.string().optional(),
});

type FormState = {
  nome: string;
  celular: string;
  empresa: string;
  fotoFile?: File | null;
};

const norm = (v?: string | null) => (v ?? "").trim();
const isChanged = (orig?: string | null, curr?: string | null) => norm(orig) !== norm(curr);
const cleanEmpty = <T extends Record<string, any>>(obj: T) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && `${v}`.trim() !== "")) as T;

export default function ProfileEdit() {
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const stored = getStoredUser<any>();
  const slug = stored?.slug as string | undefined;

  // snapshot inicial para comparar mudanças
  const initialRef = useRef({
    nome: stored?.nome || stored?.nomeCompleto || "",
    celular: stored?.celular || "",
    empresa: stored?.empresa || "",
  });

  const [form, setForm] = useState<FormState>({
    nome: initialRef.current.nome,
    celular: initialRef.current.celular,
    empresa: initialRef.current.empresa,
    fotoFile: null,
  });

  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) setServerError("Não foi possível identificar o usuário.");
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [slug, preview]);

  const canSubmit = useMemo(() => !!form.nome && !loading, [form.nome, loading]);

  function onPickFile() { fileRef.current?.click(); }
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setForm((s) => ({ ...s, fotoFile: file }));
    setServerOk(null);
    setServerError(null);
    if (preview) URL.revokeObjectURL(preview);
    if (file) setPreview(URL.createObjectURL(file));
    else setPreview(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setServerOk(null);
    setErrors({});

    const parsed = Schema.safeParse({
      nome: form.nome,
      celular: form.celular || undefined,
      empresa: form.empresa || undefined,
    });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors as any;
      setErrors({ nome: f?.nome?.[0] });
      return;
    }
    if (!slug) { setServerError("Usuário inválido."); return; }

    // monta diff só com campos alterados
    const diff: Record<string, string> = {};
    if (isChanged(initialRef.current.nome, form.nome)) diff.nome = norm(form.nome);
    if (isChanged(initialRef.current.celular, form.celular)) diff.celular = norm(form.celular);
    if (isChanged(initialRef.current.empresa, form.empresa)) diff.empresa = norm(form.empresa);

    const payloadDiff = cleanEmpty(diff);
    const nothingToUpdate = Object.keys(payloadDiff).length === 0 && !form.fotoFile;
    if (nothingToUpdate) { setServerOk("Nada para atualizar."); return; }

    try {
      setLoading(true);

      let data: any;
      if (form.fotoFile) {
        const fd = new FormData();
        for (const [k, v] of Object.entries(payloadDiff)) fd.append(k, v as string);
        fd.append("foto", form.fotoFile);
        data = await api(`/users/${slug}`, { method: "PUT", body: fd, headers: {} });
      } else {
        data = await api(`/users/${slug}`, { method: "PUT", body: JSON.stringify(payloadDiff) });
      }

      const updatedUser = data?.usuario || data || null;

      // Atualiza snapshot e localStorage
      initialRef.current = {
        nome: updatedUser?.nome ?? updatedUser?.nomeCompleto ?? form.nome,
        celular: updatedUser?.celular ?? form.celular,
        empresa: updatedUser?.empresa ?? form.empresa,
      };
      const auth = getAuthData();
      if (auth) {
        const merged = {
          ...auth,
          usuario: {
            ...auth.usuario,
            ...updatedUser,
            nome: initialRef.current.nome,
            celular: initialRef.current.celular,
            empresa: initialRef.current.empresa,
          },
        } as any;
        localStorage.setItem("auth-demo", JSON.stringify(merged));
      }

      setServerOk("Perfil atualizado com sucesso!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Não foi possível salvar";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Viewport>
      <Topbar>
        <BackBtn onClick={() => nav(-1)} aria-label="Voltar">
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </BackBtn>
        <div style={{ marginLeft: "auto" }} />
      </Topbar>

      <Container>
        <Panel>
          <Header>
            <Title>Editar Perfil</Title>
            <Muted>Atualize suas informações pessoais</Muted>
          </Header>

          <Form onSubmit={onSubmit} noValidate>
            <Grid>
              <FormGroup>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
                  aria-invalid={!!errors.nome}
                />
                {errors.nome && <ErrorText>{errors.nome}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="celular">Celular</Label>
                <Input
                  id="celular"
                  value={form.celular}
                  onChange={(e) => setForm((s) => ({ ...s, celular: e.target.value }))}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="empresa">Empresa</Label>
                <Input
                  id="empresa"
                  value={form.empresa}
                  onChange={(e) => setForm((s) => ({ ...s, empresa: e.target.value }))}
                />
              </FormGroup>

              <FormGroup>
                <Label>Foto de perfil</Label>
                <AvatarRow>
                  <Avatar>
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="Pré-visualização" />
                    ) : stored?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={stored.avatarUrl} alt="Foto de perfil" />
                    ) : (
                      <span>
                        {(stored?.nome || stored?.nomeCompleto || stored?.email || "U")
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p: string) => p[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                    )}
                  </Avatar>
                  <div>
                    <Small>PNG ou JPG. Tamanho recomendado 256x256.</Small>
                    <div style={{ marginTop: 8 }}>
                      <Button type="button" onClick={onPickFile}>
                        <Upload size={16} /> Escolher arquivo
                      </Button>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFileChange} />
                  </div>
                </AvatarRow>
              </FormGroup>
            </Grid>

            {serverError && <ServerError role="alert">{serverError}</ServerError>}
            {serverOk && <ServerOk role="status">{serverOk}</ServerOk>}

            <Actions>
              <AltBtn type="button" onClick={() => nav(-1)}>Cancelar</AltBtn>
              <SlantedBtn disabled={!canSubmit} $loading={loading}>
                <button type="submit" disabled={!canSubmit}>
                  {loading ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Loader2 className="spin" size={18} /> Salvando…
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Save size={18} /> Salvar alterações
                    </span>
                  )}
                </button>
              </SlantedBtn>
            </Actions>
          </Form>
        </Panel>
      </Container>
    </Viewport>
  );
}

/* ===================== layout ===================== */
const Viewport = styled.section`
  width: 100vw;
  min-height: 100vh;
  display: grid; grid-template-rows: auto 1fr;
`;

const Topbar = styled.header`
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
`;

const BackBtn = styled.button`
  display: inline-flex; align-items: center; gap: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent; color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 8px 10px; cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.surfaceHover || "#f5f5f5"}; }
`;

const Container = styled.section`
  width: min(820px, 94%);
  margin: 0 auto; padding: 24px 0 36px;
`;

const Panel = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.lg};
  padding: 18px; display: grid; gap: 14px;
`;

const Header = styled.div` display: grid; gap: 4px; `;
const Title = styled.h2` margin: 0; font-size: 18px; `;
const Muted = styled.div` color: ${({ theme }) => theme.colors.textMuted}; font-size: 14px; `;

const Form = styled.form` display: grid; gap: 14px; `;
const Grid = styled.div`
  display: grid; gap: 12px;
  grid-template-columns: 1fr;
  @media (min-width: 760px) { grid-template-columns: 1fr 1fr; }
`;

const FormGroup = styled.div` display: grid; gap: 6px; `;
const Label = styled.label` font-weight: 600; font-size: 14px; `;
const Input = styled.input`
  width: 100%; border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface}; color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radius.md}; padding: 10px 12px; outline: none;
  &:focus { box-shadow: 0 0 0 3px rgba(253,78,6,0.18); border-color: ${({ theme }) => theme.colors.primary}; }
`;

const AvatarRow = styled.div` display: flex; align-items: center; gap: 12px; `;
const Avatar = styled.div`
  width: 68px; height: 68px; border-radius: 50%; overflow: hidden;
  background: ${({ theme }) => theme.colors.assistantBubbleBg}; color: ${({ theme }) => theme.colors.text};
  display: grid; place-items: center; font-weight: 700;
  img { width: 100%; height: 100%; object-fit: cover; }
`;
const Small = styled.small` color: ${({ theme }) => theme.colors.textMuted}; `;

const Button = styled.button`
  display: inline-flex; align-items: center; gap: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent; color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 8px 10px; cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.surfaceHover || "#f5f5f5"}; }
`;

const Actions = styled.div`
  margin-top: 4px; display: flex; gap: 10px; justify-content: flex-end; align-items: center;
`;

const AltBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent; color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radius.md}; padding: 10px 12px; cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.surfaceHover || "#f5f5f5"}; }
`;

const SlantedBtn = styled.div<{ $loading?: boolean; disabled?: boolean }>`
  --skew: -14deg; transform: skewX(var(--skew));
  button {
    transform: skewX(calc(var(--skew) * -1));
    border: none; cursor: pointer;
    background: ${({ theme }) => theme.colors.primary}; color: ${({ theme }) => theme.colors.primaryText};
    border-radius: ${({ theme }) => theme.radius.md}; padding: 12px 14px; font-weight: 800; letter-spacing: 0.3px;
    opacity: ${({ disabled }) => (disabled ? 0.6 : 1)}; pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
  }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const ServerError = styled.div`
  background: #FFE8E6; color: #8B1212; border: 1px solid #F5C2C0;
  padding: 10px 12px; border-radius: ${({ theme }) => theme.radius.md}; font-size: 14px;
`;
const ServerOk = styled.div`
  background: #E8FFEF; color: #0E6B2A; border: 1px solid #BCEBCB;
  padding: 10px 12px; border-radius: ${({ theme }) => theme.radius.md}; font-size: 14px;
`;
