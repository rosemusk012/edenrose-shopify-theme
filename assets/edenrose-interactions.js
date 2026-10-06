(function(){
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  ready(function(){
    document.querySelectorAll('[data-carousel]').forEach(function(carousel){
      var track=carousel.querySelector('[data-carousel-track]');
      var prev=carousel.querySelector('[data-carousel-prev]');
      var next=carousel.querySelector('[data-carousel-next]');
      if(!track)return;
      var step=function(){return Math.max(track.clientWidth*.72,240);};
      function update(){
        var max=Math.max(0,track.scrollWidth-track.clientWidth-2);
        if(prev)prev.disabled=track.scrollLeft<=2;
        if(next)next.disabled=track.scrollLeft>=max;
      }
      if(prev)prev.addEventListener('click',function(){track.scrollBy({left:-step(),behavior:'smooth'});});
      if(next)next.addEventListener('click',function(){track.scrollBy({left:step(),behavior:'smooth'});});
      track.addEventListener('scroll',update,{passive:true});
      window.addEventListener('resize',update,{passive:true});
      update();
    });

    var progress=document.querySelector('[data-scroll-progress]');
    function progressUpdate(){
      if(!progress)return;
      var max=document.documentElement.scrollHeight-window.innerHeight;
      progress.style.transform='scaleX('+(max>0?Math.min(1,Math.max(0,window.scrollY/max)):0)+')';
    }
    if(progress){window.addEventListener('scroll',progressUpdate,{passive:true});window.addEventListener('resize',progressUpdate,{passive:true});progressUpdate();}

    if(!document.documentElement.dataset.quickViewBound){
      document.documentElement.dataset.quickViewBound='true';
      var drawer=document.createElement('aside');
      drawer.className='edenrose-quick-view';
      drawer.hidden=true;
      drawer.innerHTML='<div class="quick-view-overlay" data-qv-close></div><div class="quick-view-panel" role="dialog" aria-modal="true" aria-label="Quick view"><button type="button" class="quick-view-close" data-qv-close aria-label="Close">×</button><div class="quick-view-content"></div></div>';
      document.body.appendChild(drawer);
      var qvContent=drawer.querySelector('.quick-view-content'), lastFocus=null;
      function focusables(){
        return Array.prototype.slice.call(drawer.querySelectorAll('button:not([disabled]),a[href],select,input:not([disabled])'));
      }
      function esc(s){return String(s||'').replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]});}
      function money(c){return new Intl.NumberFormat(document.documentElement.lang||'en-AU',{style:'currency',currency:(window.EdenRoseConfig&&window.EdenRoseConfig.currency)||'AUD'}).format((c||0)/100);}
      function closeQv(){drawer.hidden=true;document.body.classList.remove('quick-view-open');if(lastFocus)lastFocus.focus();}
      drawer.addEventListener('click',function(e){if(e.target.closest('[data-qv-close]'))closeQv();});
      document.addEventListener('keydown',function(e){
        if(drawer.hidden)return;
        if(e.key==='Escape'){closeQv();return;}
        if(e.key==='Tab'){
          var items=focusables();if(!items.length)return;
          var first=items[0],last=items[items.length-1];
          if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
          else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
        }
      });
      document.addEventListener('click',function(e){
        var button=e.target.closest('[data-quick-view]');
        if(!button)return;
        e.preventDefault();lastFocus=button;drawer.hidden=false;document.body.classList.add('quick-view-open');
        qvContent.innerHTML='<div class="quick-view-loading">Loading piece…</div>';
        fetch('/products/'+encodeURIComponent(button.dataset.quickView)+'.js')
          .then(function(r){if(!r.ok)throw new Error('product');return r.json();})
          .then(function(p){
            var image=p.featured_image?'<img src="'+esc(p.featured_image)+'" alt="'+esc(p.title)+'">':'';
            var variants=(p.variants||[]).filter(function(v){return v.available;});
            var options='';
            if(variants.length>1){options='<label class="quick-view-label" for="QuickViewVariant">Choose an option</label><select id="QuickViewVariant" class="quick-view-select">'+variants.map(function(v){return '<option value="'+esc(v.id)+'">'+esc(v.title)+' — '+money(v.price)+'</option>';}).join('')+'</select>';}
            else if(variants.length===1){options='<input type="hidden" id="QuickViewVariant" value="'+esc(variants[0].id)+'">';}
            qvContent.innerHTML='<div class="quick-view-image">'+image+'</div><div class="quick-view-details"><p class="eyebrow">EDENROSE QUICK VIEW</p><h2>'+esc(p.title)+'</h2><p class="quick-view-price">'+money(p.price)+'</p>'+options+'<button type="button" class="button quick-view-add">Add to bag</button><a class="quick-view-full" href="/products/'+encodeURIComponent(p.handle)+'">View full details →</a></div>';
            var initial=focusables()[0]; if(initial)initial.focus();
            var add=qvContent.querySelector('.quick-view-add');
            if(add)add.addEventListener('click',function(){
              var variant=qvContent.querySelector('#QuickViewVariant');if(!variant)return;
              add.disabled=true;add.textContent='Adding…';
              fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({items:[{id:Number(variant.value),quantity:1}]})})
                .then(function(r){if(!r.ok)throw new Error('cart');return r.json();})
                .then(function(){add.textContent='Added ✓';setTimeout(function(){closeQv();window.location.href=(window.EdenRoseConfig&&window.EdenRoseConfig.cartUrl)||'/cart';},350);})
                .catch(function(){add.disabled=false;add.textContent='Try again';});
            });
          })
          .catch(function(){qvContent.innerHTML='<div class="quick-view-error"><p>We could not load this piece.</p><a class="button" href="/products/'+encodeURIComponent(button.dataset.quickView)+'">View product</a></div>';});
      });
    }

    // Keep product-card Quick Add in-page: add to cart without sending shoppers away from browsing.
    if(!document.documentElement.dataset.quickAddBound){
      document.documentElement.dataset.quickAddBound='true';
      document.addEventListener('submit',function(e){
        var form=e.target.closest('.card-quick-add');
        if(!form)return;
        e.preventDefault();
        var button=form.querySelector('.quick-add');
        var input=form.querySelector('input[name="id"]');
        if(!button||!input)return;
        var original=button.textContent;
        button.disabled=true;button.textContent='Adding…';button.setAttribute('aria-busy','true');
        fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({items:[{id:Number(input.value),quantity:1}]})})
          .then(function(r){if(!r.ok)throw new Error('cart');return r.json();})
          .then(function(){
            button.textContent='Added ✓';
            fetch('/cart.js',{headers:{'Accept':'application/json'}}).then(function(r){return r.json();}).then(function(cart){
              document.querySelectorAll('.bag-count').forEach(function(el){el.textContent=cart.item_count;});
              document.querySelectorAll('.bag-action').forEach(function(el){el.setAttribute('aria-label','Cart, '+cart.item_count);});
            }).catch(function(){});
            setTimeout(function(){button.disabled=false;button.textContent=original;button.removeAttribute('aria-busy');},1200);
          })
          .catch(function(){button.disabled=false;button.textContent='Try again';setTimeout(function(){button.textContent=original;},1600);});
      });
    }

    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window){
      var targets=document.querySelectorAll('.section,.floating-card,.shop-the-look,[data-reveal]');
      targets.forEach(function(el){el.classList.add('edenrose-reveal');});
      var observer=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
        });
      },{rootMargin:'0px 0px -8% 0px',threshold:.05});
      targets.forEach(function(el){observer.observe(el);});
    }
  });
})();
/* EdenRose card interaction polish: announce async cart state accessibly. */
document.addEventListener('click',function(e){
  var b=e.target.closest('.quick-add');
  if(!b)return;
  b.classList.add('is-engaged');
});

/* EdenRose: gently reveal product cards as they enter the viewport. */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var cards = document.querySelectorAll('[data-product-card]');
  if (!cards.length || !('IntersectionObserver' in window)) return;
  cards.forEach(function (card) { card.classList.add('edenrose-reveal-ready'); });
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  cards.forEach(function (card) { observer.observe(card); });
})();
