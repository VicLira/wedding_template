const API_URL = "https://script.google.com/macros/s/AKfycby5DiU7jltrAmE8kS4iZmQmk22rtbLSdcAWsM5aNLrQm4BixeweDsclzxMRgcxl9UvE/exec";

(async function () {
    const loading = document.getElementById('presente-loading');
    const conteudo = document.getElementById('presente-conteudo');
    const naoEncontrado = document.getElementById('presente-nao-encontrado');

    // Pegar ID da URL
    const params = new URLSearchParams(window.location.search);
    const produtoId = params.get('id');

    if (!produtoId) {
        loading.style.display = 'none';
        naoEncontrado.style.display = '';
        return;
    }

    // Buscar produtos
    let produto = null;
    try {
        const response = await fetch(API_URL, { redirect: 'follow' });
        if (!response.ok) throw new Error('Erro ao buscar');
        const produtos = await response.json();
        produto = produtos.find(p => String(p.id) === String(produtoId));
    } catch (error) {
        console.error('Erro ao carregar presente:', error);
        loading.style.display = 'none';
        naoEncontrado.style.display = '';
        return;
    }

    if (!produto) {
        loading.style.display = 'none';
        naoEncontrado.style.display = '';
        return;
    }

    // Preencher dados
    document.title = `${produto.nome} | Olivia e Rodrigo`;
    document.getElementById('breadcrumb-nome').textContent = produto.nome;
    document.getElementById('presente-nome').textContent = produto.nome;
    document.getElementById('presente-descricao').textContent = produto.descricao;
    document.getElementById('presente-img').src = produto.imagem || 'https://placehold.co/600x600';
    document.getElementById('presente-img').alt = produto.nome;

    // Formatar valor
    const valorFormatado = parseFloat(produto.valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    document.getElementById('presente-valor').textContent = valorFormatado;

    // PIX - usar campo 'pix' do produto ou fallback
    const pixCode = produto.pix || '';
    document.getElementById('presente-pix-link').value = pixCode;

    // Gerar QR Code via API
    if (pixCode) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}&margin=10`;
        document.getElementById('presente-qrcode').src = qrUrl;
    } else {
        document.querySelector('.presente-qrcode-wrapper').style.display = 'none';
        document.getElementById('presente-pix-link').value = 'Chave PIX não configurada';
    }

    // Mostrar conteúdo
    loading.style.display = 'none';
    conteudo.style.display = '';
})();

// Copiar PIX
function copiarPix() {
    const input = document.getElementById('presente-pix-link');
    const aviso = document.getElementById('pix-copiado');

    navigator.clipboard.writeText(input.value).then(() => {
        aviso.style.display = '';
        document.getElementById('btn-copiar-pix').textContent = '✓ Copiado';
        document.getElementById('btn-copiar-pix').classList.add('is-success');

        setTimeout(() => {
            aviso.style.display = 'none';
            document.getElementById('btn-copiar-pix').textContent = 'Copiar';
            document.getElementById('btn-copiar-pix').classList.remove('is-success');
        }, 3000);
    }).catch(() => {
        // Fallback para navegadores antigos
        input.select();
        document.execCommand('copy');
        aviso.style.display = '';
        setTimeout(() => { aviso.style.display = 'none'; }, 3000);
    });
}
