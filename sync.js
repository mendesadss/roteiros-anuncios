/* SYNC — grava no GitHub o que já foi marcado como gravado.
   A verdade fica no dados.json do repositório (campo "gravado" em cada item).
   O aparelho guarda só o que ainda não subiu (fila de pendentes).

   Fluxo do commit:
     1. GET contents/dados.json  -> conteúdo atual + sha
     2. aplica a fila em cima do conteúdo que acabou de vir
     3. PUT com aquele sha
     4. se der 409 (alguém gravou no meio), refaz do passo 1
   Assim, marcar em dois aparelhos não faz um apagar o outro.

   Sem sinal ou sem token: a fila fica guardada e sobe sozinha depois. */
window.SYNC = (function(){
  const TKEY = 'gb_gh_token';
  let cfg = { owner:'mendesadss', repo:'', path:'dados.json', arquivo:'roteiros' };
  let PKEY = 'gb_pend';
  let pend = {};          // id -> 'AAAA-MM-DD' (marcar) ou null (desmarcar)
  let onStatus = () => {};
  let enviando = false, agendado = null;

  const hoje = () => new Date().toISOString().slice(0,10);
  const token = () => { try { return localStorage.getItem(TKEY) || ''; } catch(e){ return ''; } };
  const lerPend = () => { try { pend = JSON.parse(localStorage.getItem(PKEY) || '{}'); } catch(e){ pend = {}; } };
  const salvarPend = () => { try { localStorage.setItem(PKEY, JSON.stringify(pend)); } catch(e){} };

  function status(){
    const n = Object.keys(pend).length;
    if (!token()) return { estado:'sem-token', n, txt: n ? n + ' marcações só neste aparelho' : 'Sincronização desligada' };
    if (enviando)  return { estado:'enviando', n, txt:'Enviando...' };
    if (n)         return { estado:'pendente', n, txt: n + ' pra enviar' };
    return { estado:'ok', n:0, txt:'Tudo sincronizado' };
  }
  const avisar = () => onStatus(status());

  /* base64 <-> texto, preservando acento */
  function paraB64(txt){
    const bytes = new TextEncoder().encode(txt);
    let s = '';
    const CH = 0x8000;
    for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i+CH));
    return btoa(s);
  }
  function deB64(b64){
    const bin = atob(b64.replace(/\n/g,''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  function api(url, opt){
    return fetch('https://api.github.com' + url, Object.assign({
      headers: {
        'Authorization': 'Bearer ' + token(),
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }, opt || {}));
  }

  function aplicar(dados){
    const listas = [dados.roteiros, dados.ganchos, dados.ideias].filter(Boolean);
    let mexeu = 0;
    Object.keys(pend).forEach(id => {
      listas.forEach(l => {
        const it = l.find(x => x.id === id);
        if (!it) return;
        if (pend[id]) { if (it.gravado !== pend[id]) { it.gravado = pend[id]; mexeu++; } }
        else if (it.gravado) { delete it.gravado; mexeu++; }
      });
    });
    return mexeu;
  }

  function enviar(tentativa){
    tentativa = tentativa || 0;
    if (enviando || !token() || !Object.keys(pend).length) return Promise.resolve();
    if (tentativa > 3) { enviando = false; avisar(); return Promise.resolve(); }
    enviando = true; avisar();

    const p = '/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + cfg.path;
    return api(p + '?ref=main')
      .then(r => { if (!r.ok) throw new Error('GET ' + r.status); return r.json(); })
      .then(info => {
        const dados = JSON.parse(deB64(info.content));
        const enviados = Object.assign({}, pend);
        const mexeu = aplicar(dados);
        if (!mexeu){ pend = {}; salvarPend(); enviando = false; avisar(); return; }
        dados.atualizado = hoje();
        const n = Object.keys(enviados).length;
        return api(p, {
          method:'PUT',
          body: JSON.stringify({
            message: 'sync: ' + n + ' ' + cfg.arquivo + ' marcados como gravados',
            content: paraB64(JSON.stringify(dados, null, 1)),
            sha: info.sha,
            branch: 'main'
          })
        }).then(r => {
          if (r.status === 409 || r.status === 422){
            enviando = false;
            return new Promise(res => setTimeout(res, 900)).then(() => enviar(tentativa+1));
          }
          if (!r.ok) throw new Error('PUT ' + r.status);
          Object.keys(enviados).forEach(id => { if (pend[id] === enviados[id]) delete pend[id]; });
          salvarPend(); enviando = false; avisar();
        });
      })
      .catch(() => { enviando = false; avisar(); });   // fica na fila, tenta de novo depois
  }

  return {
    iniciar(config, cb){
      cfg = Object.assign(cfg, config);
      PKEY = 'gb_pend_' + cfg.repo;
      onStatus = cb || onStatus;
      lerPend();
      avisar();
      if (Object.keys(pend).length) setTimeout(enviar, 1200);
      window.addEventListener('online', () => enviar());
      return this;
    },
    /* aplica o que veio do repo + o que ainda está na fila deste aparelho */
    estadoInicial(dados){
      const feitos = {};
      [dados.roteiros, dados.ganchos, dados.ideias].filter(Boolean).forEach(l =>
        l.forEach(x => { if (x.gravado) feitos[x.id] = x.gravado; }));
      Object.keys(pend).forEach(id => { if (pend[id]) feitos[id] = pend[id]; else delete feitos[id]; });
      return feitos;
    },
    marcar(id, ligado){
      pend[id] = ligado ? hoje() : null;
      salvarPend(); avisar();
      clearTimeout(agendado);
      agendado = setTimeout(() => enviar(), 1500);   // junta cliques seguidos num commit só
    },
    forcar(){ return enviar(); },
    status,
    temToken(){ return !!token(); },
    salvarToken(t){
      try { localStorage.setItem(TKEY, (t||'').trim()); } catch(e){}
      avisar();
      return this.testar();
    },
    apagarToken(){ try { localStorage.removeItem(TKEY); } catch(e){} avisar(); },
    testar(){
      if (!token()) return Promise.resolve({ ok:false, msg:'Cole o token primeiro' });
      return api('/repos/' + cfg.owner + '/' + cfg.repo)
        .then(r => {
          if (r.status === 401) return { ok:false, msg:'Token inválido ou expirado' };
          if (r.status === 404) return { ok:false, msg:'Token sem acesso a este repositório' };
          if (!r.ok) return { ok:false, msg:'Erro ' + r.status };
          return r.json().then(j => j.permissions && j.permissions.push
            ? { ok:true, msg:'Conectado. Pode escrever em ' + j.name }
            : { ok:false, msg:'Token só de leitura. Precisa de permissão de escrita em Contents' });
        })
        .catch(() => ({ ok:false, msg:'Sem conexão' }));
    }
  };
})();
