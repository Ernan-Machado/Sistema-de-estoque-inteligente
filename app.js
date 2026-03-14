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
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-4">
            <div class="font-bold text-slate-700 text-sm">${item.nome}</div>
            <div class="text-[10px] text-slate-400 uppercase tracking-widest">${item.sku}</div>
        </td>
        <td class="p-4 pr-2 text-center font-mono font-bold text-slate-600">${estoqueAtual}</td>
      <td class="p-4 align-middle">
    <div style="display: flex; justify-content: flex-start;">
        <span style="transform: translateX(15px);" class="px-2 py-0.5 text-[9px] font-bold rounded-full ${statusCritico ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}">
            ${statusCritico ? 'REPOR' : 'OK'}
        </span>
    </div>
</td>
<tr>
        <td class="p-4">
            <div class="flex items-center justify-end gap-2">
                <input type="number" id="mov-${item.id}" value="1" class="w-10 p-1 border rounded text-xs text-center">
                <button onclick="alterarQtd(${item.id}, ${estoqueAtual}, 'in')" class="bg-slate-100 p-1 rounded text-emerald-600 font-bold">+</button>
                <button onclick="alterarQtd(${item.id}, ${estoqueAtual}, 'out')" class="bg-slate-100 p-1 rounded text-red-600 font-bold">-</button>
                <button onclick="excluirProduto(${item.id}, '${item.nome}')" class="ml-2 text-slate-300 hover:text-red-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        </td>
    </tr>`;
        <td class="p-3">
            <div class="flex items-center justify-end gap-1 md:gap-2">
                <input type="number" id="mov-${item.id}" value="1" class="w-8 md:w-10 p-1 border rounded text-xs text-center bg-white">
                
                <button onclick="alterarQtd(${item.id}, ${estoqueAtual}, 'in')" class="bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded text-emerald-600 transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                </button>
                
                <button onclick="alterarQtd(${item.id}, ${estoqueAtual}, 'out')" class="bg-red-50 hover:bg-red-100 p-1.5 rounded text-red-600 transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/></svg>
                </button>

                <button onclick="excluirProduto(${item.id}, '${item.nome}')" class="ml-1 p-1.5 text-slate-300 hover:text-red-600 transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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
