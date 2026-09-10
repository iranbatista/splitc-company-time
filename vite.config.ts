import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // loadEnv roda no processo Node do Vite. Prefixo '' = carrega todas as chaves,
  // inclusive as sem VITE_. Nada daqui vaza para o bundle a menos que eu injete
  // explicitamente em `define`.
  const env = loadEnv(mode, process.cwd(), '')
  const ler = (chave: string) => process.env[chave] ?? env[chave] ?? ''

  const notionToken = ler('NOTION_TOKEN')
  const dataSourceId = ler('NOTION_DATA_SOURCE_ID')

  // Em dev fica vazio e o app usa o caminho relativo do proxy do Vite.
  // No build do GitHub Pages, o workflow passa a URL do Worker.
  const apiBase = ler('API_BASE') || '/notion/v1'

  // Sem isso o erro é mudo: uma base sem scheme vira caminho relativo no axios,
  // o POST bate no próprio host estático e volta 405.
  if (!apiBase.startsWith('/') && !/^https?:\/\//.test(apiBase)) {
    throw new Error(
      `API_BASE precisa ser uma URL absoluta terminando em /v1 (recebido: "${apiBase}").`,
    )
  }
  if (!apiBase.endsWith('/v1')) {
    throw new Error(
      `API_BASE precisa terminar em /v1 (recebido: "${apiBase}").`,
    )
  }

  // GitHub Pages serve em /nome-do-repo/. O workflow passa BASE_PATH.
  const basePath = ler('BASE_PATH') || '/'

  if (!notionToken && apiBase.startsWith('/')) {
    console.warn(
      '\n[notion] NOTION_TOKEN não definido. Copie .env.example para .env e preencha.\n',
    )
  }
  if (!dataSourceId) {
    console.warn(
      '\n[notion] NOTION_DATA_SOURCE_ID não definido. Copie .env.example para .env e preencha.\n',
    )
  }

  return {
    base: basePath,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    define: {
      // Nenhum dos dois é segredo. O token nunca entra aqui.
      __NOTION_DATA_SOURCE_ID__: JSON.stringify(dataSourceId),
      __API_BASE__: JSON.stringify(apiBase),
    },
    server: {
      proxy: {
        '/notion': {
          target: 'https://api.notion.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/notion/, ''),
          // O Authorization é injetado aqui, no servidor de dev. O browser
          // manda a request para a própria origem (/notion/...) e nunca vê o token.
          // Em produção esse papel é do Worker em worker/src/index.ts.
          headers: {
            Authorization: `Bearer ${notionToken}`,
          },
        },
      },
    },
  }
})
