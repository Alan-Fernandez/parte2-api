"""Ponto de entrada da aplicação Flask.

Cria a aplicação via Application Factory e executa o servidor de
desenvolvimento com parâmetros personalizáveis via variáveis de ambiente:

- HOST (padrão: 127.0.0.1)
- PORT (padrão: 5000)
- DEBUG (padrão: true)
"""

from __future__ import annotations

import os
from app import create_app


app = create_app()


if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    try:
        port = int(os.getenv("PORT", "5000"))
    except ValueError:
        port = 5000
    debug_env = os.getenv("DEBUG", "true").lower()
    debug = debug_env in {"1", "true", "yes", "on"}

    app.run(host=host, port=port, debug=debug)
