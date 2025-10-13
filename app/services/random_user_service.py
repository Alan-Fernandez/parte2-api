"""
Serviço para consumo da Random User API.

Este módulo fornece uma interface para buscar usuários fictícios
da API randomuser.me, com normalização de dados para uso direto
na camada de apresentação.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
import requests


@dataclass
class Usuario:
    """
    Modelo simplificado de usuário normalizado.

    Campos:
        - nome_completo: concatenação de `first` + `last`.
        - email: endereço de e-mail do usuário.
        - foto: URL da foto (tamanho 'large').
        - cidade/estado/pais: localização (opcional).
        - telefone: número de telefone (opcional).
    """
    nome_completo: str
    email: str
    foto: str
    cidade: Optional[str] = None
    estado: Optional[str] = None
    pais: Optional[str] = None
    telefone: Optional[str] = None


class RandomUserService:
    """Cliente simples para interagir com a Random User API."""

    def __init__(self, base_url: str = "https://randomuser.me/api") -> None:
        """Inicializa o serviço com a URL base da API."""
        self.base_url = base_url.rstrip("/")

    def buscar_usuarios(
        self,
        quantidade: int = 12,
        nacionalidade: str = "br",
        page: Optional[int] = None,
        seed: Optional[str] = None,
    ) -> List[Usuario]:
        """
        Busca usuários fictícios da Random User API.

        Args:
            quantidade: número de resultados desejados.
            nacionalidade: filtro de nacionalidade (ex.: "br").
            page: página da consulta (para paginação determinística).
            seed: semente para resultados reproduzíveis.

        Returns:
            Lista de objetos `Usuario` normalizados.
        
        Raises:
            RuntimeError: se a requisição à API falhar.
        """
        params: Dict[str, Any] = {"results": quantidade, "nat": nacionalidade}
        if page is not None:
            params["page"] = page
        if seed:
            params["seed"] = seed

        try:
            resp = requests.get(self.base_url, params=params, timeout=10)
            resp.raise_for_status()
        except requests.RequestException as exc:
            raise RuntimeError(f"Falha ao consultar a Random User API: {exc}") from exc

        data: Dict[str, Any] = resp.json()
        resultados = data.get("results", []) or []

        usuarios: List[Usuario] = []
        for item in resultados:
            nome = item.get("name", {}) or {}
            first = str(nome.get("first", "")).strip()
            last = str(nome.get("last", "")).strip()
            nome_completo = f"{first} {last}".strip()

            picture = item.get("picture") or {}
            foto = str(picture.get("large", ""))

            local = item.get("location") or {}
            cidade = local.get("city")
            estado = local.get("state")
            pais = local.get("country")

            usuarios.append(
                Usuario(
                    nome_completo=nome_completo,
                    email=str(item.get("email", "")),
                    foto=foto,
                    cidade=str(cidade) if cidade is not None else None,
                    estado=str(estado) if estado is not None else None,
                    pais=str(pais) if pais is not None else None,
                    telefone=str(item.get("phone")) if item.get("phone") is not None else None,
                )
            )

        return usuarios
