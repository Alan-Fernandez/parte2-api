# Aplicação Flask — Random User API (PT-BR)

Aplicação web em Flask que consome a Random User API para exibir uma lista de usuários fictícios com filtros e paginação. A interface é semântica, responsiva e possui suporte a tema claro/escuro.

## Recursos

- HTML semântico e acessível (skip link, labels, aria-attributes)
- Navbar e rodapé modulares carregados via fetch (HTML + CSS dedicados)
- Lista de usuários com cards (foto, nome, e-mail, localização e telefone)
- Filtros:
	- Busca por nome/e-mail (acentos-insensível)
	- Estado e Cidade (acentos-insensíveis, com autocompletar via datalist)
	- Botão “Limpar” (reset de filtros e datalists)
- Paginação: 10 usuários por página (padrão), numérica com elipses (1 … X … N), Prev/Next
- Tema claro/escuro via CSS Variables, com persistência em localStorage
- Layout responsivo (CSS grid/flex) e foco em acessibilidade

## Estrutura do Projeto

- `run.py`: ponto de entrada da aplicação
- `app/__init__.py`: factory da aplicação Flask e configurações padrão
- `app/blueprints/main.py`: rotas HTML e JSON (inclui filtros e paginação)
- `app/services/random_user_service.py`: consumo da Random User API e normalização dos dados
- `app/templates/*.html`: templates (inclui `base.html`, `index.html`, `usuarios.html`, `navbar.html`, `footer.html`)
- `app/static/css/styles.css`: estilos globais e sistema de temas
- `app/static/css/navbar.css` e `footer.css`: estilos modulares
- `app/static/js/main.js`: alternância de tema
- `app/static/js/navbar.js` e `footer.js`: carregamento dos componentes modulares
- `app/static/js/usuarios.js`: busca, filtros, paginação e renderização

## Requisitos

- Python 3.10+
- Pip

## Como executar (Windows PowerShell)

```powershell
# 1) (Opcional) criar e ativar um ambiente virtual
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2) Instalar dependências
pip install -r requirements.txt

# 3) Executar a aplicação (padrões: HOST=127.0.0.1, PORT=5000, DEBUG=true)
python .\run.py

# (Opcional) Personalizar host/port/debug
$env:HOST = "0.0.0.0"
$env:PORT = "8000"
$env:DEBUG = "false"
python .\run.py
```

Acesse: http://127.0.0.1:5000

## Link do Deploy

A aplicação está disponível no seguinte link: [https://parte2-api.onrender.com/](https://parte2-api.onrender.com/)

## Configurações

As configurações padrão residem em `app/__init__.py` e podem ser alteradas conforme necessidade:

- `RANDOM_USER_API_URL`: URL base da API (padrão: `https://randomuser.me/api`)
- `DEFAULT_RESULTS`: resultados por página (padrão: `10`)
- `DEFAULT_NAT`: filtro de nacionalidade (padrão: `br`)
- `RANDOM_USER_SEED`: semente de aleatoriedade para resultados estáveis (ex.: `ipm-demo`)
- `PAGINATION_TOTAL_PAGES`: total de páginas exibidas na paginação numérica (ex.: `42`)

## Endpoints

- `GET /` — Página inicial
- `GET /usuarios` — Lista de usuários (renderização client-side)
- `GET /api/usuarios` — Dados em JSON (paginação e filtros)

Query params suportados em `/api/usuarios`:

- `results` (int): quantidade por página (padrão: `DEFAULT_RESULTS`)
- `page` (int): página atual (padrão: `1`)
- `nat` (str): nacionalidade (padrão: `DEFAULT_NAT`)
- `q` (str): busca por nome/e-mail (acentos-insensível)
- `estado` (str): filtro por estado (acentos-insensível)
- `cidade` (str): filtro por cidade (acentos-insensível)

Resposta JSON (exemplo simplificado):

```json
{
	"total": 10,
	"page": 1,
	"per_page": 10,
	"total_pages": 42,
	"usuarios": [
		{ "nome": "Maria Silva", "email": "maria@example.com", "foto": "...", "cidade": "São Paulo", "estado": "São Paulo", "pais": "Brazil", "telefone": "+55 ..." }
	]
}
```

## Notas de Acessibilidade

- Foco visível em controles interativos
- Leitura de status com `aria-live` para mensagens de carregamento
- Navegação por teclado respeitando a ordem lógica

## Desenvolvimento e Testes Rápidos

- O código JavaScript usa `fetch` e módulos simples, sem dependências externas
- Para troubleshooting, verifique o console do navegador e os logs do Flask

## Licença

Uso educacional.