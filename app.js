/* Public directory UI. Provider and saved-provider data always comes from the SkillLink API. */
(() => {
  'use strict';
  const api = window.SkillLinkAPI.request;
  const $ = (selector, root = document) => root.querySelector(selector);
  const services = ['Plumber','Electrician','Welder','Carpenter','Mason','Tiler','Painter','Roofer','Locksmith','Appliance Repair','Phone Repair','Computer Repair','Solar Technician','CCTV Installer','Car Mechanic','Motorbike Mechanic','Graphic Designer','Web Developer','Photographer','Video Editor','Digital Marketer','House Cleaner','Gardener','Pest Control','House Mover','Babysitter','Nanny','Caregiver','Taxi Driver','Private Driver','Boda Boda','Delivery Rider','Barber','Hairdresser','Braider','Makeup Artist','Nail Technician','Tailor','Dressmaker','Chef','Caterer','Baker','Cake Decorator','Private Tutor','Mathematics Tutor','English Tutor','Kiswahili Tutor','Computer Tutor','Music Teacher','Driving Instructor','DJ','MC','Event Photographer','Event Decorator','Wedding Planner','Farmer','Veterinary Assistant','Pet Groomer','Architect','Quantity Surveyor','Civil Engineer','Building Contractor','Accountant','Bookkeeper','Virtual Assistant','Translator','Lawyer','Real Estate Agent','Personal Trainer','Fitness Instructor','Physiotherapist','Writer','Security Guard','Tour Guide','Furniture Assembly','General Household Repairs','Borehole Technician','Water Delivery','Solar Panel Installer','Content Writer','SEO Specialist','Irrigation Installer','Sound Engineer','Car Wash','Car Towing','Moving Service','M-Pesa Agent'];
  const locations = ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Malindi','Kitale','Garissa','Kakamega','Machakos','Nyeri','Meru','Naivasha','Kericho','Embu','Kisii','Kilifi','Nanyuki','Bungoma','Busia','Voi','Narok','Migori','Homa Bay','Siaya','Kitui','Makueni','Wote','Mwala','Kangundo','Athi River','Mlolongo','Syokimau','Kitengela','Kajiado','Ngong','Ongata Rongai','Limuru','Kiambu','Ruiru','Kikuyu','Githurai','Juja','Kasarani','Westlands','Karen','Kibera','Eastleigh','Embakasi','Lang’ata','Roysambu','Dagoretti','Mathare','Kawangware','Donholm','Buruburu','Umoja','Ruai','Diani','Ukunda','Mariakani','Watamu','Lamu Town','Taveta','Wundanyi','Chuka','Runyenjes','Mwea','Kerugoya','Karatina','Gilgil','Njoro','Molo','Sotik','Litein','Bondo','Yala','Ahero','Maseno','Oyugis','Rongo','Mumias','Webuye','Kimilili','Kapsabet','Nandi Hills','Iten','Kabarnet','Moyale','Lodwar','Mwingi','Makindu','Kibwezi','Dadaab','Kakuma','Maralal','Rumuruti','Nyahururu','Loitokitok','Mbita','Keroka','Ogembo','Luanda','Lugari','Muhoroni','CBD','Kilimani','Lavington','Parklands','Runda','Kahawa West','Kahawa Sukari','Zimmerman','Pipeline','Utawala','South B','South C','Imara Daima','Kileleshwa','Hurlingham','Upper Hill','Ngara','Pangani','Gikomba','Industrial Area','JKIA','Wilson Airport','Two Rivers','Village Market','Sarit Centre','Yaya Centre','KICC','Nyali','Bamburi','Shanzu','Kisauni','Likoni','Changamwe','Mtwapa','Old Town Mombasa','Kisumu CBD','Milimani Kisumu','Kondele','Manyatta Kisumu','Pioneer Eldoret','Langas','Kapsoya','Section 58','Lanet'];
  let activeQuery = {service:'',location:'',price:''};
  let currentUser = null;
  let savedIds = new Set();
  let toastTimer;

  // Escape database text before inserting it into generated card markup.
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function initials(name) { return String(name || '?').trim().split(/\s+/).slice(0,2).map(word => word[0] || '').join('').toUpperCase(); }
  function showToast(message) {
    const toast = $('#toast'); if (!toast) return;
    toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'),3200);
  }
  function fillList(id, items) {
    const node = $(id); if (node) node.innerHTML = [...new Set(items)].map(item => `<option value="${escapeHtml(item)}"></option>`).join('');
  }
  function getPriceLabel(person) {
    return person.priceType === 'negotiable' ? 'Price by agreement' : `From KSh ${Number(person.price || 0).toLocaleString('en-KE')} ${escapeHtml(person.priceType || 'per job')}`;
  }
  // Build one provider result card from the public API response.
  function card(person) {
    const photo = person.photo ? `<img src="${escapeHtml(person.photo)}" alt="Photo of ${escapeHtml(person.name)}" loading="lazy">` : '';
    const avatar = person.photo ? `<img src="${escapeHtml(person.photo)}" alt="" loading="lazy">` : escapeHtml(initials(person.name));
    const id = Number(person.id); const saved = savedIds.has(id);
    return `<article class="provider-card"><div class="provider-cover">${photo}<span class="provider-price">${getPriceLabel(person)}</span><button class="favorite-button ${saved?'is-saved':''}" type="button" data-save-provider="${id}" aria-label="${saved?'Remove from':'Save to'} saved providers" aria-pressed="${saved}">${saved?'♥':'♡'}</button></div>
      <div class="provider-body"><div class="provider-title-row"><div class="provider-avatar">${avatar}</div><div><h3 class="provider-name">${escapeHtml(person.name)}</h3><span class="provider-service">${escapeHtml(person.service)}</span><span class="provider-rating">${person.ratingCount ? `&#9733; ${Number(person.ratingAverage).toFixed(1)} &middot; ${Number(person.ratingCount)} rating${person.ratingCount === 1 ? '' : 's'}` : 'New provider'}</span></div></div>
      <p class="provider-meta">⌖ ${escapeHtml(person.location)}<br>◷ ${escapeHtml(person.availability || 'Ask provider')}</p><div class="provider-tags">${(person.services || []).slice(0,3).map(s => `<span class="provider-tag">${escapeHtml(s.name)}</span>`).join('')}</div>
      <div class="card-actions"><button class="button button-outline" type="button" data-view-provider="${id}">View profile</button><a class="button button-dark" href="tel:${escapeHtml(String(person.phone).replace(/[^+\d]/g,''))}">Call ↗</a></div></div></article>`;
  }
  function render(list) {
    const sort = $('#sortResults')?.value;
    if (sort === 'price-asc') list.sort((a,b) => Number(a.price)-Number(b.price));
    if (sort === 'price-desc') list.sort((a,b) => Number(b.price)-Number(a.price));
    if (sort === 'name') list.sort((a,b) => a.name.localeCompare(b.name));
    $('#resultCount').textContent = `${list.length} ${list.length === 1 ? 'provider' : 'providers'} ${activeQuery.service || activeQuery.location || activeQuery.price ? 'found' : 'available'}`;
    $('#results').innerHTML = list.length ? list.map(card).join('') : `<div class="empty-state"><div class="empty-icon">✳</div><h3>No providers found</h3><p>Try a shorter search, change your location, or remove the price limit. New providers can create an account and publish their profile.</p><a class="button button-dark" href="register.html?role=provider">List your service →</a></div>`;
    const filters = [];
    if (activeQuery.service) filters.push(`Skill: ${activeQuery.service}`);
    if (activeQuery.location) filters.push(`Place: ${activeQuery.location}`);
    if (activeQuery.price) filters.push(`Up to KSh ${Number(activeQuery.price).toLocaleString('en-KE')}`);
    $('#activeFilters').innerHTML = filters.map((label,i) => `<button class="filter-chip" data-clear-filter="${i}" type="button">${escapeHtml(label)} ×</button>`).join('');
    $('#activeFilters').classList.toggle('hidden',filters.length === 0);
  }
  // Read filters, request matching providers, then render the directory results.
  async function search() {
    const params = new URLSearchParams();
    if (activeQuery.service) params.set('service',activeQuery.service);
    if (activeQuery.location) params.set('location',activeQuery.location);
    if (activeQuery.price) params.set('max_price',activeQuery.price);
    try { const result = await api(`/api/providers?${params}`); currentProviders = result.providers; render([...currentProviders]); }
    catch (error) { $('#resultCount').textContent = 'Directory unavailable'; $('#results').innerHTML = `<div class="empty-state"><h3>Could not reach SkillLink</h3><p>${escapeHtml(error.message)} Check that the SkillLink API is available, then refresh.</p></div>`; }
  }
  // Load the full provider profile and display its contact and review dialog.
  async function showProfile(id) {
    try {
      const { provider: p } = await api(`/api/providers/${Number(id)}`);
      const cover = p.photo ? `<div class="profile-hero"><img src="${escapeHtml(p.photo)}" alt="Photo of ${escapeHtml(p.name)}"></div>` : '';
      const gallery = (p.gallery || []).length ? `<div class="profile-gallery">${p.gallery.map((image, index) => `<img src="${escapeHtml(image)}" alt="${escapeHtml(p.name)} work photo ${index + 1}" loading="lazy">`).join('')}</div>` : '';
      const avatar = p.photo ? `<img src="${escapeHtml(p.photo)}" alt="">` : escapeHtml(initials(p.name));
      const url = new URL('index.html', location.href);
      url.searchParams.set('provider', p.id);
      const saved = savedIds.has(Number(p.id));
      const reviews = p.reviews || [];
      const myReview = reviews.find(review => review.mine);
      const ratingSummary = p.ratingCount ? `&#9733; ${Number(p.ratingAverage).toFixed(1)} from ${Number(p.ratingCount)} rating${p.ratingCount === 1 ? '' : 's'}` : 'No ratings yet';
      const ratingForm = currentUser?.role === 'customer'
        ? `<form class="rating-form" data-review-provider="${Number(p.id)}"><h4>${myReview ? 'Update your rating' : 'Rate this provider'}</h4><label>Rating<select name="stars" required><option value="">Choose stars</option>${[5,4,3,2,1].map(stars => `<option value="${stars}" ${Number(myReview?.stars) === stars ? 'selected' : ''}>${'&#9733;'.repeat(stars)} (${stars})</option>`).join('')}</select></label><label>Your comments<textarea name="comment" maxlength="800" rows="3" placeholder="Share helpful, respectful feedback">${escapeHtml(myReview?.comment || '')}</textarea></label><button class="button button-dark" type="submit">${myReview ? 'Update rating' : 'Submit rating'}</button></form>`
        : currentUser ? '<p class="rating-login">Ratings are available from customer accounts.</p>'
        : `<p class="rating-login"><a href="login.html?next=index.html%3Fprovider%3D${Number(p.id)}">Sign in as a customer to leave a rating.</a></p>`;
      const reviewList = reviews.length
        ? `<div class="review-list">${reviews.map(review => `<article class="review-card"><div class="review-card-head"><strong>${escapeHtml(review.name)}</strong><span>${'&#9733;'.repeat(Number(review.stars))}${'&#9734;'.repeat(5 - Number(review.stars))}</span></div><p>${escapeHtml(review.comment || 'Left a rating without a comment.')}</p><small>${review.mine ? 'Your rating &middot; ' : ''}${review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</small></article>`).join('')}</div>`
        : '<p class="rating-login">No ratings yet. Be the first customer to share feedback.</p>';
      $('#profileContent').innerHTML = `${cover}<div class="profile-heading"><div class="provider-avatar">${avatar}</div><div><h2 id="profileTitle">${escapeHtml(p.name)}</h2><p>${escapeHtml(p.service)}</p><span class="provider-rating">${ratingSummary}</span></div></div>
        <p class="profile-location">${escapeHtml(p.location)}<br>${escapeHtml(p.availability || 'Ask provider')}</p><div class="profile-price">${getPriceLabel(p)}</div>
        <h3 class="profile-subhead">Services</h3><div class="profile-skills">${(p.services || []).map(service => `<span class="provider-tag">${escapeHtml(service.name)} &middot; ${service.priceType === 'negotiable' ? 'Price by agreement' : `KSh ${Number(service.price).toLocaleString('en-KE')} ${escapeHtml(service.priceType)}`}</span>`).join('')}</div>
        <h3 class="profile-subhead">About</h3><p class="profile-about">${escapeHtml(p.about || 'This provider has not added a description yet.')}</p>
        ${gallery}<h3 class="profile-subhead">Customer ratings <small class="rating-disclaimer">Community feedback. Your first name and last initial are shown; ratings are not verified job records.</small></h3>${ratingForm}${reviewList}
        <div class="profile-actions"><a class="button button-dark" href="tel:${escapeHtml(String(p.phone).replace(/[^+\d]/g, ''))}">Call ${escapeHtml(p.name.split(/\s+/)[0])}</a><a class="button button-lime" href="https://wa.me/${escapeHtml(phoneForWhatsApp(p.phone))}" target="_blank" rel="noopener noreferrer">WhatsApp</a></div>
        <div class="profile-actions secondary-actions"><button class="button button-outline" data-save-provider="${Number(p.id)}" type="button">${saved ? 'Saved provider' : 'Save provider'}</button><button class="button button-outline" data-share-profile="${escapeHtml(url.href)}" type="button">Share profile</button></div>`;
      if (!$('#profileDialog').open) $('#profileDialog').showModal();
    } catch (error) { showToast(error.message); }
  }

  document.addEventListener('submit', async event => {
    const form = event.target.closest('[data-review-provider]');
    if (!form) return;
    event.preventDefault();
    const providerId = Number(form.dataset.reviewProvider);
    try {
      await api(`/api/providers/${providerId}/reviews`, { method: 'POST', body: JSON.stringify({ stars: form.elements.stars.value, comment: form.elements.comment.value.trim() }) });
      showToast('Your rating has been saved to your account.');
      await showProfile(providerId);
    } catch (error) { showToast(error.message); }
  });
  function phoneForWhatsApp(phone) {
    const digits = String(phone || '').replace(/\D/g,'');
    if (digits.startsWith('0')) return `254${digits.slice(1)}`;
    if (digits.startsWith('254')) return digits;
    return digits.length === 9 && /^[17]/.test(digits) ? `254${digits}` : digits;
  }
  // Save or remove a provider using the current customer session.
  async function toggleSaved(id) {
    if (!currentUser || currentUser.role !== 'customer') { location.href = 'login.html?next=saved.html'; return; }
    const providerId = Number(id); const removing = savedIds.has(providerId);
    try {
      await api(`/api/saved/${providerId}`,{method:removing?'DELETE':'POST'});
      if (removing) savedIds.delete(providerId); else savedIds.add(providerId);
      renderFromCurrent();
      if ($('#profileDialog').open) await showProfile(providerId);
      showToast(removing ? 'Removed from saved providers.' : 'Provider saved to your account.');
    } catch (error) { showToast(error.message); }
  }
  let currentProviders = [];
  function renderFromCurrent() { render([...currentProviders]); }
  function resetSearch() {
    activeQuery = {service:'',location:'',price:''};
    $('#searchService').value=''; $('#searchLocation').value=''; $('#searchPrice').value='';
    search();
  }
  // Load initial search data and wire up the homepage controls.
  async function initialize() {
    fillList('#serviceList',services); fillList('#locationList',locations);
    try {
      const result = await api('/api/auth/me'); currentUser = result.user;
      if (currentUser?.role === 'customer') { const saved = await api('/api/saved'); savedIds = new Set(saved.providers.map(p => Number(p.id))); }
    } catch {}
    await search();
    const shared = new URLSearchParams(location.search).get('provider');
    if (shared) await showProfile(shared);
  }

  $('#searchForm').addEventListener('submit',event => {
    event.preventDefault(); activeQuery={service:$('#searchService').value.trim(),location:$('#searchLocation').value.trim(),price:$('#searchPrice').value.trim()};
    search().then(() => $('#providers').scrollIntoView({behavior:'smooth',block:'start'}));
  });
  $('#sortResults').addEventListener('change',renderFromCurrent);
  document.addEventListener('click',event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.matches('[data-view-provider]')) showProfile(button.dataset.viewProvider);
    if (button.matches('[data-save-provider]')) toggleSaved(button.dataset.saveProvider);
    if (button.matches('[data-close-dialog]')) button.closest('dialog').close();
    if (button.matches('[data-quick]')) { $('#searchService').value=button.dataset.quick; $('#searchForm').requestSubmit(); }
    if (button.matches('[data-category]')) { $('#searchService').value=button.dataset.category; $('#searchForm').requestSubmit(); }
    if (button.matches('[data-clear-filter]')) {
      const index=Number(button.dataset.clearFilter); if(index===0)activeQuery.service=''; if(index===1)activeQuery.location=''; if(index===2)activeQuery.price='';
      $('#searchService').value=activeQuery.service; $('#searchLocation').value=activeQuery.location; $('#searchPrice').value=activeQuery.price; search();
    }
    if (button.matches('[data-share-profile]')) {
      const url=button.dataset.shareProfile;
      if (navigator.share) navigator.share({title:'SkillLink provider',url}).catch(()=>{});
      else if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(()=>showToast('Profile link copied.')).catch(()=>showToast(url));
      else showToast(url);
    }
  });
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click',event => { if(event.target===dialog)dialog.close(); }));
  $('#categoryGrid').innerHTML = [
    ['Home & repairs','Plumber','Plumbing, electrical, handywork','pictures/charanjeet-dhiman-9xObRZdEN7g-unsplash.jpg'],
    ['Beauty & care','Hairdresser','Hair, grooming, wellness','pictures/lindsay-cash-Md_DhaFsnCQ-unsplash.jpg'],
    ['Transport','Driver','Drivers, delivery, moving','pictures/why-kei-8e2gal_GIE8-unsplash.jpg'],
    ['Learning','Tutor','Tutors, coaches, teachers','pictures/storyzangu-hub-Ix-axXotEg0-unsplash.jpg'],
    ['Events & food','Caterer','Catering, baking, events','pictures/saile-ilyas-SiwrpBnxDww-unsplash.jpg'],
    ['Digital & creative','Designer','Design, tech, photography','pictures/daniel-korpai-pKRNxEguRgM-unsplash.jpg']
  ].map(([name,skill,note,image])=>`<button class="category-card" type="button" data-category="${escapeHtml(skill)}" aria-label="Search ${escapeHtml(skill)} providers"><img src="${escapeHtml(image)}" alt="" loading="lazy"><span class="category-arrow">↗</span><span class="category-label"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(note)}</small></span></button>`).join('');
  initialize();
})();
