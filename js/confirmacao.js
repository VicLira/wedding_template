const API_URL = "https://script.google.com/macros/s/AKfycbwYaA6uNb3OzUEJZRW04aFPJv6zFRz3qL6Wo8iqaYOArM3NhrORghLUKx-3hfnL-enL/exec";
const ADMIN_TOKEN_KEY = "admin_token";

// ==================== AUTOCOMPLETE ====================

let _nomesConvidados = [];

async function carregarNomesConvidados() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ acao: 'listar_nomes' })
        });
        const data = await response.json();
        if (data.ok && data.nomes) {
            _nomesConvidados = data.nomes;
        }
    } catch (e) {
        // Silencioso - autocomplete é um extra
    }
}

function mostrarSugestoes(valor) {
    const lista = document.getElementById('autocomplete-list');
    lista.innerHTML = '';

    if (!valor || valor.length < 2) {
        lista.style.display = 'none';
        return;
    }

    const normalizar = str => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const busca = normalizar(valor);

    const matches = _nomesConvidados.filter(n => normalizar(n).includes(busca)).slice(0, 5);

    if (matches.length === 0) {
        lista.style.display = 'none';
        return;
    }

    matches.forEach(nome => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = nome;
        item.onclick = () => {
            document.getElementById('busca-nome').value = nome;
            lista.style.display = 'none';
        };
        lista.appendChild(item);
    });

    lista.style.display = 'block';
}

// Fechar autocomplete ao clicar fora
document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete-wrapper')) {
        const lista = document.getElementById('autocomplete-list');
        if (lista) lista.style.display = 'none';
    }
});

// ==================== BUSCA DE CONVIDADO ====================

async function buscarConvidado() {
    const nome = document.getElementById('busca-nome').value.trim();
    const erroEl = document.getElementById('busca-erro');
    const btnBuscar = document.getElementById('btn-buscar');

    if (!nome) {
        erroEl.textContent = 'Digite seu nome completo.';
        erroEl.style.display = '';
        return;
    }

    btnBuscar.classList.add('is-loading');
    erroEl.style.display = 'none';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ acao: 'buscar_convidado', nome })
        });

        const data = await response.json();

        if (data.ok && data.convidado) {
            const c = data.convidado;

            // Já confirmou?
            if (c.status === 'confirmado' || c.status === 'recusado') {
                document.getElementById('step-busca').style.display = 'none';
                document.getElementById('step-ja-confirmou').style.display = '';
                return;
            }

            // Mostrar formulário
            document.getElementById('form-id').value = c.id;
            document.getElementById('form-nome-display').textContent = c.nome;
            document.getElementById('step-busca').style.display = 'none';
            document.getElementById('step-formulario').style.display = '';
        } else {
            erroEl.textContent = data.erro || 'Nome não encontrado na lista de convidados. Verifique a ortografia ou fale com os noivos.';
            erroEl.style.display = '';
        }
    } catch (error) {
        erroEl.textContent = 'Erro de conexão. Tente novamente.';
        erroEl.style.display = '';
    } finally {
        btnBuscar.classList.remove('is-loading');
    }
}

// ==================== CONFIRMAR PRESENÇA ====================

async function confirmarPresenca() {
    const id = document.getElementById('form-id').value;
    const telefone = document.getElementById('form-telefone').value.trim();
    const restricoes = document.getElementById('form-restricoes').value.trim();
    const presenca = document.getElementById('form-presenca').value;
    const recado = document.getElementById('form-recado').value.trim();
    const erroEl = document.getElementById('form-erro');
    const btnConfirmar = document.getElementById('btn-confirmar');

    if (!telefone) {
        erroEl.textContent = 'Preencha seu telefone.';
        erroEl.style.display = '';
        return;
    }

    btnConfirmar.classList.add('is-loading');
    erroEl.style.display = 'none';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                acao: 'confirmar_presenca',
                id,
                telefone,
                restricoes,
                presenca,
                recado
            })
        });

        const data = await response.json();

        if (data.ok) {
            document.getElementById('step-formulario').style.display = 'none';
            if (presenca === 'sim') {
                document.getElementById('step-sucesso').style.display = '';
            } else {
                document.getElementById('step-sucesso').querySelector('.confirmacao-sucesso-titulo').textContent = 'Resposta registrada';
                document.getElementById('step-sucesso').querySelector('.confirmacao-sucesso-texto').textContent = 'Sentiremos sua falta! Obrigado por avisar.';
                document.getElementById('step-sucesso').style.display = '';
            }
        } else {
            erroEl.textContent = data.erro || 'Erro ao confirmar. Tente novamente.';
            erroEl.style.display = '';
        }
    } catch (error) {
        erroEl.textContent = 'Erro de conexão. Tente novamente.';
        erroEl.style.display = '';
    } finally {
        btnConfirmar.classList.remove('is-loading');
    }
}

// ==================== LOGIN (ADMIN) ====================

function abrirModalLogin() {
    if (sessionStorage.getItem(ADMIN_TOKEN_KEY)) {
        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        atualizarBotoesLogin();
        document.getElementById('admin-confirmacoes').style.display = 'none';
        document.getElementById('step-busca').style.display = '';
        carregarNomesConvidados();
        return;
    }
    document.getElementById('modal-login').classList.add('is-active');
    document.getElementById('login-usuario').focus();
}

function fecharModalLogin() {
    document.getElementById('modal-login').classList.remove('is-active');
    document.getElementById('login-usuario').value = '';
    document.getElementById('login-senha').value = '';
    document.getElementById('login-erro').style.display = 'none';
}

async function fazerLogin() {
    const login = document.getElementById('login-usuario').value.trim();
    const senha = document.getElementById('login-senha').value;
    const erroEl = document.getElementById('login-erro');
    const btnEntrar = document.getElementById('btn-entrar');

    if (!login || !senha) {
        erroEl.textContent = 'Preencha todos os campos.';
        erroEl.style.display = '';
        return;
    }

    btnEntrar.classList.add('is-loading');
    erroEl.style.display = 'none';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ acao: 'login', login, senha })
        });

        const data = await response.json();

        if (data.ok && data.token) {
            sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
            fecharModalLogin();
            atualizarBotoesLogin();
            carregarPainelAdmin();
        } else {
            erroEl.textContent = data.erro || 'Login ou senha inválidos.';
            erroEl.style.display = '';
        }
    } catch (error) {
        erroEl.textContent = 'Erro de conexão. Tente novamente.';
        erroEl.style.display = '';
    } finally {
        btnEntrar.classList.remove('is-loading');
    }
}

function atualizarBotoesLogin() {
    const logado = !!sessionStorage.getItem(ADMIN_TOKEN_KEY);
    const texto = logado ? 'Logout' : 'Log in';
    const btnMobile = document.getElementById('btn-login-mobile');
    const btnDesktop = document.getElementById('btn-login-desktop');
    if (btnMobile) btnMobile.textContent = texto;
    if (btnDesktop) btnDesktop.textContent = texto;
}

// ==================== PAINEL ADMIN ====================

let _convidadosCache = [];
let _filtroAtual = 'todos';

async function carregarPainelAdmin() {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    // Esconder a busca do convidado (admin não precisa)
    document.getElementById('step-busca').style.display = 'none';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ acao: 'listar_convidados', token })
        });

        const data = await response.json();

        if (data.ok && data.convidados) {
            _convidadosCache = data.convidados;
            document.getElementById('admin-confirmacoes').style.display = '';
            atualizarContadores();
            renderizarTabela();
        } else if (data.erro) {
            alert(data.erro);
        }
    } catch (error) {
        console.error('Erro ao carregar painel:', error);
    }
}

function atualizarContadores() {
    const confirmados = _convidadosCache.filter(c => c.status === 'confirmado').length;
    const pendentes = _convidadosCache.filter(c => c.status === 'pendente').length;
    const recusados = _convidadosCache.filter(c => c.status === 'recusado').length;

    document.getElementById('count-confirmados').textContent = confirmados;
    document.getElementById('count-pendentes').textContent = pendentes;
    document.getElementById('count-recusados').textContent = recusados;
}

function filtrarConvidados(filtro) {
    _filtroAtual = filtro;
    renderizarTabela();
}

function renderizarTabela() {
    const tbody = document.getElementById('tbody-convidados');
    let lista = _convidadosCache;

    if (_filtroAtual !== 'todos') {
        lista = lista.filter(c => c.status === _filtroAtual);
    }

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="has-text-centered">Nenhum convidado encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(c => {
        const statusOptions = `
            <select class="select-inline" data-id="${c.id}" data-campo="status" onchange="editarCampoConvidado(this)">
                <option value="pendente" ${c.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                <option value="confirmado" ${c.status === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                <option value="recusado" ${c.status === 'recusado' ? 'selected' : ''}>Não vai</option>
            </select>`;

        return `
            <tr>
                <td class="planilha-cell planilha-cell-id">${c.id}</td>
                <td class="planilha-cell"><input class="input-inline" value="${c.nome || ''}" data-id="${c.id}" data-campo="nome" onchange="editarCampoConvidado(this)"></td>
                <td class="planilha-cell"><input class="input-inline" value="${c.telefone || ''}" data-id="${c.id}" data-campo="telefone" onchange="editarCampoConvidado(this)"></td>
                <td class="planilha-cell"><input class="input-inline" value="${c.restricoes || ''}" data-id="${c.id}" data-campo="restricoes" onchange="editarCampoConvidado(this)" list="dl-restricoes-${c.id}"><datalist id="dl-restricoes-${c.id}"><option value="Vegetariano"><option value="Vegano"><option value="Sem glúten"><option value="Sem lactose"><option value="Alergia a frutos do mar"><option value="Nenhuma"></datalist></td>
                <td class="planilha-cell">${c.presenca === 'sim' ? 'Sim' : c.presenca === 'nao' ? 'Não' : '-'}</td>
                <td class="planilha-cell"><input class="input-inline" value="${c.recado || ''}" data-id="${c.id}" data-campo="recado" onchange="editarCampoConvidado(this)"></td>
                <td class="planilha-cell">${statusOptions}</td>
                <td class="planilha-cell">${c.data || ''}</td>
                <td class="planilha-cell planilha-cell-acoes">
                    <button class="button is-small is-danger is-light" onclick="removerConvidado('${c.id}')" title="Remover">✕</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ==================== EDITAR CAMPO INLINE ====================

async function editarCampoConvidado(el) {
    const id = el.dataset.id;
    const campo = el.dataset.campo;
    const valor = el.value;
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    el.classList.add('input-saving');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ acao: 'editar_convidado', token, id, campo, valor })
        });

        const data = await response.json();

        if (data.ok) {
            el.classList.remove('input-saving');
            el.classList.add('input-saved');
            setTimeout(() => el.classList.remove('input-saved'), 1000);
            // Atualizar cache local
            const convidado = _convidadosCache.find(c => String(c.id) === String(id));
            if (convidado) convidado[campo] = valor;
            atualizarContadores();
        } else {
            el.classList.remove('input-saving');
            alert(data.erro || 'Erro ao salvar.');
        }
    } catch (error) {
        el.classList.remove('input-saving');
        alert('Erro de conexão.');
    }
}

// ==================== ADICIONAR CONVIDADO (ADMIN) ====================

async function adicionarConvidado() {
    const input = document.getElementById('admin-novo-convidado');
    const nome = input.value.trim();
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    const btn = document.getElementById('btn-add-convidado');

    if (!nome || !token) return;

    btn.classList.add('is-loading');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ acao: 'adicionar_convidado', token, nome })
        });

        const data = await response.json();

        if (data.ok) {
            input.value = '';
            await carregarPainelAdmin();
        } else {
            alert(data.erro || 'Erro ao adicionar.');
        }
    } catch (error) {
        alert('Erro de conexão.');
    } finally {
        btn.classList.remove('is-loading');
    }
}

// ==================== REMOVER CONVIDADO (ADMIN) ====================

async function removerConvidado(id) {
    if (!confirm('Remover este convidado da lista?')) return;

    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ acao: 'remover_convidado', token, id })
        });

        const data = await response.json();

        if (data.ok) {
            await carregarPainelAdmin();
        } else {
            alert(data.erro || 'Erro ao remover.');
        }
    } catch (error) {
        alert('Erro de conexão.');
    }
}

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', () => {
    atualizarBotoesLogin();

    // Se já logado, carregar painel
    if (sessionStorage.getItem(ADMIN_TOKEN_KEY)) {
        carregarPainelAdmin();
    } else {
        // Carregar nomes para autocomplete (só para convidados)
        carregarNomesConvidados();
    }

    // Enter no campo de busca
    const buscaInput = document.getElementById('busca-nome');
    if (buscaInput) {
        buscaInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') buscarConvidado();
        });
    }

    // Enter no campo senha
    const senhaInput = document.getElementById('login-senha');
    if (senhaInput) {
        senhaInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') fazerLogin();
        });
    }
});
