"""Blueprint principal: páginas e API de usuários."""
from flask import Blueprint, current_app, jsonify, render_template, request
import unicodedata
from ..services.random_user_service import RandomUserService

bp = Blueprint("main", __name__)


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    return "".join(ch for ch in s if unicodedata.category(ch) != "Mn").lower()


@bp.route("/")
def index():
    return render_template("index.html")


@bp.route("/navbar")
def navbar_fragment():
    return render_template("navbar.html")


@bp.route("/footer")
def footer_fragment():
    return render_template("footer.html")


@bp.route("/usuarios")
def usuarios():
    return render_template("usuarios.html")


@bp.route("/api/usuarios")
def api_usuarios():
    """Retorna usuários (JSON) com filtros acento-insensíveis e paginação."""
    cfg = current_app.config
    args = request.args

    quantidade = int(args.get("results", cfg.get("DEFAULT_RESULTS", 10)))
    nat = args.get("nat") or cfg.get("DEFAULT_NAT", "br")
    page = int(args.get("page", 1))
    termo = _norm(args.get("q") or "")
    estado = _norm(args.get("estado") or "")
    cidade = _norm(args.get("cidade") or "")

    service = RandomUserService(cfg["RANDOM_USER_API_URL"])
    try:
        usuarios = service.buscar_usuarios(quantidade=quantidade, nacionalidade=nat, page=page, seed=cfg["RANDOM_USER_SEED"])
    except RuntimeError as e:
        current_app.logger.error(f"Erro ao buscar usuários: {e}")
        return jsonify({"error": str(e)}), 500

    def matches(u):
        return (
            (not termo or termo in _norm(u.nome_completo or "") or termo in _norm(u.email or ""))
            and (not estado or estado in _norm(u.estado or ""))
            and (not cidade or cidade in _norm(u.cidade or ""))
        )

    filtrados = [u for u in usuarios if matches(u)]
    usuarios_json = [
        {
            "nome": u.nome_completo,
            "email": u.email,
            "foto": u.foto,
            "cidade": u.cidade,
            "estado": u.estado,
            "pais": u.pais,
            "telefone": u.telefone,
        }
        for u in filtrados
    ]

    return jsonify({
        "total": len(filtrados),
        "page": page,
        "per_page": quantidade,
        "total_pages": cfg.get("PAGINATION_TOTAL_PAGES", 1),
        "usuarios": usuarios_json,
    })
