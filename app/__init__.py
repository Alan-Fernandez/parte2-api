"""Application Factory: cria e configura a aplicação Flask de forma simples."""

from flask import Flask


def create_app() -> Flask:
    app = Flask(__name__, static_folder="static", template_folder="templates")

    app.config.setdefault("RANDOM_USER_API_URL", "https://randomuser.me/api")
    app.config.setdefault("DEFAULT_RESULTS", 10)
    app.config.setdefault("DEFAULT_NAT", "br")
    app.config.setdefault("RANDOM_USER_SEED", "ipm-demo")
    app.config.setdefault("PAGINATION_TOTAL_PAGES", 42)

    # Blueprints
    from .blueprints.main import bp as main_bp
    app.register_blueprint(main_bp)

    return app
