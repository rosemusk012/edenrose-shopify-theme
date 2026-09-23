(function(){
  function initSearch(){
    document.querySelectorAll('.header-search').forEach(function(form){
      if(form.dataset.predictiveInitialized) return;
      var input=form.querySelector('input[name="q"]');
      if(!input) return;
      form.dataset.predictiveInitialized='true';
      form.setAttribute('autocomplete','off');
      input.setAttribute('role','combobox');
      input.setAttribute('aria-autocomplete','list');
      input.setAttribute('aria-expanded','false');
      input.setAttribute('aria-controls','EdenRosePredictiveSearch');
      var panel=document.createElement('div');
      panel.id='EdenRosePredictiveSearch';
      panel.className='edenrose-predictive-search';
      panel.setAttribute('role','listbox');
      panel.hidden=true;
      form.appendChild(panel);
      var timer=null, controller=null;
      function close(){panel.hidden=true;input.setAttribute('aria-expanded','false');}
      function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
      function money(cents){return new Intl.NumberFormat(document.documentElement.lang||'en-AU',{style:'currency',currency:'{{ shop.currency }}'}).format((cents||0)/100)}
      function render(data,term){
        var products=(data.resources&&data.resources.results&&data.resources.results.products)||[];
        var collections=(data.resources&&data.resources.results&&data.resources.results.collections)||[];
        if(!products.length&&!collections.length){close();return;}
        var html='<div class="edenrose-predictive-inner">';
        if(products.length){html+='<div class="edenrose-predictive-heading">Products</div><div class="edenrose-predictive-products">';products.slice(0,6).forEach(function(p){var img=p.image?'<img src="'+esc(p.image)+'" alt="" loading="lazy">':'';html+='<a role="option" href="'+esc(p.url)+'" class="edenrose-predictive-product">'+img+'<span><strong>'+esc(p.title)+'</strong><small>'+money(p.price)+'</small></span></a>';});html+='</div>';}
        if(collections.length){html+='<div class="edenrose-predictive-heading">Collections</div><div class="edenrose-predictive-collections">';collections.slice(0,3).forEach(function(c){html+='<a role="option" href="'+esc(c.url)+'">'+esc(c.title)+'</a>';});html+='</div>';}
        html+='<a class="edenrose-predictive-more" href="{{ routes.search_url }}?q='+encodeURIComponent(term)+'">Search for “'+esc(term)+'” →</a></div>';
        panel.innerHTML=html;panel.hidden=false;input.setAttribute('aria-expanded','true');
      }
      function search(){
        var term=input.value.trim();
        if(term.length<2){close();return;}
        if(controller) controller.abort();
        controller=new AbortController();
        fetch('{{ routes.predictive_search_url }}?q='+encodeURIComponent(term)+'&resources[type]=product,collection&resources[limit]=8&resources[limit_scope]=each',{signal:controller.signal,headers:{Accept:'application/json'}})
          .then(function(r){if(!r.ok)throw new Error('search');return r.json()})
          .then(function(data){render(data,term)})
          .catch(function(e){if(e.name!=='AbortError')close()});
      }
      input.addEventListener('input',function(){clearTimeout(timer);timer=setTimeout(search,220)});
      input.addEventListener('focus',function(){if(input.value.trim().length>=2)search()});
      document.addEventListener('click',function(e){if(!form.contains(e.target))close()});
      document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initSearch);else initSearch();
})();\n.header-search{position:relative}.edenrose-predictive-search{position:absolute;top:calc(100% + 8px);right:0;width:min(520px,calc(100vw - 32px));max-height:min(70vh,560px);overflow:auto;background:var(--paper);border:1px solid var(--line);box-shadow:0 18px 45px rgba(33,26,27,.16);z-index:2147483647}.edenrose-predictive-search[hidden]{display:none}.edenrose-predictive-inner{padding:1rem}.edenrose-predictive-heading{font-size:.62rem;text-transform:uppercase;letter-spacing:.14em;color:var(--muted);padding:.25rem 0 .55rem}.edenrose-predictive-products{display:grid;gap:.35rem}.edenrose-predictive-product{display:grid;grid-template-columns:52px minmax(0,1fr);gap:.75rem;align-items:center;padding:.45rem;text-decoration:none;border-radius:8px}.edenrose-predictive-product:hover,.edenrose-predictive-product:focus-visible{background:var(--soft)}.edenrose-predictive-product img{width:52px;height:64px;object-fit:cover;background:var(--soft)}.edenrose-predictive-product span{display:grid;gap:.18rem;min-width:0}.edenrose-predictive-product strong{font-size:.82rem;line-height:1.3}.edenrose-predictive-product small{font-size:.75rem;color:var(--muted)}.edenrose-predictive-collections{display:flex;flex-wrap:wrap;gap:.45rem;margin-bottom:.8rem}.edenrose-predictive-collections a{padding:.45rem .65rem;border:1px solid var(--line);border-radius:999px;font-size:.72rem}.edenrose-predictive-more{display:block;border-top:1px solid var(--line);margin-top:.65rem;padding:.85rem .25rem .15rem;font-size:.78rem;text-decoration:underline;text-underline-offset:3px}@media(max-width:900px){.header-search{display:none}.mobile-search-link{display:inline-flex}.edenrose-predictive-search{position:fixed;top:calc(var(--edenrose-mobile-nav-top,82px) + 8px);left:16px;right:16px;width:auto;max-width:none}}
