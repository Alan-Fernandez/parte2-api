"""Ponto de entrada da aplicação Flask.

Cria a aplicação via Application Factory e executa o servidor de
desenvolvimento com parâmetros personalizáveis via variáveis de ambiente:

- HOST (padrão: 127.0.0.1)
- PORT (padrão: 5000)
- DEBUG (padrão: true)
"""

from __future__ import annotations

import os
from app import app


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
