const SUPABASE_URL = 'https://qqdcqkgaumdupopunfic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_D8NXX7IvL17eUxuPTsXVHg_wc5KOlRM';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- CADASTRO ---
async function cadastrarProduto() {
    // Pegar o usuário logado para poder usar o ID dele
    const { data: { user } } = await _supabase.auth.getUser();

    if (!user) return alert("Sessão expirada. Faça login novamente.");

    const nome = document.getElementById('nome').value;
    const sku = document.getElementById('sku').value;
    const preco = parseFloat(document.getElementById('preco').value) || 0;
    const estoque_minimo = parseInt(document.getElementById('estoque_minimo').value) || 0;

    if(!nome || !sku) return alert("Nome e SKU são obrigatórios!");

    // IMPORTANTE: Mudei para 'usuario_id' para bater com o seu banco de dados
    const { error } = await _supabase.from('products').insert([{ 
        nome, 
        sku, 
        preco, 
        estoque_minimo, 
        estoque_atual: 0, 
        usuario_id: user.id  // Ajustado de user_id para usuario_id
    }]);

    if (error) {
        alert("Erro ao salvar: " + error.message);
    } else {
        alert("Produto salvo!");
        location.reload(); 
    }
}

// --- LISTAGEM COM FILTRO ---
async function carregarEstoque() {
    const { data: { user } } = await _supabase.auth.getUser();
    
    // Filtra para mostrar apenas os produtos do usuário logado
    const { data: produtos, error } = await _supabase
        .from('products')
        .select('*')
        .eq('usuario_id', user.id) // Filtro essencial para a segurança
        .order('nome', { ascending: true });

    if (error) return console.error(error);

    let totalItens = 0, produtosBaixos = 0, valorTotal = 0;
    const lista = document.getElementById('lista-produtos');
    if (!lista) return;
    lista.innerHTML = '';

    produtos.forEach(item => {
        const estoqueAtual = item.estoque_atual || 0;
        const preco = item.preco || 0;
        totalItens += estoqueAtual;
        valorTotal += (estoqueAtual * preco);
        
        const statusCritico = estoqueAtual <= (item.estoque_minimo || 0);
        if (statusCritico) produtosBaixos++;

        lista.innerHTML += `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-4">
                    <div class="font-bold text-slate-700 text-sm">${item.nome}</div>
                    <div class="text-[10px] text-slate-400 uppercase tracking-widest">${item.sku}</div>
                </td>
                <td class="p-4 text-center font-mono font-bold text-slate-600">${estoqueAtual}</td>
                <td class="p-4">
                    <span class="px-2 py-0.5 text-[9px] font-bold rounded-full ${statusCritico ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}">
                        ${statusCritico ? 'REPOR' : 'OK'}
                    </span>
                </td>
                <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <input type="number" id="mov-${item.id}" value="1" class="w-10 p-1 border rounded text-xs text-center">
                        <button onclick="alterarQtd(${item.id}, ${estoqueAtual}, 'in')" class="bg-slate-100 p-1 rounded text-emerald-600 font-bold">+</button>
                        <button onclick="alterarQtd(${item.id}, ${estoqueAtual}, 'out')" class="bg-slate-100 p-1 rounded text-red-600 font-bold">-</button>
                        <button onclick="excluirProduto(${item.id}, '${item.nome}')" class="ml-2 text-slate-300 hover:text-red-500">
                             Excluir
                        </button>
                    </div>
                </td>
            </tr>`;
    });

    document.getElementById('card-total-itens').innerText = totalItens;
    document.getElementById('card-estoque-baixo').innerText = produtosBaixos;
    document.getElementById('card-valor-total').innerText = valorTotal.toLocaleString('pt-br',{style:'currency', currency:'BRL'});
}

// --- ALTERAR QUANTIDADE ---
async function alterarQtd(id, atual, tipo) {
    const qtdInput = document.getElementById(`mov-${id}`);
    const qtd = parseInt(qtdInput.value);
    const novaQtd = tipo === 'in' ? atual + qtd : atual - qtd;
    
    if (novaQtd < 0) return alert("Estoque insuficiente!");

    const { error } = await _supabase.from('products').update({ estoque_atual: novaQtd }).eq('id', id);
    if (error) alert(error.message);
    else carregarEstoque();
}

// --- EXCLUIR ---
async function excluirProduto(id, nome) {
    if (confirm(`Excluir ${nome}?`)) {
        const { error } = await _supabase.from('products').delete().eq('id', id);
        if (error) alert(error.message);
        else carregarEstoque();
    }
}

// --- SESSÃO ---
async function verificarSessao() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
    } else {
        carregarEstoque();
    }
}

async function logout() {
    await _supabase.auth.signOut();
    window.location.href = 'index.html';
}

// Inicialização
verificarSessao();
