const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const nav=$('.nav'),menu=$('.menu');
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open)});
const sb=$('.search-button'),sp=$('.search'),close=$('.search-close');
sb?.addEventListener('click',()=>{sp?.classList.toggle('open');if(sp?.classList.contains('open'))$('.search input')?.focus()});
close?.addEventListener('click',()=>sp?.classList.remove('open'));
let big=false;$('#text-size')?.addEventListener('click',e=>{big=!big;document.documentElement.style.setProperty('--base',big?'21px':'19px');e.currentTarget.textContent=big?'A−':'A+'});
const toast=$('.toast');function notify(t){if(!toast)return;toast.textContent=t;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200)}
$$('[data-share]').forEach(b=>b.addEventListener('click',async()=>{const title=b.dataset.title||document.title,url=location.href;if(navigator.share){try{await navigator.share({title,text:title,url})}catch(e){}}else{await navigator.clipboard?.writeText(title+'\n'+url);notify('لینک مطلب کپی شد.')}}));
$$('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{const target=$(b.dataset.copy);if(target){await navigator.clipboard?.writeText(target.value||target.textContent);notify('متن کپی شد.')}}));

function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function faDate(s){try{return new Date(s).toLocaleDateString('fa-IR')}catch{return s||''}}
function articleUrl(id){return 'article.html?id='+encodeURIComponent(id)}

async function loadHomepage(){
  const target=$('.grid-feature'); if(!target)return;
  try{
    const r=await fetch('/api/posts?limit=4',{cache:'no-store'}); const d=await r.json(); const posts=d.posts||[];
    if(!posts.length)return;
    const [first,...rest]=posts;
    const visual=first.image_url?`<div class="visual" style="background-image:url('${esc(first.image_url)}');background-size:cover;background-position:center"><span>${esc(first.category)}</span></div>`:`<div class="visual"><span>${esc(first.category)}</span></div>`;
    target.innerHTML=`<article class="feature">${visual}<div class="body"><div class="meta">${faDate(first.published_at||first.created_at)} · ${esc(first.author)}</div><h3>${esc(first.title)}</h3><p>${esc(first.excerpt||'')}</p><div class="article-actions"><a href="${articleUrl(first.id)}">ادامه مطلب ←</a><button class="share" data-share data-title="${esc(first.title)}">اشتراک‌گذاری</button></div></div></article><div class="mini-list">${rest.map(p=>`<article class="mini"><span class="tag">${esc(p.category)}</span><h3><a href="${articleUrl(p.id)}">${esc(p.title)}</a></h3><p>${esc(p.excerpt||'')}</p></article>`).join('')}</div>`;
    $$('#latest [data-share]').forEach(b=>b.addEventListener('click',async()=>{const title=b.dataset.title,url=location.href;if(navigator.share){try{await navigator.share({title,text:title,url})}catch(e){}}else{await navigator.clipboard?.writeText(title+'\n'+url);notify('لینک مطلب کپی شد.')}}));
  }catch(e){}
}

async function loadCategory(){
  const grid=$('.post-grid'); if(!grid)return;
  try{
    const r=await fetch('/api/posts?limit=100',{cache:'no-store'}); const d=await r.json(); const posts=d.posts||[];
    if(!posts.length){grid.innerHTML='<div class="panel"><h2>هنوز مطلبی منتشر نشده است.</h2><p>از پنل مدیریت، اولین مطلب کافه را منتشر کنید.</p></div>';return}
    grid.innerHTML=posts.map(p=>`<article class="post-card">${p.image_url?`<div class="thumb" style="background-image:url('${esc(p.image_url)}');background-size:cover;background-position:center"></div>`:'<div class="thumb"></div>'}<div class="pad"><span class="eyebrow">${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.excerpt||'')}</p><small class="meta">${faDate(p.published_at||p.created_at)}</small><a href="${articleUrl(p.id)}">ادامه مطلب ←</a></div></article>`).join('');
  }catch(e){}
}

async function loadArticle(){
  const page=$('.article-page'); if(!page)return;
  const id=new URLSearchParams(location.search).get('id'); if(!id)return;
  try{
    const r=await fetch('/api/posts?id='+encodeURIComponent(id),{cache:'no-store'}); const d=await r.json();
    if(!r.ok||!d.post){page.innerHTML='<div class="panel"><h1>مطلب پیدا نشد</h1><a class="more" href="category.html">بازگشت به مطالب</a></div>';return}
    const p=d.post;
    page.innerHTML=`${p.image_url?`<div class="article-cover" style="background-image:url('${esc(p.image_url)}')"></div>`:''}<span class="category">${esc(p.category)}</span><h1>${esc(p.title)}</h1><div class="meta">${faDate(p.published_at||p.created_at)} · نویسنده: ${esc(p.author)}</div>${p.excerpt?`<p class="lead">${esc(p.excerpt)}</p>`:''}<div class="content">${String(p.content||'').split(/\n{2,}/).map(x=>x.trim()?`<p>${esc(x).replace(/\n/g,'<br>')}</p>`:'').join('')}</div><div class="share-panel"><strong>این مطلب را به اشتراک بگذارید</strong><div class="share-links"><button data-share data-title="${esc(p.title)}">اشتراک‌گذاری</button><button onclick="navigator.clipboard?.writeText(location.href);this.textContent='کپی شد ✓'">کپی لینک</button><button onclick="window.open('https://t.me/share/url?url='+encodeURIComponent(location.href)+'&text='+encodeURIComponent(document.title),'_blank')">تلگرام</button><button onclick="window.open('https://wa.me/?text='+encodeURIComponent(document.title+' '+location.href),'_blank')">واتساپ</button></div></div>`;
    document.title=p.title+' | کافه بازنشستگی';
    page.querySelector('[data-share]')?.addEventListener('click',async()=>{const url=location.href;if(navigator.share){try{await navigator.share({title:p.title,text:p.title,url})}catch(e){}}else{await navigator.clipboard?.writeText(p.title+'\n'+url);notify('لینک مطلب کپی شد.')}});
  }catch(e){}
}

const pubTitle=$('#post-title'),pubLead=$('#post-lead'),pubBody=$('#post-body'),out=$('#social-output');
function makePack(){if(!out)return;const t=pubTitle?.value||'عنوان مطلب',l=pubLead?.value||'خلاصه کوتاه مطلب';out.textContent=`نسخه تلگرام:\n${t}\n\n${l}\n\nمطالعه کامل در کافه بازنشستگی:\n${location.origin}\n\nکپشن اینستاگرام:\n${t}\n\n${l}\n\n#کافه_بازنشستگی #بازنشستگی #زندگی\n\nمتن ایکس:\n${t} — ${l.slice(0,180)}\n\nنسخه شبکه‌های اجتماعی داخلی:\n${t}\n${l}`;}
['post-title','post-lead','post-body'].forEach(id=>$('#'+id)?.addEventListener('input',makePack));makePack();

loadHomepage();loadCategory();loadArticle();
