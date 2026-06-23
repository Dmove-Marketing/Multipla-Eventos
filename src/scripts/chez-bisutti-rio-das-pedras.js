/* Scripts extraídos de chez-bisutti-rio-das-pedras.html */

// Reveal on scroll
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  },{threshold:.15});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  // Form (front-end only — conectar ao seu serviço de envio depois)
  const btn = document.getElementById('submitBtn');
  btn && btn.addEventListener('click', ()=>{
    const nome = document.getElementById('nome');
    const email = document.getElementById('email');
    const tel = document.getElementById('telefone');
    if(!nome.value || !email.value || !tel.value){
      [nome,email,tel].forEach(f=>{ if(!f.value){ f.style.borderColor='#B4544E'; }});
      return;
    }
    document.getElementById('formFields').style.display='none';
    document.getElementById('formSuccess').classList.add('show');
  });