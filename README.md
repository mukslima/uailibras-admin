# UaiLibras Admin

Painel administrativo do UaiLibras em Next.js, usado para autenticacao, usuarios, categorias, tags, midia e workflow editorial de noticias.

## Requisitos

- Node.js compativel com Next.js 15
- Backend `uailibras-backend` acessivel
- PostgreSQL configurado pelo backend
- Cloudinary configurado pelo backend para uploads

## Ambiente

Copie `.env.example` para `.env` e ajuste:

```text
NEXT_PUBLIC_API_URL=http://localhost:3333
```

Em producao, use a URL publica HTTPS do backend informada pelo provedor:

```text
NEXT_PUBLIC_API_URL=https://URL-DO-BACKEND
```

Essa variavel e publica porque o app roda no navegador. Nao coloque secrets no admin.

## Desenvolvimento

```bash
npm install
npm run dev
```

O backend deve permitir a origem do admin em `CORS_ORIGINS` ou `ADMIN_CORS_ORIGINS`.

## Producao

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

Para cookies de refresh em producao, o backend precisa estar em HTTPS e com CORS credentials habilitado para a origem do admin.

## Integracao

O admin consome endpoints em `/api/v1` do backend e envia cookies com `credentials: "include"`. O token de acesso fica somente em memoria no cliente; o refresh token fica em cookie `httpOnly` definido pelo backend.
