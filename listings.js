/* Keep the previous management link working, now backed by real provider accounts. */
(() => {
  window.SkillLinkAPI.request('/api/auth/me').then(result=>{
    if(!result.user){location.href='login.html?next=provider-dashboard.html';return;}
    location.href=result.user.role==='provider'?'provider-dashboard.html':'customer-dashboard.html';
  }).catch(()=>location.href='login.html');
})();
