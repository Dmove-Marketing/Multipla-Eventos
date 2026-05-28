/* Scripts extraídos de corporativo.html - Limpos de erros de sintaxe */

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

try {
  window.elementorFrontendConfig = {"environmentMode":{"edit":false,"wpPreview":false,"isScriptDebug":false},"i18n":{"shareOnFacebook":"Compartilhar no Facebook","shareOnTwitter":"Compartilhar no Twitter","pinIt":"Fixar","download":"Baixar","downloadImage":"Baixar imagem","fullscreen":"Tela cheia","zoom":"Zoom","share":"Compartilhar","playVideo":"Reproduzir v\u00eddeo","previous":"Anterior","next":"Pr\u00f3ximo","close":"Fechar","a11yCarouselPrevSlideMessage":"Slide anterior","a11yCarouselNextSlideMessage":"Pr\u00f3ximo slide","a11yCarouselFirstSlideMessage":"Este \u00e9 o primeiro slide","a11yCarouselLastSlideMessage":"Este \u00e9 o \u00faltimo slide","a11yCarouselPaginationBulletMessage":"Ir para o slide"},"is_rtl":false,"breakpoints":{"xs":0,"sm":480,"md":768,"lg":1025,"xl":1440,"xxl":1600},"responsive":{"breakpoints":{"mobile":{"label":"Dispositivos m\u00f3veis no modo retrato","value":767,"default_value":767,"direction":"max","is_enabled":true},"mobile_extra":{"label":"Dispositivos m\u00f3veis no modo paisagem","value":880,"default_value":880,"direction":"max","is_enabled":false},"tablet":{"label":"Tablet no modo retrato","value":1024,"default_value":1024,"direction":"max","is_enabled":true},"tablet_extra":{"label":"Tablet no modo paisagem","value":1200,"default_value":1200,"direction":"max","is_enabled":false},"laptop":{"label":"Notebook","value":1366,"default_value":1366,"direction":"max","is_enabled":false},"widescreen":{"label":"Tela ampla (widescreen)","value":2400,"default_value":2400,"direction":"min","is_enabled":false}},"hasCustomBreakpoints":false},"version":"4.0.6","is_static":false,"experimentalFeatures":{"e_font_icon_svg":true,"additional_custom_breakpoints":true,"container":true,"e_optimized_markup":true,"theme_builder_v2":true,"hello-theme-header-footer":true,"e_pro_free_trial_popup":true,"nested-elements":true,"global_classes_should_enforce_capabilities":true,"e_variables":true,"e_opt_in_v4_page":true,"e_components":true,"e_interactions":true,"e_widget_creation":true,"import-export-customization":true,"mega-menu":true,"e_pro_variables":true},"urls":{"assets":"https:\/\/eventos.multiplaeventos.com.br\/wp-content\/plugins\/elementor\/assets\/","ajaxurl":"https:\/\/eventos.multiplaeventos.com.br\/wp-admin\/admin-ajax.php","uploadUrl":"https:\/\/eventos.multiplaeventos.com.br\/wp-content\/uploads"},"nonces":{"floatingButtonsClickTracking":"ac42b8738e","atomicFormsSendForm":"9881b308bf"},"swiperClass":"swiper","settings":{"page":[],"editorPreferences":[]},"kit":{"active_breakpoints":["viewport_mobile","viewport_tablet"],"global_image_lightbox":"yes","lightbox_enable_counter":"yes","lightbox_enable_fullscreen":"yes","lightbox_enable_zoom":"yes","lightbox_enable_share":"yes","lightbox_title_src":"title","lightbox_description_src":"description","hello_header_logo_type":"title","hello_footer_logo_type":"logo"},"post":{"id":9,"title":"Corporativo%20-%20Multipla%20Eventos","excerpt":"","featuredImage":false}};
} catch (e) {}

try {
  wp.i18n.setLocaleData( { 'text direction\u0004ltr': [ 'ltr' ] } );
} catch (e) {}

try {
  window.ElementorProFrontendConfig = {"ajaxurl":"https:\/\/eventos.multiplaeventos.com.br\/wp-admin\/admin-ajax.php","nonce":"7a541f4501","urls":{"assets":"https:\/\/eventos.multiplaeventos.com.br\/wp-content\/plugins\/elementor-pro\/assets\/","rest":"https:\/\/eventos.multiplaeventos.com.br\/wp-json\/"},"settings":{"lazy_load_background_images":true},"popup":{"hasPopUps":true},"shareButtonsNetworks":{"facebook":{"title":"Facebook","has_counter":true},"twitter":{"title":"Twitter"},"linkedin":{"title":"LinkedIn","has_counter":true},"pinterest":{"title":"Pinterest","has_counter":true},"reddit":{"title":"Reddit","has_counter":true},"vk":{"title":"VK","has_counter":true},"odnoklassniki":{"title":"OK","has_counter":true},"tumblr":{"title":"Tumblr"},"digg":{"title":"Digg"},"skype":{"title":"Skype"},"stumbleupon":{"title":"StumbleUpon","has_counter":true},"mix":{"title":"Mix"},"telegram":{"title":"Telegram"},"pocket":{"title":"Pocket","has_counter":true},"xing":{"title":"XING","has_counter":true},"whatsapp":{"title":"WhatsApp"},"email":{"title":"Email"},"print":{"title":"Print"},"x-twitter":{"title":"X"},"threads":{"title":"Threads"}},"facebook_sdk":{"lang":"pt_BR","app_id":""},"lottie":{"defaultAnimationUrl":"https:\/\/eventos.multiplaeventos.com.br\/wp-content\/plugins\/elementor-pro\/modules\/lottie\/assets\/animations\/default.json"}};
} catch (e) {}

// Removed wp-emoji-loader and duplicate flatpickr calendar scripts since flatpickr is handled natively in Astro component