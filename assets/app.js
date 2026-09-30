document.querySelectorAll('form[onsubmit]').forEach(form => {
  form.addEventListener('submit', event => {
    if (form.dataset.confirmed === 'true') return;
    const inline = form.getAttribute('onsubmit');
    if (inline && inline.includes('confirm(')) {
      // The inline confirmation remains the single source of confirmation behavior.
    }
  });
});
