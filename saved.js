/* Customer saved-provider page reads and updates the shared database. */
(() => {
  const api=window.SkillLinkAPI.request;
  const host=document.querySelector('#savedProviders');
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function card(person){
    const photo=person.photo?`<img src="${escapeHtml(person.photo)}" alt="Photo of ${escapeHtml(person.name)}">`:`<span class="saved-initials">${escapeHtml(String(person.name||'?').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase())}</span>`;
    const price=person.priceType==='negotiable'?'Price by agreement':`From KSh ${Number(person.price||0).toLocaleString('en-KE')} ${escapeHtml(person.priceType||'per job')}`;
    return `<article class="saved-card"><div class="saved-card-photo">${photo}</div><div class="saved-card-body"><span class="eyebrow">${escapeHtml(person.service)}</span><h2>${escapeHtml(person.name)}</h2><p>⌖ ${escapeHtml(person.location)}<br>${price}</p><div class="saved-actions"><a class="button button-outline" href="index.html?provider=${Number(person.id)}">View profile</a><a class="button button-dark" href="tel:${escapeHtml(String(person.phone||'').replace(/[^+\d]/g,''))}">Call ↗</a></div><button class="text-action" data-unsave="${Number(person.id)}" type="button">Remove from saved</button></div></article>`;
  }
  // Fetch the signed-in customer?s saved providers and render their cards.
  async function render(){
    try{
      const auth=await api('/api/auth/me');
      if(!auth.user){location.href='login.html?next=saved.html';return;}
      if(auth.user.role!=='customer'){host.innerHTML='<div class="empty-state"><h2>Saved providers are a customer feature</h2><p>Your provider account can still browse the directory.</p><a class="button button-dark" href="provider-dashboard.html">Open provider dashboard</a></div>';return;}
      const result=await api('/api/saved');
      host.innerHTML=result.providers.length?result.providers.map(card).join(''):`<div class="empty-state"><div class="empty-icon">♡</div><h2>No saved providers yet</h2><p>Save providers from the directory. Your shortlist will be available whenever you sign in.</p><a class="button button-dark" href="index.html#providers">Explore providers →</a></div>`;
      const badge=document.querySelector('#favoriteCount');if(badge)badge.textContent=result.providers.length;
    }catch(error){host.innerHTML=`<div class="empty-state"><h2>Could not load saved providers</h2><p>${escapeHtml(error.message)}</p></div>`;}
  }
  host.addEventListener('click',async event=>{
    const button=event.target.closest('[data-unsave]');if(!button)return;
    try{await api(`/api/saved/${Number(button.dataset.unsave)}`,{method:'DELETE'});render();}
    catch(error){window.alert(error.message);}
  });
  render();
})();
