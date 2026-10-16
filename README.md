# El Rocha: Sem Pedir Licença · site do projeto

Site estático do documentário "El Rocha: Sem Pedir Licença" (Impulso Filmes). HTML, CSS e JavaScript puros: sem frameworks e sem build.

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `index.html` | Página principal: 15 seções, do hero com o vídeo "Encarte" até o rodapé |
| `personagens.html` | Biografias de Fernando Sanches e Daniel Ganjaman (com tabelas), além de Maurício e Claudio Takara |
| `pesquisa.html` | O Book de pesquisa inteiro, com índice lateral fixo e referências ABNT no fim |
| `el-rocha-book-pesquisa.pdf` | O Book em PDF, impresso a partir de `pesquisa.html` |
| `discografia.json` | Os 262 discos (`ano, artista, titulo, etapa, quem, fonte`), lidos pela tabela da home |
| `style.css`, `pages.css`, `case.css`, `extra.css`, `pages.js` | Copiados sem alteração do mockup da Impulso ([impulso-site-mockup](https://github.com/danielimpulso/impulso-site-mockup), commit `356cd2a`) |
| `site.css`, `site.js` | Ajustes e componentes deste site: linha do tempo, discografia, capas, vozes, legendas e Book |
| `img/`, `img/capas/` | Fotos, thumbnails e as 50 capas (máx. 600 px), nomeadas por artista-título |
| `.nojekyll` | Faz o GitHub Pages servir os arquivos como estão |

## Publicar no GitHub Pages

1. Crie no GitHub um repositório chamado `el-rocha-site` (público, ou privado se o plano permitir Pages privado).
2. Envie esta pasta para a branch `main`:
   ```bash
   cd el-rocha-site
   git init -b main
   git add .
   git commit -m "Site El Rocha: Sem Pedir Licença"
   git remote add origin https://github.com/danielimpulso/el-rocha-site.git
   git push -u origin main
   ```
3. No repositório, vá em **Settings → Pages**. Em *Build and deployment*, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)**, e clique em **Save**.
4. Em um ou dois minutos o site fica em `https://danielimpulso.github.io/el-rocha-site/`.

## Ver localmente

A discografia é carregada com `fetch`, que não funciona abrindo o arquivo direto (`file://`). Use um servidor:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000`.

## Antes de divulgar

- **Fotos de imprensa**: o brief pede autorização dos fotógrafos e veículos antes de publicar. Enquanto não houver autorização, abra `site.js` e troque `MOSTRAR_FOTOS_DE_IMPRENSA = true` para `false`: toda foto marcada com `data-imprensa` vira um placeholder cinza, e a legenda com o crédito continua.
- **Indexação**: as páginas têm `<meta name="robots" content="noindex, nofollow">`, como o mockup. Retire essa linha quando o site puder aparecer no Google.
- **Ficha técnica**: Direção, Fotografia e Montagem estão como "a confirmar" em `index.html` (seção `#ficha`).
- **PDF do Book**: se o Book mudar, abra `pesquisa.html` no Chrome, use Imprimir → Salvar como PDF (o CSS de impressão já deixa a página clara) e substitua `el-rocha-book-pesquisa.pdf`.
