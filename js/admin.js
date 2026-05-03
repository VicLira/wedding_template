// ==================== ADMIN - Login e CRUD ====================

const ADMIN_TOKEN_KEY = "admin_token";

// ==================== LOGIN ====================

function abrirModalLogin() {
    // Se já logado, fazer logout
    if (sessionStorage.getItem(ADMIN_TOKEN_KEY)) {
        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        atualizarBotoesLogin();
        esconderAdminControls();
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
            mostrarAdminControls();
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

// ==================== UI ADMIN ====================

function atualizarBotoesLogin() {
    const logado = !!sessionStorage.getItem(ADMIN_TOKEN_KEY);
    const btnsMobile = document.getElementById('btn-login-mobile');
    const btnsDesktop = document.getElementById('btn-login-desktop');

    const texto = logado ? 'Logout' : 'Log in';
    if (btnsMobile) btnsMobile.textContent = texto;
    if (btnsDesktop) btnsDesktop.textContent = texto;
}

function mostrarAdminControls() {
    // Adicionar botão "Adicionar Presente" acima do grid
    if (!document.getElementById('btn-adicionar-presente')) {
        const container = document.querySelector('.presentes-section .container');
        const grid = document.querySelector('.presentes-grid');
        const btn = document.createElement('div');
        btn.id = 'btn-adicionar-presente';
        btn.className = 'has-text-centered mb-4';
        btn.innerHTML = '<button class="button is-success" onclick="abrirModalAdmin()">+ Adicionar Presente</button>';
        container.insertBefore(btn, grid);
    }

    // Adicionar botões editar/remover nos cards existentes
    adicionarBotoesAdmin();
}

function esconderAdminControls() {
    const btn = document.getElementById('btn-adicionar-presente');
    if (btn) btn.remove();

    // Remover botões admin dos cards
    document.querySelectorAll('.admin-actions').forEach(el => el.remove());
}

function adicionarBotoesAdmin() {
    document.querySelectorAll('.presentes-card').forEach(card => {
        if (card.querySelector('.admin-actions')) return;

        const id = card.dataset.id;
        const adminDiv = document.createElement('div');
        adminDiv.className = 'admin-actions mt-2';
        adminDiv.innerHTML = `
            <button class="button is-small is-warning" onclick="editarPresente('${id}')">Editar</button>
            <button class="button is-small is-danger" onclick="removerPresente('${id}')">Remover</button>
        `;
        card.querySelector('.card-content').appendChild(adminDiv);
    });
}
window.adicionarBotoesAdmin = adicionarBotoesAdmin;

// ==================== MODAL ADMIN (Adicionar/Editar) ====================

// Variável para guardar o arquivo selecionado
let _arquivoSelecionado = null;

function previewImagem(input) {
    const file = input.files[0];
    const preview = document.getElementById('admin-imagem-preview');
    const previewImg = document.getElementById('admin-imagem-preview-img');
    const nomeEl = document.getElementById('admin-imagem-nome');

    if (file) {
        _arquivoSelecionado = file;
        nomeEl.textContent = file.name;

        const reader = new FileReader();
        reader.onload = function (e) {
            previewImg.src = e.target.result;
            preview.style.display = '';
        };
        reader.readAsDataURL(file);
    } else {
        _arquivoSelecionado = null;
        nomeEl.textContent = 'Nenhum arquivo selecionado';
        preview.style.display = 'none';
    }
}

function abrirModalAdmin(produto = null) {
    const modal = document.getElementById('modal-admin');
    const titulo = document.getElementById('modal-admin-titulo');

    document.getElementById('admin-id').value = produto ? produto.id : '';
    document.getElementById('admin-nome').value = produto ? produto.nome : '';
    document.getElementById('admin-descricao').value = produto ? produto.descricao : '';
    document.getElementById('admin-valor').value = produto ? produto.valor : '';
    document.getElementById('admin-pix').value = produto ? (produto.pix || '') : '';
    document.getElementById('admin-erro').style.display = 'none';

    // Reset do campo de imagem
    document.getElementById('admin-imagem').value = '';
    document.getElementById('admin-imagem-nome').textContent = produto && produto.imagem ? 'Imagem atual (selecione para trocar)' : 'Nenhum arquivo selecionado';
    document.getElementById('admin-imagem-preview').style.display = produto && produto.imagem ? '' : 'none';
    document.getElementById('admin-imagem-preview-img').src = produto && produto.imagem ? produto.imagem : '';
    _arquivoSelecionado = null;

    titulo.textContent = produto ? 'Editar Presente' : 'Adicionar Presente';
    modal.classList.add('is-active');
}

function fecharModalAdmin() {
    document.getElementById('modal-admin').classList.remove('is-active');
    _arquivoSelecionado = null;
}

async function salvarPresente() {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    const id = document.getElementById('admin-id').value;
    const nome = document.getElementById('admin-nome').value.trim();
    const descricao = document.getElementById('admin-descricao').value.trim();
    const valor = document.getElementById('admin-valor').value;
    const pix = document.getElementById('admin-pix').value.trim();
    const erroEl = document.getElementById('admin-erro');
    const btnSalvar = document.getElementById('btn-salvar-admin');

    if (!nome || !descricao || !valor) {
        erroEl.textContent = 'Preencha nome, descrição e valor.';
        erroEl.style.display = '';
        return;
    }

    // Validar arquivo se selecionado
    if (_arquivoSelecionado) {
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
        if (!tiposPermitidos.includes(_arquivoSelecionado.type)) {
            erroEl.textContent = 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP.';
            erroEl.style.display = '';
            return;
        }
        if (_arquivoSelecionado.size > 5 * 1024 * 1024) {
            erroEl.textContent = 'Arquivo muito grande. Máximo 5MB.';
            erroEl.style.display = '';
            return;
        }
    }

    btnSalvar.classList.add('is-loading');
    erroEl.style.display = 'none';

    let imagemUrl = '';

    // Se tem arquivo, fazer upload primeiro
    if (_arquivoSelecionado) {
        try {
            const base64 = await fileToBase64(_arquivoSelecionado);
            const uploadRes = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    acao: 'upload',
                    token,
                    arquivo: base64,
                    tipo: _arquivoSelecionado.type,
                    nomeArquivo: _arquivoSelecionado.name
                })
            });
            const uploadData = await uploadRes.json();
            if (uploadData.ok) {
                imagemUrl = uploadData.url;
            } else {
                erroEl.textContent = uploadData.erro || 'Erro ao enviar imagem.';
                erroEl.style.display = '';
                btnSalvar.classList.remove('is-loading');
                return;
            }
        } catch (error) {
            erroEl.textContent = 'Erro ao enviar imagem.';
            erroEl.style.display = '';
            btnSalvar.classList.remove('is-loading');
            return;
        }
    }

    const acao = id ? 'editar' : 'adicionar';
    const payload = { acao, token, id, nome, descricao, valor: parseFloat(valor), pix };
    if (imagemUrl) payload.imagem = imagemUrl;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.ok) {
            fecharModalAdmin();
            await recarregarProdutos();
        } else {
            erroEl.textContent = data.erro || 'Erro ao salvar.';
            erroEl.style.display = '';
        }
    } catch (error) {
        erroEl.textContent = 'Erro de conexão.';
        erroEl.style.display = '';
    } finally {
        btnSalvar.classList.remove('is-loading');
    }
}

// Converter arquivo para base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remover o prefixo "data:image/...;base64,"
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ==================== EDITAR / REMOVER ====================

function editarPresente(id) {
    // Buscar dados do produto atual no array global
    const produto = window._produtosCache.find(p => String(p.id) === String(id));
    if (produto) {
        abrirModalAdmin(produto);
    }
}

async function removerPresente(id) {
    if (!confirm('Tem certeza que deseja remover este presente?')) return;

    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ acao: 'remover', token, id })
        });

        const data = await response.json();

        if (data.ok) {
            await recarregarProdutos();
        } else {
            alert(data.erro || 'Erro ao remover.');
        }
    } catch (error) {
        alert('Erro de conexão.');
    }
}

// ==================== RECARREGAR ====================

async function recarregarProdutos() {
    // Chama a função global de reload definida em presentes.js
    if (typeof window._recarregarPresentes === 'function') {
        await window._recarregarPresentes();
    }

    // Reaplicar botões admin se logado
    if (sessionStorage.getItem(ADMIN_TOKEN_KEY)) {
        setTimeout(adicionarBotoesAdmin, 100);
    }
}

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', () => {
    atualizarBotoesLogin();

    // Se já tem token salvo, mostrar controles admin
    if (sessionStorage.getItem(ADMIN_TOKEN_KEY)) {
        // Esperar o presentes.js carregar os cards
        setTimeout(mostrarAdminControls, 1000);
    }

    // Enter no campo senha faz login
    const senhaInput = document.getElementById('login-senha');
    if (senhaInput) {
        senhaInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') fazerLogin();
        });
    }
});
