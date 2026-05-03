const API_URL = "https://script.google.com/macros/s/AKfycbwYaA6uNb3OzUEJZRW04aFPJv6zFRz3qL6Wo8iqaYOArM3NhrORghLUKx-3hfnL-enL/exec";

(async function () {
    const ITEMS_PER_PAGE = 3;
    const grid = document.querySelector('.presentes-grid');
    const paginacao = document.getElementById('paginacao');
    const loading = document.getElementById('presentes-loading');

    if (!grid || !paginacao) return;

    let produtos = [];
    let currentPage = 1;
    let totalPages = 1;

    // Buscar produtos da planilha
    async function fetchProdutos() {
        try {
            const response = await fetch(API_URL, { redirect: 'follow' });
            if (!response.ok) throw new Error('Erro ao buscar produtos');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            grid.innerHTML = '<p class="has-text-centered">Erro ao carregar produtos. Tente novamente mais tarde.</p>';
            return [];
        }
    }

    // Criar HTML de um card
    function createCard(produto) {
        const valorFormatado = parseFloat(produto.valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        return `
            <div class="column is-4">
                <div class="card presentes-card" data-id="${produto.id}">
                    <div class="card-image">
                        <figure class="image is-4by3">
                            <img src="${produto.imagem || 'https://placehold.co/400x300'}" alt="${produto.nome}" />
                        </figure>
                    </div>
                    <div class="card-content">
                        <p class="title is-5">${produto.nome}</p>
                        <p class="subtitle is-6">${produto.descricao}</p>
                        <p class="presentes-preco">${valorFormatado}</p>
                        <a href="presente.html?id=${produto.id}" class="button is-primary is-fullwidth mt-3">Presentear</a>
                    </div>
                </div>
            </div>
        `;
    }

    // Renderizar página atual
    function renderPage(page) {
        currentPage = page;
        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageItems = produtos.slice(start, end);

        grid.innerHTML = pageItems.map(createCard).join('');
        renderPagination();

        // Reaplicar botões admin se logado
        if (window.adicionarBotoesAdmin && sessionStorage.getItem('admin_token')) {
            window.adicionarBotoesAdmin();
        }
    }

    // Renderizar paginação
    function renderPagination() {
        if (totalPages <= 1) {
            paginacao.style.display = 'none';
            return;
        }

        paginacao.style.display = '';
        paginacao.innerHTML = '';

        // Botão Anterior
        const prevBtn = document.createElement('a');
        prevBtn.className = 'pagination-previous';
        prevBtn.textContent = 'Anterior';
        if (currentPage === 1) {
            prevBtn.setAttribute('disabled', '');
        } else {
            prevBtn.addEventListener('click', (e) => { e.preventDefault(); renderPage(currentPage - 1); });
        }
        paginacao.appendChild(prevBtn);

        // Botão Próxima
        const nextBtn = document.createElement('a');
        nextBtn.className = 'pagination-next';
        nextBtn.textContent = 'Próxima';
        if (currentPage === totalPages) {
            nextBtn.setAttribute('disabled', '');
        } else {
            nextBtn.addEventListener('click', (e) => { e.preventDefault(); renderPage(currentPage + 1); });
        }
        paginacao.appendChild(nextBtn);

        // Lista de páginas
        const list = document.createElement('ul');
        list.className = 'pagination-list';

        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.className = 'pagination-link';
            link.textContent = i;
            link.setAttribute('aria-label', `Ir para página ${i}`);

            if (i === currentPage) {
                link.classList.add('is-current');
                link.setAttribute('aria-current', 'page');
            } else {
                link.addEventListener('click', (e) => { e.preventDefault(); renderPage(i); });
            }

            li.appendChild(link);
            list.appendChild(li);
        }

        paginacao.appendChild(list);
    }

    // Inicializar
    if (loading) loading.style.display = '';
    produtos = await fetchProdutos();
    if (loading) loading.style.display = 'none';

    totalPages = Math.ceil(produtos.length / ITEMS_PER_PAGE);
    window._produtosCache = produtos;
    renderPage(1);

    // Função global para recarregar (usada pelo admin.js)
    window._recarregarPresentes = async function () {
        if (loading) loading.style.display = '';
        produtos = await fetchProdutos();
        if (loading) loading.style.display = 'none';
        totalPages = Math.ceil(produtos.length / ITEMS_PER_PAGE);
        window._produtosCache = produtos;
        renderPage(1);
    };
})();
