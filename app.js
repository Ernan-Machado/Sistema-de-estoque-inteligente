const SUPABASE_URL = 'https://qqdcqkgaumdupopunfic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_D8NXX7IvL17eUxuPTsXVHg_wc5KOlRM';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. CONTROLO DE SESSÃO ATIVO (O "Guarda" do sistema)
_supabase.auth.onAuthStateChange((event, session) => {
    console.log("Evento de Sessão:", event);
    if (!session) {
        // Se não houver sessão, volta para o login
        window.location.href = 'index.html';
    } else {
        // Se houver, carrega os produtos do utilizador logado
        carregarEstoque();
    }
});

// 2. LISTAGEM (Com o ajuste de 35px no Status)
async function carregarEstoque() {
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return;

        const { data: produtos, error } = await _supabase
            .from('products')
            .select('*')
            .eq('usuario_id', user.id)
            .order('nome', { ascending: true });

        if (error) throw error;

        const lista = document.getElementById('lista-produtos');
        if (!lista) return;
        lista.innerHTML = '';

        let totalItens = 0, produtosBaixos = 0, valorTotal = 0;

        produtos.forEach(item => {
            const estoqueAtual = item.estoque_atual || 0;
            const statusCritico = estoqueAtual <= (item.estoque_minimo || 0);
            
            totalItens += estoqueAtual;
            valorTotal += (estoqueAtual * (item.preco || 0));
            if (statusCritico) produtosBaixos++;

            lista.innerHTML += `
                <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                    <td class="p-4">
                        <div class="font-bold text-slate-700 text-sm">${item.nome}</div>
                        <div class="text-[10px] text-slate-400 uppercase">${item.sku}</div>
                    </td>
                    <td class="p-4 text-center font-mono font-bold text-slate-600">${estoqueAtual}</td>
                    
                    <td class="p-4" style="text-align: left; padding-left: 35px;">
                        <span class="px-2 py-0.5 text-[9px] font-bold rounded-full ${statusCritico ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}">
                            ${statusCritico ? 'REPOR' : 'OK'}
                        </span>
                    </td>

                    <td class="p-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <input type="number" id="mov-${item.id}" value="1" class="w-10 p-1 border rounded text-xs text-center">
                            <button onclick="alterarQtd(${item.id}, ${estoqueAtual}, 'in')" class="p-1 text-emerald-600 font-bold">+</button>
                            <button onclick="alterarQtd(${item.id}, ${estoqueAtual}, 'out')" class="p-1 text-red-600 font-bold">-</button>
                            <button onclick="excluirProduto(${item.id}, '${item.nome}')" class="ml-2 text-slate-300 hover:text-red-500">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </td>
                </tr>`
        });

        document.getElementById('card-total-itens').innerText = totalItens;
        document.getElementById('card-estoque-baixo').innerText = produtosBaixos;
        document.getElementById('card-valor-total').innerText = valorTotal.toLocaleString('pt-br',{style:'currency', currency:'BRL'});
    } catch (err) {
        console.error("Erro ao carregar:", err.message);
    }
}

// 3. CADASTRAR PRODUTO
async function cadastrarProduto() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return alert("Sessão expirada. Faça login novamente.");

    const nome = document.getElementById('nome').value;
    const sku = document.getElementById('sku').value;
    const preco = parseFloat(document.getElementById('preco').value) || 0;
    const estoque_minimo = parseInt(document.getElementById('estoque_minimo').value) || 0;

    if (!nome || !sku) return alert("Nome e SKU são obrigatórios!");

    const { error } = await _supabase.from('products').insert([{ 
        nome, sku, preco, estoque_minimo, 
        estoque_atual: 0, 
        usuario_id: user.id 
    }]);

    if (error) alert("Erro ao salvar: " + error.message);
    else {
        alert("Produto guardado!");
        location.reload();
    }
}

// 4. ALTERAR QUANTIDADE
async function alterarQtd(id, atual, tipo) {
    const qtd = parseInt(document.getElementById(`mov-${id}`).value) || 1;
    const novaQtd = tipo === 'in' ? atual + qtd : atual - qtd;
    if (novaQtd < 0) return alert("Estoque insuficiente!");

    const { error } = await _supabase.from('products').update({ estoque_atual: novaQtd }).eq('id', id);
    if (error) alert(error.message);
    else carregarEstoque();
}

// 5. EXCLUIR
async function excluirProduto(id, nome) {
    if (confirm(`Eliminar ${nome}?`)) {
        const { error } = await _supabase.from('products').delete().eq('id', id);
        if (error) alert(error.message);
        else carregarEstoque();
    }
}

// 6. LOGOUT
async function logout() {
    await _supabase.auth.signOut();
    window.location.href = 'index.html';
}

// EXPOR FUNÇÕES PARA O HTML
window.cadastrarProduto = cadastrarProduto;
window.alterarQtd = alterarQtd;
window.excluirProduto = excluirProduto;
window.logout = logout;
