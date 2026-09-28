/* Customer dashboard data comes from the signed-in account and shared database. */
(() => {
  const api=window.SkillLinkAPI.request;
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials=name=>String(name||'?').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
  // Fetch signed-in customer details and recent activity from the API.
  async function load(){
    try{
      const auth=await api('/api/auth/me');if(!auth.user){location.href='login.html?next=customer-dashboard.html';return;}if(auth.user.role!=='customer'){location.href='provider-dashboard.html';return;}
      document.querySelector('#customerWelcome').textContent=auth.user.name.split(/\s+/)[0];
      const data=await api('/api/dashboard');document.querySelector('#savedCount').textContent=data.savedCount;
      const host=document.querySelector('#recentProviders');
      host.innerHTML=data.recentlyViewed.length?data.recentlyViewed.map(p=>`<a class="mini-provider" href="index.html?provider=${encodeURIComponent(p.id)}"><span class="mini-avatar">${p.photo?`<img src="${escapeHtml(p.photo)}" alt="">`:escapeHtml(initials(p.name))}</span><span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.service)} &middot; ${escapeHtml(p.location)} &middot; ${p.ratingCount ? `&#9733; ${Number(p.ratingAverage).toFixed(1)}` : "New provider"}</small></span></a>`).join(''):'<div class="dashboard-empty">Profiles you open will appear here.</div>';
    }catch(error){document.querySelector('#recentProviders').textContent=error.message;}
  }
  load();
})();
