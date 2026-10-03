(function(){
  function initSearch(){
    document.querySelectorAll('.header-search').forEach(function(form,index){
      if(form.dataset.predictiveInitialized) return;
      var input=form.querySelector('input[name="q"]');
      if(!input) return;
      form.dataset.predictiveInitialized='true';
      form.setAttribute('autocomplete','off');
      input.setAttribute('role','combobox');
      input.setAttribute('aria-autocomplete','list');
      input.setAttribute('aria-expanded','false');
      input.setAttribute('aria-controls','EdenRosePredictiveSearch-'+index);
      var panel=document.createElement('div');
      panel.id='EdenRosePredictiveSearch-'+index;
      panel.className='edenrose-predictive-search';
      panel.setAttribute('role','listbox');
      panel.hidden=true;
      form.appendChild(panel);
      var timer=null, controller=null;
      function close(){panel.hidden=true;input.setAttribute('aria-expanded','false');}
      function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
      var currency=form.dataset.currency||'USD', formatter=null;
      try{formatter=new Intl.NumberFormat(document.documentElement.lang||'en',{style:'currency',currency:currency});}catch(e){}
      // Predictive search returns prices as decimal strings (e.g. "24.90"), not cents.
      function money(value){var n=parseFloat(value)||0;return formatter?formatter.format(n):n.toFixed(2);}
      var labels={products:form.dataset.labelProducts||'Products',collections:form.dataset.labelCollections||'Collections',searchFor:form.dataset.labelSearchFor||'Search for “__TERMS__” →'};
      function render(data,term){
        var products=(data.resources&&data.resources.results&&data.resources.results.products)||[];
        var collections=(data.resources&&data.resources.results&&data.resources.results.collections)||[];
        if(!products.length&&!collections.length){close();return;}
        var html='<div class="edenrose-predictive-inner">';
        if(products.length){html+='<div class="edenrose-predictive-heading">'+esc(labels.products)+'</div><div class="edenrose-predictive-products">';products.slice(0,6).forEach(function(p){var img=p.image?'<img src="'+esc(p.image)+(p.image.indexOf('?')>-1?'&':'?')+'width=120" alt="" width="52" height="64" loading="lazy">':'';html+='<a role="option" href="'+esc(p.url)+'" class="edenrose-predictive-product">'+img+'<span><strong>'+esc(p.title)+'</strong><small>'+money(p.price)+'</small></span></a>';});html+='</div>';}
        if(collections.length){html+='<div class="edenrose-predictive-heading">'+esc(labels.collections)+'</div><div class="edenrose-predictive-collections">';collections.slice(0,3).forEach(function(c){html+='<a role="option" href="'+esc(c.url)+'">'+esc(c.title)+'</a>';});html+='</div>';}
        html+='<a class="edenrose-predictive-more" href="'+esc(form.getAttribute('action')||'/search')+'?q='+encodeURIComponent(term)+'">'+esc(labels.searchFor).replace('__TERMS__',esc(term))+'</a></div>';
        panel.innerHTML=html;panel.hidden=false;input.setAttribute('aria-expanded','true');
      }
      function search(){
        var term=input.value.trim();
        if(term.length<2){close();return;}
        if(controller) controller.abort();
        controller=new AbortController();
        fetch((form.dataset.suggestUrl||'/search/suggest.json')+'?q='+encodeURIComponent(term)+'&resources[type]=product,collection&resources[limit]=6&resources[limit_scope]=each',{signal:controller.signal,headers:{Accept:'application/json'}})
          .then(function(r){if(!r.ok)throw new Error('search');return r.json()})
          .then(function(data){render(data,term)})
          .catch(function(e){if(e.name!=='AbortError')close()});
      }
      input.addEventListener('input',function(){clearTimeout(timer);timer=setTimeout(search,300)});
      input.addEventListener('focus',function(){clearTimeout(timer);if(input.value.trim().length>=2)search()});
      form.addEventListener('submit',function(){clearTimeout(timer);if(controller)controller.abort();});
    });

    if(!document.documentElement.dataset.edenroseSearchDismissBound){
      document.documentElement.dataset.edenroseSearchDismissBound='true';
      document.addEventListener('click',function(e){
        document.querySelectorAll('.header-search').forEach(function(form){
          if(!form.contains(e.target)){
            var panel=form.querySelector('.edenrose-predictive-search');
            var input=form.querySelector('input[name="q"]');
            if(panel&&input){panel.hidden=true;input.setAttribute('aria-expanded','false');}
          }
        });
      });
      document.addEventListener('keydown',function(e){
        if(e.key!=='Escape')return;
        document.querySelectorAll('.edenrose-predictive-search').forEach(function(panel){
          panel.hidden=true;
          var input=panel.parentElement&&panel.parentElement.querySelector('input[name="q"]');
          if(input)input.setAttribute('aria-expanded','false');
        });
      });
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initSearch,{once:true});else initSearch();
})();