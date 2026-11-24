# PrimeTrack — PAP

Repositório com todo o código da PAP: os sites, a aplicação e a base de dados do projeto **PrimeTrack / BussTrack**.

> O relatório, as apresentações e as chaves (API, palavras-passe) **não** ficam aqui — estão no OneDrive.

## Estrutura

```
PrimeTechCorporate/
├── site-empresa/   ← site da empresa PrimeTrack Technologies
├── busstrack/      ← site do produto BussTrack (aplicação de autocarros em tempo real)
├── base-dados/     ← scripts SQL da base de dados (a fazer)
├── index.html      ← página inicial: abre o site da empresa
├── .nojekyll       ← diz ao GitHub Pages para publicar os ficheiros tal como estão
├── .gitignore
└── README.md
```

## Sites publicados (GitHub Pages)

- Empresa: https://sebas00nata.github.io/PrimeTechCorporate/site-empresa/
- BussTrack: https://sebas00nata.github.io/PrimeTechCorporate/busstrack/

Tudo o que for enviado para o ramo `main` fica publicado passado um ou dois minutos.

| Pasta | O que é | Veio do repositório |
|---|---|---|
| `site-empresa/` | Site institucional da PrimeTrack Technologies | `sebas00nata/primetrack-corporate-website` |
| `busstrack/` | Site do BussTrack | `sebas00nata/BussTrack` |
| `base-dados/` | Estrutura e dados de teste da base de dados | — |

O histórico de commits dos dois repositórios antigos foi mantido.

## Como abrir

Os sites são HTML, CSS e JavaScript, por isso não é preciso instalar nada:

1. Abre a pasta do repositório no VS Code.
2. Abre o `index.html` de `site-empresa/` ou de `busstrack/` com a extensão **Live Server**.

## Chaves e palavras-passe

Nunca as ponhas no repositório. Quando o projeto precisar delas, ficam num ficheiro `.env`
(que o `.gitignore` já deixa de fora). Para mostrar que variáveis são precisas, cria um
`.env.example` só com os nomes, sem os valores.

## Equipa

- Sebas
- David
- Zuka
