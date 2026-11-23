"""API REST do Sistema de Biblioteca (Flask).

Expõe os módulos livros.py e usuarios.py via HTTP e serve o frontend da pasta static/.
Execute com:  python api.py  e acesse http://localhost:5000
"""

from dataclasses import asdict

from flask import Flask, jsonify, request

from livros import GerenciadorLivros
from usuarios import GerenciadorUsuarios

app = Flask(__name__, static_folder="static", static_url_path="")

# Mesmos gerenciadores do main.py (dados em memória: somem ao reiniciar o servidor)
livros = GerenciadorLivros()
usuarios = GerenciadorUsuarios()


@app.errorhandler(ValueError)
def erro_validacao(erro):
    """As validações dos módulos lançam ValueError -> vira resposta 400."""
    return jsonify({"erro": str(erro)}), 400


@app.get("/")
def index():
    return app.send_static_file("index.html")


# ---------- LIVROS ----------
@app.get("/api/livros")
def listar_livros():
    tipo = request.args.get("tipo", "")
    termo = request.args.get("termo", "")
    if not termo:
        resultado = livros.listar()
    elif tipo == "titulo":
        resultado = livros.buscar_por_titulo(termo)
    elif tipo == "autor":
        resultado = livros.buscar_por_autor(termo)
    elif tipo == "isbn":
        livro = livros.buscar_por_isbn(termo)
        resultado = [livro] if livro else []
    else:
        raise ValueError("Tipo de busca inválido. Use titulo, autor ou isbn.")
    return jsonify([asdict(l) for l in resultado])


@app.post("/api/livros")
def cadastrar_livro():
    dados = request.get_json(silent=True) or {}
    try:
        ano = int(dados.get("ano", ""))
    except (TypeError, ValueError):
        raise ValueError("O ano deve ser um número inteiro.")
    livro = livros.adicionar(
        str(dados.get("isbn", "")), str(dados.get("titulo", "")), str(dados.get("autor", "")), ano
    )
    return jsonify(asdict(livro)), 201


@app.delete("/api/livros/<isbn>")
def remover_livro(isbn):
    if livros.remover(isbn):
        return "", 204
    return jsonify({"erro": "Livro não encontrado."}), 404


# ---------- USUÁRIOS ----------
@app.get("/api/usuarios")
def listar_usuarios():
    return jsonify([asdict(u) for u in usuarios.listar()])


@app.post("/api/usuarios")
def cadastrar_usuario():
    dados = request.get_json(silent=True) or {}
    usuario = usuarios.cadastrar(
        str(dados.get("nome", "")), str(dados.get("email", "")), str(dados.get("telefone", ""))
    )
    return jsonify(asdict(usuario)), 201


@app.delete("/api/usuarios/<int:id_usuario>")
def remover_usuario(id_usuario):
    if usuarios.remover(id_usuario):
        return "", 204
    return jsonify({"erro": "Usuário não encontrado."}), 404


if __name__ == "__main__":
    app.run(debug=True)
