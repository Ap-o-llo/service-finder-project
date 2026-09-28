/* Provider dashboard owns photo processing and profile CRUD for the signed-in provider. */
(() => {
  const api = window.SkillLinkAPI.request;
  const $ = selector => document.querySelector(selector);
  let provider = null;
  let gallery = [];
  let profilePhoto = '';

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const message = (text, success = false) => {
    const node = $('#dashboardMessage');
    node.textContent = text;
    node.classList.remove('hidden', 'success');
    if (success) node.classList.add('success');
  };

  // Add an editable service row, optionally populated from saved data.
  function addService(service = {}) {
    const row = document.createElement('div');
    row.className = 'service-row';
    row.innerHTML = `<label>Service name<input class="service-name" required maxlength="100" list="serviceSuggestions" value="${escapeHtml(service.name || '')}" placeholder="e.g. Plumbing"></label><label>Starting price<input class="service-price" required type="number" min="0" max="99999999" value="${service.price ?? ''}" placeholder="1000"></label><label>Price type<select class="service-price-type"><option value="per job">Per job</option><option value="per hour">Per hour</option><option value="per visit">Per visit</option><option value="negotiable">Negotiable</option></select></label><button class="remove-service" type="button" aria-label="Remove service">Remove</button><label class="service-detail">Details<input class="service-details" maxlength="500" value="${escapeHtml(service.details || '')}" placeholder="Repairs, installations, call-outs"></label>`;
    row.querySelector('.service-price-type').value = service.priceType || 'per job';
    row.querySelector('.remove-service').addEventListener('click', () => row.remove());
    $('#serviceRows').append(row);
  }

  function renderGallery() {
    $('#galleryPreview').innerHTML = gallery.map((photo, index) => `<article class="gallery-edit-card"><img src="${photo}" alt="Work gallery photo ${index + 1}"><div><button type="button" data-use-photo="${index}">Use as profile picture</button><button type="button" data-remove-photo="${index}" aria-label="Remove photo ${index + 1}">Remove</button></div></article>`).join('');
  }

  function renderChecklist() {
    const rows = [
      ['Location', Boolean(provider?.location)],
      ['At least one service', Boolean(provider?.services?.length)],
      ['About your work', Boolean(provider?.about)],
      ['Profile picture', Boolean(provider?.photo)],
      ['Work gallery', Boolean(provider?.gallery?.length)],
    ];
    $('#profileChecklist').innerHTML = rows.map(([label, done]) => `<div class="mini-provider"><span class="mini-avatar">${done ? '✓' : '·'}</span><div><strong>${label}</strong><small>${done ? 'Added' : 'Optional, but helps customers'}</small></div></div>`).join('');
    const published = Boolean(provider?.published);
    const status = $('#profileStatus');
    status.textContent = published ? 'Published' : 'Profile in progress';
    status.classList.toggle('draft', !published);
    $('#unpublishButton').classList.toggle('hidden', !published);
    const view = $('#viewPublicProfile');
    view.href = published ? `index.html?provider=${provider.id}` : 'index.html';
    view.classList.toggle('hidden', !published);
  }

  // Load the provider?s saved profile before filling the dashboard form.
  async function load() {
    try {
      const auth = await api('/api/auth/me');
      if (!auth.user) { location.href = 'login.html?next=provider-dashboard.html'; return; }
      if (auth.user.role !== 'provider') { location.href = 'customer-dashboard.html'; return; }
      $('#providerWelcome').textContent = auth.user.name.split(/\s+/)[0];
      const result = await api('/api/providers/me');
      provider = result.provider;
      profilePhoto = provider.photo || '';
      gallery = provider.gallery || [];
      $('#providerLocation').value = provider.location || '';
      $('#providerAbout').value = provider.about || '';
      $('#providerAvailability').value = provider.availability || 'Ask provider';
      if (profilePhoto) {
        $('#photoPreview').src = profilePhoto;
        $('#photoPreview').classList.remove('hidden');
      }
      (provider.services?.length ? provider.services : [{}]).forEach(addService);
      renderGallery();
      renderChecklist();
    } catch (error) { message(error.message); }
  }

  // Resize photos in the browser to keep uploads within the server limit.
  async function compressPhoto(file, maxBytes = 2 * 1024 * 1024, dimension = 700, quality = 0.72) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > maxBytes) {
      throw new Error('Choose a JPG, PNG, or WebP photo under 2 MB.');
    }
    const source = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read photo.'));
      reader.readAsDataURL(file);
    });
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Could not open photo.'));
      element.src = source;
    });
    const scale = Math.min(1, dimension / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  }

  $('#addService').addEventListener('click', () => addService());
  $('#providerPhoto').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      profilePhoto = await compressPhoto(file, 2 * 1024 * 1024, 900, 0.78);
      $('#photoPreview').src = profilePhoto;
      $('#photoPreview').classList.remove('hidden');
    } catch (error) { message(error.message); }
  });
  $('#providerGallery').addEventListener('change', async event => {
    const files = [...event.target.files];
    try {
      if (gallery.length + files.length > 6) throw new Error('Your work gallery can contain up to 6 photos.');
      for (const file of files) gallery.push(await compressPhoto(file));
      renderGallery();
    } catch (error) { message(error.message); }
    event.target.value = '';
  });
  $('#galleryPreview').addEventListener('click', event => {
    const useButton = event.target.closest('[data-use-photo]');
    const removeButton = event.target.closest('[data-remove-photo]');
    if (useButton) {
      profilePhoto = gallery[Number(useButton.dataset.usePhoto)];
      $('#photoPreview').src = profilePhoto;
      $('#photoPreview').classList.remove('hidden');
    }
    if (removeButton) {
      gallery.splice(Number(removeButton.dataset.removePhoto), 1);
      renderGallery();
    }
  });

  $('#providerProfileForm').addEventListener('submit', async event => {
    event.preventDefault();
    const submitter = event.submitter;
    const publish = submitter?.dataset.publish === 'true' ? true : submitter?.dataset.publish === 'false' ? false : undefined;
    const services = [...document.querySelectorAll('.service-row')].map(row => ({
      name: row.querySelector('.service-name').value.trim(),
      details: row.querySelector('.service-details').value.trim(),
      price: Number(row.querySelector('.service-price').value),
      priceType: row.querySelector('.service-price-type').value,
    })).filter(service => service.name);
    try {
      const data = {
        location: $('#providerLocation').value.trim(),
        about: $('#providerAbout').value.trim(),
        availability: $('#providerAvailability').value,
        photo: profilePhoto,
        gallery,
        services,
      };
      if (publish !== undefined) data.publish = publish;
      const result = await api('/api/providers/me', { method: 'PUT', body: JSON.stringify(data) });
      provider = result.provider;
      profilePhoto = provider.photo || '';
      gallery = provider.gallery || [];
      renderGallery();
      renderChecklist();
      message(provider.published ? 'Profile, photos, and services are published.' : 'Draft saved. Customers cannot find draft profiles.', true);
      $('#providerPhoto').value = '';
    } catch (error) { message(error.message); }
  });

  $('#unpublishButton').addEventListener('click', async () => {
    try {
      const result = await api('/api/providers/me', { method: 'PUT', body: JSON.stringify({ publish: false }) });
      provider = result.provider;
      renderChecklist();
      message('Your profile is now a draft.', true);
    } catch (error) { message(error.message); }
  });
  load();
})();
