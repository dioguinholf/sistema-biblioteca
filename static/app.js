// Comunicação com o backend: todas as chamadas passam por esta função.
const API = "/api";

async function requisitar(caminho, opcoes = {}) {
  const resposta = await fetch(API + caminho, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
  });
  if (resposta.status === 204) return null; // DELETE sem corpo
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Erro inesperado.");
  return dados;
}

function mostrarMensagem(texto, tipo = "sucesso") {
  const el = document.getElementById("mensagem");
  el.textContent = texto;
  el.className = `mensagem ${tipo}`;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.add("oculto"), 3500);
}

// Evita injeção de HTML ao montar as tabelas
const esc = (v) => String(v).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const formatarTelefone = (t) =>
  t.length === 11 ? `(${t.slice(0, 2)}) ${t.slice(2, 7)}-${t.slice(7)}`
                  : `(${t.slice(0, 2)}) ${t.slice(2, 6)}-${t.slice(6)}`;

// ---------- LIVROS ----------
async function carregarLivros(tipo = "", termo = "") {
  const query = termo ? `?tipo=${tipo}&termo=${encodeURIComponent(termo)}` : "";
  try {
    const livros = await requisitar(`/livros${query}`);
    const tbody = document.getElementById("tabela-livros");
    tbody.innerHTML = livros.length
      ? livros.map((l) => `
          <tr>
            <td class="mono">${esc(l.isbn)}</td><td>${esc(l.titulo)}</td>
            <td>${esc(l.autor)}</td><td>${l.ano}</td>
            <td><button class="remover" data-isbn="${esc(l.isbn)}">Remover</button></td>
          </tr>`).join("")
      : `<tr><td colspan="5" class="vazio">Nenhum livro encontrado.</td></tr>`;
  } catch (e) {
    mostrarMensagem(e.message, "erro");
  }
}

document.getElementById("form-livro").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const form = ev.target;
  const dados = Object.fromEntries(new FormData(form));
  try {
    const livro = await requisitar("/livros", { method: "POST", body: JSON.stringify(dados) });
    mostrarMensagem(`Livro "${livro.titulo}" cadastrado!`);
    form.reset();
    carregarLivros();
  } catch (e) {
    mostrarMensagem(e.message, "erro");
  }
});

document.getElementById("form-busca").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const { tipo, termo } = Object.fromEntries(new FormData(ev.target));
  carregarLivros(tipo, termo.trim());
});

document.getElementById("tabela-livros").addEventListener("click", async (ev) => {
  const isbn = ev.target.dataset.isbn;
  if (!isbn || !confirm(`Remover o livro ${isbn}?`)) return;
  try {
    await requisitar(`/livros/${encodeURIComponent(isbn)}`, { method: "DELETE" });
    mostrarMensagem("Livro removido.");
    carregarLivros();
  } catch (e) {
    mostrarMensagem(e.message, "erro");
  }
});

// ---------- USUÁRIOS ----------
async function carregarUsuarios() {
  try {
    const usuarios = await requisitar("/usuarios");
    const tbody = document.getElementById("tabela-usuarios");
    tbody.innerHTML = usuarios.length
      ? usuarios.map((u) => `
          <tr>
            <td class="mono">#${u.id}</td><td>${esc(u.nome)}</td><td>${esc(u.email)}</td>
            <td class="mono">${formatarTelefone(u.telefone)}</td>
            <td><button class="remover" data-id="${u.id}">Remover</button></td>
          </tr>`).join("")
      : `<tr><td colspan="5" class="vazio">Nenhum usuário cadastrado.</td></tr>`;
  } catch (e) {
    mostrarMensagem(e.message, "erro");
  }
}

document.getElementById("form-usuario").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const form = ev.target;
  const dados = Object.fromEntries(new FormData(form));
  try {
    const usuario = await requisitar("/usuarios", { method: "POST", body: JSON.stringify(dados) });
    mostrarMensagem(`Usuário ${usuario.nome} cadastrado (ID ${usuario.id})!`);
    form.reset();
    carregarUsuarios();
  } catch (e) {
    mostrarMensagem(e.message, "erro");
  }
});

document.getElementById("tabela-usuarios").addEventListener("click", async (ev) => {
  const id = ev.target.dataset.id;
  if (!id || !confirm(`Remover o usuário #${id}?`)) return;
  try {
    await requisitar(`/usuarios/${id}`, { method: "DELETE" });
    mostrarMensagem("Usuário removido.");
    carregarUsuarios();
  } catch (e) {
    mostrarMensagem(e.message, "erro");
  }
});

// ---------- ABAS ----------
document.querySelectorAll(".aba").forEach((botao) => {
  botao.addEventListener("click", () => {
    document.querySelectorAll(".aba").forEach((b) => b.classList.remove("ativa"));
    document.querySelectorAll(".painel").forEach((p) => p.classList.add("oculto"));
    botao.classList.add("ativa");
    document.getElementById(botao.dataset.aba).classList.remove("oculto");
  });
});

carregarLivros();
carregarUsuarios();
