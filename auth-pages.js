/* Follow account forms from the browser to the API: signup, sign-in, verification,
   password recovery, account details, and password changes. */
(() => {
  const api = window.SkillLinkAPI.request;
  const $ = selector => document.querySelector(selector);
  // Show accessible form feedback without navigating away from the page.
  const showMessage = (message,success=false,target='#formMessage') => { const node=$(target); if(node){node.textContent=message;node.classList.remove('hidden','success');if(success)node.classList.add('success');} };
  // Send each account role to its own dashboard after authentication.
  function dashboardFor(user) { return user.role === 'provider' ? 'provider-dashboard.html' : 'customer-dashboard.html'; }

  // New production accounts wait for the email link before entering a session.
  $('#registerForm')?.addEventListener('submit',async event=>{
    event.preventDefault(); const form=event.currentTarget; const button=form.querySelector('button[type="submit"]'); button.disabled=true;
    const data=Object.fromEntries(new FormData(form)); data.role=$('#accountRole').value;
    try { const result=await api('/api/auth/register',{method:'POST',body:JSON.stringify(data)}); if(result.verificationRequired){showMessage(result.message,true);button.disabled=false;return;} location.href=dashboardFor(result.user); }
    catch(error){showMessage(error.message);button.disabled=false;}
  });
  $('#loginForm')?.addEventListener('submit',async event=>{
    event.preventDefault(); const form=event.currentTarget; const button=form.querySelector('button[type="submit"]'); button.disabled=true;
    try {
      const result=await api('/api/auth/login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form)))});
      const next=new URLSearchParams(location.search).get('next');
      const safeNext=next && (['saved.html','customer-dashboard.html','provider-dashboard.html','account.html'].includes(next) || /^index\.html\?provider=\d+$/.test(next));
      location.href=safeNext ? next : dashboardFor(result.user);
    } catch(error){showMessage(error.message);button.disabled=false;}
  });
  $('#accountForm')?.addEventListener('submit',async event=>{
    event.preventDefault(); const form=event.currentTarget;
    try {const result=await api('/api/account',{method:'PATCH',body:JSON.stringify(Object.fromEntries(new FormData(form)))});showMessage('Account details updated.',true);$('#accountName').value=result.user.name;$('#accountPhone').value=result.user.phone;}
    catch(error){showMessage(error.message);}
  });
  $('#passwordForm')?.addEventListener('submit',async event=>{
    event.preventDefault(); const form=event.currentTarget;
    const data=Object.fromEntries(new FormData(form));
    if(data.newPassword!==data.confirmPassword){showMessage('The new passwords do not match.',false,'#passwordMessage');return;}
    try {await api('/api/account/password',{method:'POST',body:JSON.stringify(data)});form.reset();showMessage('Password changed. Sign in again with your new password.',true,'#passwordMessage');setTimeout(()=>location.href='login.html',1200);}
    catch(error){showMessage(error.message,false,'#passwordMessage');}
  });
  // Send a generic response whether the submitted email exists or not.
  $('#forgotPasswordForm')?.addEventListener('submit',async event=>{
    event.preventDefault();const form=event.currentTarget;
    try{const result=await api('/api/auth/forgot-password',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form)))});showMessage(result.message,true);}
    catch(error){showMessage(error.message);}
  });
  // Verification requires an explicit user action, rather than trusting a mail scanner GET.
  $('#verifyForm')?.addEventListener('submit',async event=>{
    event.preventDefault();const token=new URLSearchParams(location.hash.slice(1)).get('token')||'';
    try{const result=await api('/api/auth/verify',{method:'POST',body:JSON.stringify({token})});history.replaceState({},'',location.pathname);showMessage(result.message,true);}
    catch(error){showMessage(error.message);}
  });
  $('#resendVerificationForm')?.addEventListener('submit',async event=>{
    event.preventDefault();const form=event.currentTarget;
    try{const result=await api('/api/auth/resend-verification',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form)))});showMessage(result.message,true,'#resendMessage');}
    catch(error){showMessage(error.message,false,'#resendMessage');}
  });
  // The reset token is bound to the emailed URL and can be used only once.
  $('#resetPasswordForm')?.addEventListener('submit',async event=>{
    event.preventDefault();const form=event.currentTarget;const data=Object.fromEntries(new FormData(form));
    if(data.password!==data.confirmPassword){showMessage('The passwords do not match.',false,'#resetMessage');return;}
    data.token=new URLSearchParams(location.hash.slice(1)).get('token')||'';
    try{const result=await api('/api/auth/reset-password',{method:'POST',body:JSON.stringify(data)});history.replaceState({},'',location.pathname);form.reset();showMessage(result.message,true,'#resetMessage');}
    catch(error){showMessage(error.message,false,'#resetMessage');}
  });
  $('#accountPage') && api('/api/auth/me').then(result=>{
    if(!result.user){location.href='login.html?next=account.html';return;}
    $('#accountName').value=result.user.name; $('#accountPhone').value=result.user.phone; $('#accountEmail').value=result.user.email;
    $('#accountRoleText').textContent=result.user.role==='provider'?'Service provider':'Customer';
  }).catch(()=>location.href='login.html');
  if($('#accountRole')){
    const requested=new URLSearchParams(location.search).get('role');
    if(['provider','customer'].includes(requested))$('#accountRole').value=requested;
  }
  // Direct access to the verification URL without a token should show only the resend form.
  if($('#verifyForm')&&!new URLSearchParams(location.hash.slice(1)).has('token'))$('#verifyForm').classList.add('hidden');
})();
