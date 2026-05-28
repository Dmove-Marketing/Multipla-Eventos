/* Scripts extraídos de debutantes-v1.html - Limpos de erros de sintaxe e prontos para o build */

(function(){
  // ===== CONFIG =====
  var FIELD_ID    = 'form-field-fonte'; // id comum no Elementor
  var INTERVAL_MS = 300;                // tenta com mais frequência
  var MAX_TRIES   = 20;                 // dá mais tempo pro GTM/HTML inicializar

  // ===== HELPERS (ES5) =====
  function getCookie(name){
    var m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?|{}()[\]\\/+^])/g,'\\$1') + '=([^;]*)'));
    return m ? m[1] : ''; // mantém RAW (sem decode aqui)
  }

  // decode seguro (igual à sua estratégia do n8n)
  function safeDecode(v){
    if (v == null) return '';
    var s = String(v).replace(/\+/g, ' ');
    try {
      return decodeURIComponent(s);
    } catch (e) {
      return s; // se quebrar, devolve como veio
    }
  }

  // lê utms padrão a partir de cookies
  function collectUtms(){
    var utms = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'];
    var out = {}, v, i;
    for (i=0;i<utms.length;i++){
      v = getCookie(utms[i]);
      if (v) out[utms[i]] = v;
    }
    return out;
  }

  function getEventIdFromWindow(){
    try {
      if (window.__page_event_id && typeof window.__page_event_id === 'string') {
        return window.__page_event_id;
      }
    } catch(e){}
    return '';
  }

  function collectParams(){
    var p = {}, v;

    // UTM cookies
    var utmObj = collectUtms();
    for (var k in utmObj){ if (utmObj.hasOwnProperty(k)) p[k] = utmObj[k]; }

    // Click IDs (normaliza __* -> sem __)
    v = getCookie('gclid')  || getCookie('__gclid');  if (v) p.gclid  = v;
    v = getCookie('gbraid') || getCookie('__gbraid'); if (v) p.gbraid = v;
    v = getCookie('wbraid') || getCookie('__wbraid'); if (v) p.wbraid = v;

    // Meta IDs
    v = getCookie('fbclid'); if (v) p.fbclid = v;
    v = getCookie('_fbc');   if (v) p.fbc    = v;
    v = getCookie('_fbp');   if (v) p.fbp    = v;

    // External ID (aceita ambos)
    v = getCookie('external_id') || getCookie('_external_id');
    if (v) p.external_id = v;

    // event_id vindo do GTM/HTML (window.__page_event_id) — não cria, só lê
    v = getEventIdFromWindow();
    if (v) p.event_id = v;

    return p;
  }

  // monta query **decodificada** (sem encodeURIComponent em chave/valor)
  function toQuery(params){
    var pairs = [];
    for (var key in params){
      if (!params.hasOwnProperty(key)) continue;
      var val = params[key];
      if (val !== undefined && val !== null && val !== '') {
        // aplica safeDecode em CADA valor individual
        pairs.push(key + '=' + safeDecode(String(val)));
      }
    }
    return pairs.join('&');
  }

  // ===== Seleciona TODOS os inputs "Fonte" (página + popups) =====
  function findFonteInputs(){
    var list = [];
    try {
      // 1) pelo id padrão
      var byId = document.querySelectorAll('#' + CSS.escape(FIELD_ID));
      if (byId && byId.length) list = list.concat([].slice.call(byId));

      // 2) pelo name padrão do Elementor (form_fields[fonte])
      var byName = document.querySelectorAll('input[name="form_fields[fonte]"], textarea[name="form_fields[fonte]"]');
      if (byName && byName.length) list = list.concat([].slice.call(byName));

      // 3) pelo sufixo do name (caso o form renomeie com prefixos)
      var byNameSuffix = document.querySelectorAll('input[name$="[fonte]"], textarea[name$="[fonte]"]');
      if (byNameSuffix && byNameSuffix.length) list = list.concat([].slice.call(byNameSuffix));

      // 4) por atributo data-field-shortcode (algumas versões/temas)
      var byShortcode = document.querySelectorAll('[data-field-shortcode="fonte"]');
      if (byShortcode && byShortcode.length) list = list.concat([].slice.call(byShortcode));

      // Remove duplicados
      var seen = new Set();
      list = list.filter(function(el){
        if (!el || !el.nodeType) return false;
        if (seen.has(el)) return false;
        seen.add(el);
        return true;
      });
    } catch(e){}
    return list;
  }

  // Aplica em TODOS os campos "Fonte": preserva prefixo (antes de '?') e substitui a query inteira (já decodificada)
  function applyWith(params){
    var inputs = findFonteInputs();
    var qs = toQuery(params);
    var hasEventId = !!params.event_id;
    var hasAny = !!qs;

    if (!inputs.length) return { hasAny: hasAny, hasEventId: hasEventId, updated: 0 };

    var updated = 0;
    for (var i=0;i<inputs.length;i++){
      var el = inputs[i];
      var base = String(el.value || '');
      var qpos = base.indexOf('?');
      var prefix = qpos === -1 ? base : base.slice(0, qpos);
      var newVal = prefix + (qs ? '?' + qs : '');
      if (el.value !== newVal){
        el.value = newVal;
        updated++;
        try {
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } catch(e){}
      }
    }

    return { hasAny: hasAny, hasEventId: hasEventId, updated: updated };
  }

  function runWithRetries(){
    var tries = 0;

    function tick(){
      var params = collectParams();
      var flags = applyWith(params);
      tries++;

      var shouldStop = flags.hasEventId || tries >= MAX_TRIES;
      if (!shouldStop){
        setTimeout(tick, INTERVAL_MS);
      }
    }

    // Reaplica quando o GTM/HTML empurrar 'page_event_id_ready'
    try {
      window.dataLayer = window.dataLayer || [];
      var origPush = window.dataLayer.push;
      window.dataLayer.push = function(){
        var res = origPush.apply(this, arguments);
        try {
          var arg = arguments[0] || {};
          if (arg && arg.event === 'page_event_id_ready') {
            var params = collectParams();
            applyWith(params);
          }
        } catch(e){}
        return res;
      };
    } catch(e){}

    // Reaplica quando o Elementor abrir popup
    try {
      if (window.jQuery) {
        window.jQuery(window).on('elementor/popup/show', function(){
          var params = collectParams();
          applyWith(params);
        });
      }
      document.addEventListener('elementor/popup/show', function(){
        var params = collectParams();
        applyWith(params);
      }, true);
    } catch(e){}

    // Fallback: observar mutações de DOM (inserção do popup)
    try {
      var mo = new MutationObserver(function(){
        var params = collectParams();
        applyWith(params);
      });
      mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
      setTimeout(function(){ try{ mo.disconnect(); }catch(e){} }, 20000);
    } catch(e){}

    tick();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', runWithRetries);
  } else {
    runWithRetries();
  }
})();

// Lazyload backgrounds for Elementor containers
const lazyloadRunObserver = () => {
  const lazyloadBackgrounds = document.querySelectorAll( `.e-con.e-parent:not(.e-lazyloaded)` );
  const lazyloadBackgroundObserver = new IntersectionObserver( ( entries ) => {
    entries.forEach( ( entry ) => {
      if ( entry.isIntersecting ) {
        let lazyloadBackground = entry.target;
        if( lazyloadBackground ) {
          lazyloadBackground.classList.add( 'e-lazyloaded' );
        }
        lazyloadBackgroundObserver.unobserve( entry.target );
      }
    });
  }, { rootMargin: '200px 0px 200px 0px' } );
  lazyloadBackgrounds.forEach( ( lazyloadBackground ) => {
    lazyloadBackgroundObserver.observe( lazyloadBackground );
  } );
};
const events = [
  'DOMContentLoaded',
  'elementor/lazyload/observe',
];
events.forEach( ( event ) => {
  document.addEventListener( event, lazyloadRunObserver );
} );

// Elementor Frontend Configuration Mock
try {
  window.elementorFrontendConfig = {"environmentMode":{"edit":false,"wpPreview":false,"isScriptDebug":false},"i18n":{"shareOnFacebook":"Compartilhar no Facebook","shareOnTwitter":"Compartilhar no Twitter","pinIt":"Fixar","download":"Baixar","downloadImage":"Baixar imagem","fullscreen":"Tela cheia","zoom":"Zoom","share":"Compartilhar","playVideo":"Reproduzir v\u00eddeo","previous":"Anterior","next":"Pr\u00f3ximo","close":"Fechar","a11yCarouselPrevSlideMessage":"Slide anterior","a11yCarouselNextSlideMessage":"Pr\u00f3ximo slide","a11yCarouselFirstSlideMessage":"Este \u00e9 o primeiro slide","a11yCarouselLastSlideMessage":"Este \u00e9 o \u00faltimo slide","a11yCarouselPaginationBulletMessage":"Ir para o slide"},"is_rtl":false,"breakpoints":{"xs":0,"sm":480,"md":768,"lg":1025,"xl":1440,"xxl":1600},"responsive":{"breakpoints":{"mobile":{"label":"Dispositivos m\u00f3veis no modo retrato","value":767,"default_value":767,"direction":"max","is_enabled":true},"mobile_extra":{"label":"Dispositivos m\u00f3veis no modo paisagem","value":880,"default_value":880,"direction":"max","is_enabled":false},"tablet":{"label":"Tablet no modo retrato","value":1024,"default_value":1024,"direction":"max","is_enabled":true},"tablet_extra":{"label":"Tablet no modo paisagem","value":1200,"default_value":1200,"direction":"max","is_enabled":false},"laptop":{"label":"Notebook","value":1366,"default_value":1366,"direction":"max","is_enabled":false},"widescreen":{"label":"Tela ampla (widescreen)","value":2400,"default_value":2400,"direction":"min","is_enabled":false}},"hasCustomBreakpoints":false},"version":"4.0.6","is_static":false,"experimentalFeatures":{"e_font_icon_svg":true,"additional_custom_breakpoints":true,"container":true,"e_optimized_markup":true,"theme_builder_v2":true,"hello-theme-header-footer":true,"e_pro_free_trial_popup":true,"nested-elements":true,"global_classes_should_enforce_capabilities":true,"e_variables":true,"e_opt_in_v4_page":true,"e_components":true,"e_interactions":true,"e_widget_creation":true,"import-export-customization":true,"mega-menu":true,"e_pro_variables":true},"urls":{"assets":"https:\/\/eventos.multiplaeventos.com.br\/wp-content\/plugins\/elementor\/assets\/","ajaxurl":"https:\/\/eventos.multiplaeventos.com.br\/wp-admin\/admin-ajax.php","uploadUrl":"https:\/\/eventos.multiplaeventos.com.br\/wp-content\/uploads"},"nonces":{"floatingButtonsClickTracking":"18e21ed314","atomicFormsSendForm":"7fe79b2f08"},"swiperClass":"swiper","settings":{"page":[],"editorPreferences":[]},"kit":{"active_breakpoints":["viewport_mobile","viewport_tablet"],"global_image_lightbox":"yes","lightbox_enable_counter":"yes","lightbox_enable_fullscreen":"yes","lightbox_enable_zoom":"yes","lightbox_enable_share":"yes","lightbox_title_src":"title","lightbox_description_src":"description","hello_header_logo_type":"title","hello_footer_logo_type":"logo"},"post":{"id":952,"title":"Debutantes%20v1%20-%20Multipla%20Eventos","excerpt":"","featuredImage":false}};
} catch (e) {}

try {
  wp.i18n.setLocaleData( { 'text direction\u0004ltr': [ 'ltr' ] } );
} catch (e) {}

try {
  window.ElementorProFrontendConfig = {"ajaxurl":"https:\/\/eventos.multiplaeventos.com.br\/wp-admin\/admin-ajax.php","nonce":"b8717714c6","urls":{"assets":"https:\/\/eventos.multiplaeventos.com.br\/wp-content\/plugins\/elementor-pro\/assets\/","rest":"https:\/\/eventos.multiplaeventos.com.br\/wp-json\/"},"settings":{"lazy_load_background_images":true},"popup":{"hasPopUps":true},"shareButtonsNetworks":{"facebook":{"title":"Facebook","has_counter":true},"twitter":{"title":"Twitter"},"linkedin":{"title":"LinkedIn","has_counter":true},"pinterest":{"title":"Pinterest","has_counter":true},"reddit":{"title":"Reddit","has_counter":true},"vk":{"title":"VK","has_counter":true},"odnoklassniki":{"title":"OK","has_counter":true},"tumblr":{"title":"Tumblr"},"digg":{"title":"Digg"},"skype":{"title":"Skype"},"stumbleupon":{"title":"StumbleUpon","has_counter":true},"mix":{"title":"Mix"},"telegram":{"title":"Telegram"},"pocket":{"title":"Pocket","has_counter":true},"xing":{"title":"XING","has_counter":true},"whatsapp":{"title":"WhatsApp"},"email":{"title":"Email"},"print":{"title":"Print"},"x-twitter":{"title":"X"},"threads":{"title":"Threads"}},"facebook_sdk":{"lang":"pt_BR","app_id":""},"lottie":{"defaultAnimationUrl":"https:\/\/eventos.multiplaeventos.com.br\/wp-content\/plugins\/elementor-pro\/modules\/lottie\/assets\/animations\/default.json"}};
} catch (e) {}

// Phone numbers validation & mask formatting helper
(function() {
  function aplicarMascaraTelefone(valor) {
    valor = valor.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.slice(0, 11);
    if (valor.length > 10) {
      return '(' + valor.slice(0, 2) + ') ' + valor.slice(2, 7) + '-' + valor.slice(7);
    } else if (valor.length > 6) {
      return '(' + valor.slice(0, 2) + ') ' + valor.slice(2, 6) + '-' + valor.slice(6);
    } else if (valor.length > 2) {
      return '(' + valor.slice(0, 2) + ') ' + valor.slice(2);
    }
    return valor;
  }

  function validarTelefone(campo) {
    if (!campo) return false;
    const digitos = campo.value.replace(/\D/g, '');
    const tamanhoCorreto = digitos.length === 11;
    const nonoDigitoCorreto = digitos.charAt(2) === '9';
    return tamanhoCorreto && nonoDigitoCorreto;
  }

  function gerenciarMensagemErro(campo, mostrar) {
    const fieldGroup = campo.closest('.elementor-field-group') || campo.parentElement;
    if (!fieldGroup) return;

    let errorSpan = fieldGroup.querySelector('.telefone-erro-msg');
    if (!errorSpan) {
      errorSpan = document.createElement('span');
      errorSpan.className = 'telefone-erro-msg';
      errorSpan.style.color = '#C0392B';
      errorSpan.style.fontSize = '12px';
      errorSpan.style.display = 'block';
      errorSpan.style.marginTop = '5px';
      fieldGroup.appendChild(errorSpan);
    }

    if (mostrar) {
      errorSpan.textContent = 'Por favor, insira um celular válido com 11 dígitos (DDD + 9...).';
      campo.style.border = '1px solid #C0392B';
    } else {
      errorSpan.textContent = '';
      campo.style.border = '';
    }
  }

  function buscarEaplicarEventos() {
    const camposTelefone = document.querySelectorAll('input[name="form_fields[telefone]"]');
    if (camposTelefone.length === 0) return;

    camposTelefone.forEach(function(campo) {
      if (!campo.dataset.maskAttached) {
        campo.addEventListener('input', function(e) {
          e.target.value = aplicarMascaraTelefone(e.target.value);
          if (validarTelefone(e.target)) {
            gerenciarMensagemErro(e.target, false);
          }
        });
        campo.dataset.maskAttached = 'true';
      }

      const form = campo.closest('form');
      if (!form) return;
      
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton && !submitButton.dataset.validationClickAttached) {
        submitButton.addEventListener('click', function(e) {
          const campoTelefoneNoForm = form.querySelector('input[name="form_fields[telefone]"]');
          if (campoTelefoneNoForm && !validarTelefone(campoTelefoneNoForm)) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            gerenciarMensagemErro(campoTelefoneNoForm, true);
          } else if (campoTelefoneNoForm) {
            gerenciarMensagemErro(campoTelefoneNoForm, false);
          }
        }, true);
        submitButton.dataset.validationClickAttached = 'true';
      }
    });
  }

  setInterval(buscarEaplicarEventos, 500);
})();

// UTM and click tracking integration
(function(){
  function l(a){return(a=(new RegExp("[?\\x26]"+a+"\\x3d([^\\x26#]*)")).exec(location.search))?decodeURIComponent(a[1].replace(/\\+/g," ")):null}
  function h(a){var d="; "+document.cookie;a=d.split("; "+a+"\\x3d");return a.length===2?decodeURIComponent(a.pop().split(";").shift()):null}
  function k(a,d,b,e){if(d){var c="";b&&(c=new Date,c.setTime(c.getTime()+b*864E5),c="; expires\\x3d"+c.toUTCString());b=e?"; domain\\x3d"+e:"";e=location.protocol==="https:"?"; Secure":"";document.cookie=a+"\\x3d"+encodeURIComponent(d)+c+"; path\\x3d/"+b+"; SameSite\\x3dLax"+e}}
  function m(){var a=location.hostname;if(/^\d+\.\d+\.\d+\.\d+$/.test(a)||a==="localhost")return null;a=a.replace(/^www\./,"");a=a.split(".");for(var d=2;d<=a.length;d++){var b="."+a.slice(a.length-d).join(".");try{k("__fbc_test","1",1,b);var e=h("__fbc_test")==="1",c="__fbc_test\\x3d; expires\\x3dThu, 01 Jan 1970 00:00:00 GMT; path\\x3d/; SameSite\\x3dLax";b&&(c+="; domain\\x3d"+b);document.cookie=c;if(e)return b}catch(n){}}return null}
  var f=h("_fbc");if(!f){var g=l("fbclid");g&&(f=(new Date).getTime(),f="fb.1."+f+"."+g,g=m(),k("_fbc",f,90,g))}window._fbc=f;
})();

(function(){
  function b(){return Math.floor((1+Math.random())*65536).toString(16).substring(1)}
  function h(a){var c="; "+document.cookie;a=c.split("; "+a+"\\x3d");return a.length===2?decodeURIComponent(a.pop().split(";").shift()):null}
  function k(a,c,d,f){var e=new Date;e.setTime(e.getTime()+d*24*60*60*1E3);a=a+"\\x3d"+encodeURIComponent(c)+"; expires\\x3d"+e.toUTCString()+"; path\\x3d/; SameSite\\x3dLax";f&&(a+="; domain\\x3d"+f);document.cookie=a}
  function m(){var a=location.hostname;if(/^\d+\.\d+\.\d+\.\d+$/.test(a)||a==="localhost")return null;a=a.replace(/^www\./,"");a=a.split(".");for(var c=2;c<=a.length;c++){var d="."+a.slice(a.length-c).join(".");try{k("__rd_test","1",1,d);var f=h("__rd_test")==="1",e="__rd_test\\x3d; expires\\x3dThu, 01 Jan 1970 00:00:00 GMT; path\\x3d/; SameSite\\x3dLax";d&&(e+="; domain\\x3d"+d);document.cookie=e;if(f)return d}catch(p){}}return null}
  var l="_external_id",g=h(l);if(!g){g=b()+b()+"-"+b()+"-"+b()+"-"+b()+"-"+b()+b()+b();var n=m();k(l,g,730,n)}window.__external_id=g;
})();

(function(){
  function k(a){a=new RegExp("[?\\x26]"+a+"\\x3d([^\\x26#]*)");return(a=a.exec(window.location.search))?decodeURIComponent(a[1].replace(/\\+/g," ")):null}
  function l(){var a=window.location.hostname;if(a==="localhost"||/^\d+\.\d+\.\d+\.\d+$/.test(a))return null;a=a.replace(/^www\./,"");a=a.split(".");var d=a[a.length-1],b=a[a.length-2];return d.length===2&&b.length<=3&&a.length>=3?"."+a.slice(-3).join("."):"."+a.slice(-2).join(".")}
  function m(a,d,b,e){if(d){var c="";b&&(c=new Date,c.setTime(c.getTime()+b*864E5),c="; expires\\x3d"+c.toUTCString());b=e?"; domain\\x3d"+e:"";e=location.protocol==="https:"?"; Secure":"";document.cookie=a+"\\x3d"+encodeURIComponent(d)+c+"; path\\x3d/"+b+"; SameSite\\x3dLax"+e}}
  for(var g="utm_source utm_medium utm_campaign utm_term utm_content fbclid".split(" "),n=l(),f=0;f<g.length;f++){var h=g[f],p=k(h);m(h,p,90,n);};
})();

(function(){
  function l(a){var b=window.location.search;a=new RegExp("(?:[?\\x26])"+a.replace(/[[\]]/g,"\\\\$\\x26")+"\\x3d([^\\x26#]*)","i");return(b=a.exec(b))?decodeURIComponent((b[1]+"").replace(/\\+/g," ")):null}
  function m(){var a=window.location.hostname;if(a==="localhost"||/^\\d{1,3}(\\.\\d{1,3}){3}$/.test(a)||a.split(".").length<2)return"";a=a.split(".");var b=a[a.length-1],c=a[a.length-2];return b.length===2&&c.length<=3&&a.length>=3?"."+a.slice(-3).join("."):"."+a.slice(-2).join(".")}
  function n(a,b,c,e){var d="";c&&(d=new Date,d.setTime(d.getTime()+c*864E5),d="; expires\\x3d"+d.toUTCString());c=e?"; domain\\x3d"+e:"";e=window.location.protocol==="https:"?"; Secure":"";document.cookie=a+"\\x3d"+encodeURIComponent(b)+d+"; path\\x3d/"+c+"; SameSite\\x3dLax"+e}
  for(var g=["gclid","gbraid","wbraid"],p="__",q=90,r=m(),f=0;f<g.length;f++){var h=g[f],k=l(h);k&&n(p+h,k,q,r);};
})();

(function(){try{if(!window.__page_event_id||typeof window.__page_event_id!=="string"){var b=Date.now(),c=Math.floor(Math.random()*9E5)+1E5,a=String(b)+String(c);window.__page_event_id=a;window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:"page_event_id_ready",page_event_id:a})}}catch(d){}})();