const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const inr=n=>'\u20B9'+Number(n).toFixed(2).replace(/\.00$/,'');
const SEED=`Paracetamol 500 mg|Pain & Fever|Strip of 15 tablets|28|120|12|420
Paracetamol 650 mg|Pain & Fever|Strip of 15 tablets|34|0|12|380
Ibuprofen 400 mg|Pain & Fever|Strip of 10 tablets|32|60|12|300
Diclofenac Gel 30 g|Pain & Fever|Tube|96|25|12|500
Aspirin 75 mg|Pain & Fever|Strip of 14 tablets|18|8|12|200
Cetirizine 10 mg|Cold & Cough|Strip of 10 tablets|22|90|12|450
Levocetirizine 5 mg|Cold & Cough|Strip of 10 tablets|48|40|12|260
Dry Cough Syrup 100 ml|Cold & Cough|Bottle|85|30|12|330
Nasal Decongestant Drops|Cold & Cough|Bottle of 10 ml|62|18|12|240
Cold Relief Balm 25 g|Cold & Cough|Jar|74|45|12|600
ORS Powder Orange|Stomach|Sachet|21|200|5|500
Pantoprazole 40 mg|Stomach|Strip of 15 tablets|88|70|12|280
Antacid Gel 170 ml|Stomach|Bottle|110|0|12|350
Domperidone 10 mg|Stomach|Strip of 10 tablets|35|55|12|25
Loperamide 2 mg|Stomach|Strip of 10 tablets|27|35|12|-10
Vitamin C 500 mg Chewable|Vitamins|Strip of 15 tablets|45|150|12|550
Vitamin D3 60K Sachet|Vitamins|Pack of 4|120|36|12|400
Multivitamin Capsules|Vitamins|Strip of 10 capsules|95|80|12|480
Calcium + D3|Vitamins|Strip of 15 tablets|130|9|12|310
Antiseptic Liquid 100 ml|First Aid|Bottle|92|60|12|700
Adhesive Bandage|First Aid|Pack of 20|40|140|12|900
Cotton Roll 100 g|First Aid|Pack|55|75|5|800
Digital Thermometer|First Aid|Each|180|20|18|1500
Moisturising Cream 100 g|Skin Care|Tube|210|33|18|600
Sunscreen SPF 50|Skin Care|Tube of 50 g|340|0|18|420`;
const iso=d=>new Date(Date.now()+d*864e5).toISOString().slice(0,10);
const seed=()=>SEED.split('\n').map((l,i)=>{const[a,b,c,p,q,g,e]=l.split('|');return{id:'M'+(101+i),name:a,cat:b,form:c,price:+p,qty:+q,gst:+g,batch:'B'+(2600+i*7),exp:iso(+e)}});
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let meds=get('mm_meds',null)||seed(),sales=get('mm_sales',[]),cart={},cat='All',q='',role='shop',tab='stock',isAdmin=false;
const save=()=>{put('mm_meds',meds);put('mm_sales',sales)};
const left=m=>Math.round((new Date(m.exp)-Date.now())/864e5),avail=m=>m.qty>0&&left(m)>=0,byId=id=>meds.find(m=>m.id===id);
const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2200)};
const open=h=>{$('#modal').innerHTML=h;$('#veil').classList.add('on')},closeM=()=>$('#veil').classList.remove('on');

function shop(){
 const cats=['All',...new Set(meds.map(m=>m.cat))];
 const list=meds.filter(m=>(cat==='All'||m.cat===cat)&&m.name.toLowerCase().includes(q.toLowerCase()));
 return `<section class="hero"><div><h1>Your neighbourhood chemist, now open online.</h1><p>Pick your medicines, add them to the cart and pay when you are ready. Each pocket on a strip is one strip or pack in stock.</p></div>
 <div><label for="s">Search medicines</label><input id="s" type="search" placeholder="Try paracetamol, cetirizine, ORS" value="${esc(q)}"></div></section>
 <div class="chips">${cats.map(c=>`<button class="chip ${c===cat?'on':''}" data-act="cat" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>
 <div class="grid">${list.map(card).join('')||'<p>No medicine matches that search. Check the spelling or pick another category.</p>'}</div>
 <p class="note">Sample catalogue for a college project. Orders are collected and paid for at the shop.</p>`}
function card(m){
 const a=avail(m),ex=left(m)<0,n=a?Math.min(m.qty,10):0;
 const st=ex?['no','Unavailable']:m.qty<=0?['no','Out of stock']:m.qty<=10?['low','Only '+m.qty+' left']:['ok','In stock'];
 return `<article class="card ${a?'':'off'}"><span class="cat">${esc(m.cat)}${isRx(m)?' <b class="st low" style="margin-left:6px">Prescription needed</b>':''}</span><h3>${esc(m.name)}</h3><span class="sub">${esc(m.form)}</span>
 <div class="strip" aria-hidden="true">${Array.from({length:10},(_,i)=>`<i class="pk ${i<n?'f':''}"></i>`).join('')}</div>
 <div class="perf"><div class="row"><span class="price">${inr(m.price)}</span><span class="st ${st[0]}">${st[1]}</span></div>
 ${a?`<div class="row"><span style="color:var(--mute);font-size:14px">${per(m)?'Strips':'Quantity'}</span><span class="qty"><button class="alt" data-act="pm" data-d="-1" data-id="${m.id}" aria-label="Fewer">\u2212</button><b id="pk-${m.id}">${pick(m.id)}</b><button class="alt" data-act="pm" data-d="1" data-id="${m.id}" aria-label="More">+</button></span></div><div class="row" style="gap:6px;justify-content:flex-start">${[1,2,5,10].filter(v=>v<=m.qty).map(v=>`<button class="chip" data-act="setpk" data-v="${v}" data-id="${m.id}" style="padding:4px 10px">${v}</button>`).join('')}</div><small id="tb-${m.id}" style="color:var(--mute)">${tabTxt(m,pick(m.id))}</small><div class="two"><button class="alt" data-act="add" data-id="${m.id}">Add to cart</button><button class="go" data-act="buy" data-id="${m.id}">Buy now</button></div>`:`<button disabled>${ex?'Unavailable':'Out of stock'}</button>`}</div></article>`}

function add(id,silent,k=1){const m=byId(id);if(!m||!avail(m))return toast(m.name+' is out of stock');
 if((cart[id]||0)>=m.qty)return toast('Only '+m.qty+' of '+m.name+' available');
 const n=Math.min(k,m.qty-(cart[id]||0));cart[id]=(cart[id]||0)+n;count();if(!silent)toast((n<k?'Only '+m.qty+' available. ':'')+n+' added. In cart: '+cart[id])}
const count=()=>$('#cnt').textContent=Object.values(cart).reduce((a,b)=>a+b,0);
const calc=()=>{let sub=0,gst=0;Object.entries(cart).forEach(([id,n])=>{const m=byId(id);sub+=m.price*n;gst+=m.price*n*m.gst/100});return{sub,gst,total:sub+gst}};
function drawCart(){
 const ids=Object.keys(cart),t=calc();
 $('#drawer').innerHTML=`<div class="row"><h2>Your cart</h2><button class="alt" data-act="closeCart">Close</button></div>
 <div class="items">${ids.map(id=>{const m=byId(id);return `<div class="it"><b>${esc(m.name)}</b><b>${inr(m.price*cart[id])}</b><span class="qty"><button class="alt" data-act="dec" data-id="${id}" aria-label="Fewer">\u2212</button>${cart[id]}<button class="alt" data-act="inc" data-id="${id}" aria-label="More">+</button></span><button class="alt" data-act="rm" data-id="${id}">Remove</button></div>`}).join('')||'<p>Your cart is empty. Pick a medicine to start.</p>'}</div>
 ${ids.length?`<div class="tot"><span>Subtotal</span><span>${inr(t.sub)}</span></div><div class="tot"><span>GST</span><span>${inr(t.gst)}</span></div><div class="tot b"><span>Total</span><span>${inr(t.total)}</span></div>
 <div class="ask"><p>Ready to check out, or need something else?</p><div class="two"><button class="alt" data-act="closeCart">Add more items</button><button class="go" data-act="pay">Place order</button></div></div>`:''}`}
const openCart=()=>{drawCart();$('#drawer').classList.add('on')},closeCart=()=>$('#drawer').classList.remove('on');

function payForm(){const t=calc();closeCart();const rxl=Object.keys(cart).map(byId).filter(isRx),rxBox=rxl.length?`<label style="display:flex;gap:8px;align-items:flex-start;color:var(--ink);margin-top:12px"><input type="checkbox" id="rx" style="width:auto;margin-top:4px"><span>I have a valid prescription for ${rxl.map(m=>esc(m.name)).join(', ')} and will show it at the shop.</span></label>`:'';
 open(`<h2>Place order, ${inr(t.total)}</h2><label for="n">Full name</label><input id="n" autocomplete="name" value="${esc(user?user.name:'')}"><label for="p">Phone number</label><input id="p" inputmode="numeric" maxlength="10" autocomplete="tel" value="${esc(user?user.phone:'')}">
 <label>Payment method</label><div class="opts" style="grid-template-columns:1fr 1fr"><label><input type="radio" name="pm" value="Cash at shop" checked><span>Cash at shop</span></label><label><input type="radio" name="pm" value="UPI at pickup"><span>UPI at pickup</span></label></div><p style="color:var(--mute);font-size:13px;margin:8px 0 0">You pay when you collect your order at Meghavi Chemist. Nothing is charged online.</p>${rxBox}
 <p id="err" style="color:var(--red);min-height:22px;margin:8px 0"></p><div class="two"><button class="alt" data-act="closeM">Add more items</button><button class="go" data-act="confirm">Place order</button></div>`)}
function confirmPay(){
 const n=$('#n').value.trim(),p=$('#p').value.trim(),pm=document.querySelector('[name=pm]:checked').value;
 if(!n)return $('#err').textContent='Enter your full name.';if(!/^\d{10}$/.test(p))return $('#err').textContent='Enter a 10-digit phone number.';
 if(Object.keys(cart).map(byId).some(isRx)&&!$('#rx').checked)return $('#err').textContent='Confirm that you have a prescription for the prescription medicines.';
 for(const[id,k]of Object.entries(cart)){const m=byId(id);if(!avail(m)||m.qty<k){return $('#err').textContent=m.name+' is no longer available in that quantity. Update your cart.'}}
 const t=calc(),items=Object.entries(cart).map(([id,k])=>{const m=byId(id);m.qty-=k;return{id,name:m.name,qty:k,price:m.price,gst:m.gst}});
 const s={no:'MM-'+String(sales.length+1).padStart(4,'0'),date:new Date().toISOString(),name:n,phone:p,pm,items,status:'Received',rx:items.some(i=>isRx(byId(i.id))),...t};sales.unshift(s);save();cart={};count();bill(s)}
function bill(s){open(`<div id="bill" class="bill"><h2 style="font-size:22px">Meghavi Chemist</h2><div>Parnera, Atul, Gujarat \u2022 GST bill</div><hr><div>Bill ${s.no} \u2022 ${new Date(s.date).toLocaleString('en-IN')}</div><div>${esc(s.name)} \u2022 ${esc(s.phone)} \u2022 ${esc(s.pm)}</div><hr>
 ${s.items.map(i=>`<div class="r"><span>${esc(i.name)} \u00D7 ${i.qty}</span><span>${inr(i.price*i.qty)}</span></div><div style="color:var(--mute)">GST ${i.gst}%</div>`).join('')}<hr>
 <div class="r"><span>Subtotal</span><span>${inr(s.sub)}</span></div><div class="r"><span>GST</span><span>${inr(s.gst)}</span></div><div class="r"><b>${st(s)==='Collected'?'Total paid':'Total to pay at shop'}</b><b>${inr(s.total)}</b></div><hr><div>Status: ${st(s)}${s.rx?'. Bring your prescription to the shop.':''}</div></div>
 <div class="two" style="margin-top:16px"><button class="alt" data-act="print">Print bill</button><button class="go" data-act="closeM">Continue shopping</button></div>`)}

const pk={},pick=id=>pk[id]||1;
const per=m=>{const x=/Strip of (\d+) (tablets|capsules)/.exec(m.form);return x?{n:+x[1],u:x[2]}:null};
const tabTxt=(m,k)=>{const p=per(m);return p?`${k} ${k>1?'strips':'strip'} \u00D7 ${p.n} ${p.u} = ${k*p.n} ${p.u}`:`${k} ${k>1?'items':'item'}`};
function setPick(id,v){const m=byId(id);v=Math.max(1,Math.min(m.qty,v));pk[id]=v;$('#pk-'+id).textContent=v;$('#tb-'+id).textContent=tabTxt(m,v)}
const RXN=['Pantoprazole 40 mg','Domperidone 10 mg','Levocetirizine 5 mg','Diclofenac Gel 30 g'];
const isRx=m=>m.rx===undefined?RXN.includes(m.name):m.rx,st=s=>s.status||'Collected';
const rsBtn=m=>`<button class="alt" style="padding:4px 10px" data-act="rs" data-id="${m.id}" data-n="10">+10</button> <button class="alt" style="padding:4px 10px" data-act="rs" data-id="${m.id}" data-n="50">+50</button>`;
function setStatus(no,v){const s=sales.find(x=>x.no===no);if(!s)return;const was=st(s);
 if(v==='Cancelled'&&was!=='Cancelled')s.items.forEach(i=>{const m=byId(i.id);if(m)m.qty+=i.qty});
 if(was==='Cancelled'&&v!=='Cancelled')s.items.forEach(i=>{const m=byId(i.id);if(m)m.qty=Math.max(0,m.qty-i.qty)});
 s.status=v;save();render();toast(no+' is now '+v)}
function ordersHtml(){const O=['Received','Ready for pickup','Collected','Cancelled'];
 return `<div class="wrap"><table><tr><th>Bill</th><th>Date</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th></tr>${sales.map(s=>`<tr><td>${s.no}${s.rx?'<br><span class="st low">Rx</span>':''}</td><td>${new Date(s.date).toLocaleString('en-IN')}</td><td>${esc(s.name)}<br><span style="color:var(--mute)">${esc(s.phone)}</span></td><td>${s.items.map(i=>esc(i.name)+' \u00D7 '+i.qty).join(', ')}</td><td>${esc(s.pm)}</td><td>${inr(s.total)}</td><td><select data-act="ostatus" data-no="${s.no}" style="width:auto">${O.map(o=>`<option ${o===st(s)?'selected':''}>${o}</option>`).join('')}</select></td></tr>`).join('')||'<tr><td>No orders yet. Orders appear here when a patient places one.</td></tr>'}</table></div>`}
function summaryHtml(){const now=new Date(),mk=d=>d.getFullYear()+'-'+d.getMonth(),sum=a=>a.reduce((x,s)=>x+s.total,0);
 const inM=sales.filter(s=>mk(new Date(s.date))===mk(now)&&st(s)!=='Cancelled'),coll=inM.filter(s=>st(s)==='Collected'),pend=inM.filter(s=>st(s)!=='Collected'),top={};
 inM.forEach(s=>s.items.forEach(i=>top[i.name]=(top[i.name]||0)+i.qty));
 const rows=Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,5);
 const months=[0,1,2,3,4,5].map(i=>{const d=new Date(now.getFullYear(),now.getMonth()-i,1),t=sales.filter(s=>st(s)==='Collected'&&mk(new Date(s.date))===mk(d));return[d.toLocaleString('en-IN',{month:'long',year:'numeric'}),t.length,sum(t)]});
 const h='<h2 style="font-size:22px;margin:18px 0 8px">';
 return `<div class="stats"><div class="stat"><b>${inM.length}</b><span>Orders this month</span></div><div class="stat"><b>${inr(sum(coll))}</b><span>Collected this month</span></div><div class="stat"><b>${inr(sum(pend))}</b><span>Waiting to be collected</span></div></div>${h}Top medicines this month</h2><div class="wrap"><table><tr><th>Medicine</th><th>Units ordered</th></tr>${rows.map(r=>`<tr><td><b>${esc(r[0])}</b></td><td>${r[1]}</td></tr>`).join('')||'<tr><td colspan="2">No orders yet this month.</td></tr>'}</table></div>${h}Last 6 months</h2><div class="wrap"><table><tr><th>Month</th><th>Collected orders</th><th>Revenue</th></tr>${months.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${inr(r[2])}</td></tr>`).join('')}</table></div>`}
function myOrders(){const mine=sales.filter(s=>user&&s.phone===user.phone);
 open(`<h2>My orders</h2>${mine.map(s=>`<div class="it"><b>${s.no}</b><b>${inr(s.total)}</b><span style="color:var(--mute)">${new Date(s.date).toLocaleDateString('en-IN')} \u2022 ${s.items.map(i=>esc(i.name)+' \u00D7 '+i.qty).join(', ')}</span><span><span class="st ${st(s)==='Collected'?'ok':st(s)==='Cancelled'?'no':'low'}">${st(s)}</span> <button class="alt" style="padding:3px 10px" data-act="viewbill" data-no="${s.no}">View bill</button></span></div>`).join('')||'<p>No orders yet. Your orders appear here after you place one.</p>'}<div style="margin-top:14px"><button class="alt" data-act="closeM">Close</button></div>`)}
function alertsHtml(){
 const sec=(t,c,note,rows)=>`<section style="margin-bottom:18px"><div class="row" style="margin-bottom:8px;flex-wrap:wrap;gap:6px"><h2 style="font-size:22px">${t} <span class="st ${c}">${rows.length}</span></h2><span style="color:var(--mute);font-size:14px">${note}</span></div><div class="wrap"><table><tr><th>Medicine</th><th>Batch</th><th>Quantity</th><th>Expiry</th><th>What to do</th></tr>${rows.map(([m,x])=>`<tr><td><b>${esc(m.name)}</b></td><td>${esc(m.batch)}</td><td>${m.qty}</td><td>${m.exp}</td><td>${x}</td></tr>`).join('')||'<tr><td colspan="5">Nothing here. All clear.</td></tr>'}</table></div></section>`;
 const live=meds.filter(m=>left(m)>=0);
 return sec('Out of stock','no','Patients see these as out of stock.',live.filter(m=>m.qty<=0).map(m=>[m,rsBtn(m)]))
 +sec('Low stock','low','10 units or fewer left.',live.filter(m=>m.qty>0&&m.qty<=10).map(m=>[m,rsBtn(m)]))
 +sec('Expiry date short','low','Expired, or expiring within 60 days.',meds.filter(m=>left(m)<=60).map(m=>[m,left(m)<0?'Expired '+(-left(m))+' days ago, hidden from patients':'Expires in '+left(m)+' days, sell or return']));
}
function admin(){
 const low=meds.filter(m=>m.qty<=10&&left(m)>=0),exp=meds.filter(m=>left(m)<=60),day=new Date().toDateString();
 const rev=sales.filter(s=>new Date(s.date).toDateString()===day&&st(s)==='Collected').reduce((a,s)=>a+s.total,0),open_=sales.filter(s=>st(s)==='Received'||st(s)==='Ready for pickup').length;
 let body='';
 if(tab==='stock')body=`<form class="form" id="addF"><div><label>Medicine name</label><input name="name" required></div><div><label>Category</label><input name="cat" required list="cl"></div><div><label>Pack</label><input name="form" required></div><div><label>Batch no.</label><input name="batch" required></div><div><label>Expiry date</label><input name="exp" type="date" required></div><div><label>Price (\u20B9)</label><input name="price" type="number" min="0" step="0.5" required></div><div><label>Quantity</label><input name="qty" type="number" min="0" required></div><div><label>GST %</label><select name="gst"><option>5</option><option selected>12</option><option>18</option></select></div><div><label style="display:flex;gap:6px;align-items:center;color:var(--ink)"><input type="checkbox" name="rx" style="width:auto"> Prescription needed</label></div><button class="go">Add medicine</button></form><datalist id="cl">${[...new Set(meds.map(m=>m.cat))].map(c=>`<option>${esc(c)}`).join('')}</datalist>
 <div class="wrap"><table><tr><th>Medicine</th><th>Batch</th><th>Expiry</th><th>Price</th><th>Quantity</th><th>Status</th><th></th></tr>${meds.map(m=>`<tr><td><b>${esc(m.name)}</b><br><span style="color:var(--mute)">${esc(m.cat)}${isRx(m)?' \u2022 Prescription needed':''}</span></td><td>${esc(m.batch)}</td><td>${m.exp}</td><td><input type="number" min="0" step="0.5" value="${m.price}" data-act="price" data-id="${m.id}"></td><td><input type="number" min="0" value="${m.qty}" data-act="qtyset" data-id="${m.id}"></td><td>${left(m)<0?'<span class="st no">Expired</span>':m.qty<=0?'<span class="st no">Out of stock</span>':m.qty<=10?'<span class="st low">Low stock</span>':left(m)<=60?'<span class="st low">Expires soon</span>':'<span class="st ok">Good</span>'}</td><td><button class="alt" data-act="del" data-id="${m.id}">Delete</button></td></tr>`).join('')}</table></div>`;
 if(tab==='alerts')body=alertsHtml();
 if(tab==='sales')body=ordersHtml();if(tab==='summary')body=summaryHtml();
 return `<div class="row"><h1 style="font-size:36px">Pharmacist dashboard</h1><button class="alt" data-act="logout">Log out</button></div>
 <div class="stats"><div class="stat"><b>${meds.length}</b><span>Medicines listed</span></div><div class="stat"><b>${low.length}</b><span>Low or out of stock</span></div><div class="stat"><b>${exp.length}</b><span>Expired or expiring in 60 days</span></div><div class="stat"><b>${inr(rev)}</b><span>Collected today</span></div><div class="stat"><b>${open_}</b><span>Open orders</span></div></div>
 <div class="tabs">${[['stock','Stock'],['alerts','Alerts'],['sales','Orders'],['summary','Summary']].map(([k,v])=>`<button class="${tab===k?'':'alt'}" data-act="tab" data-v="${k}">${v}</button>`).join('')}</div>${body}`}

function render(){updAuth();$('#app').innerHTML=role==='admin'&&isAdmin?admin():shop();
 const s=$('#s');if(s)s.oninput=e=>{q=e.target.value;const p=e.target.selectionStart;render();const n=$('#s');n.focus();n.setSelectionRange(p,p)};
 const f=$('#addF');if(f)f.onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f));meds.unshift({id:'M'+Date.now(),name:d.name.trim(),cat:d.cat.trim(),form:d.form.trim(),batch:d.batch.trim(),exp:d.exp,price:+d.price,qty:+d.qty,gst:+d.gst,rx:!!d.rx});save();render();toast(d.name+' added to stock')}}
let user=null,users=get('mm_users',[]);
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const ERR='<p id="err" style="color:var(--red);min-height:22px;margin:8px 0"></p>';
function updAuth(){$('#ordBtn').hidden=!user||isAdmin;$('#loginBtn').textContent=isAdmin?'Log out (admin)':user?'Log out ('+user.name.split(' ')[0]+')':'Log in';$('#loginBtn').className=isAdmin||user?'alt':'go'}
function login(){open(`<h2>Log in</h2><label for="u">Username or phone number</label><input id="u" autocomplete="username"><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password">${ERR}<div class="two"><button class="alt" data-act="closeM">Cancel</button><button class="go" data-act="doLogin">Log in</button></div><p style="margin:14px 0 0;color:var(--mute)">New patient? <a href="#" data-act="signup" style="color:var(--blue)">Create an account</a></p>`)}
function signup(){open(`<h2>Create patient account</h2><label for="sn">Full name</label><input id="sn" autocomplete="name"><label for="sp">Phone number</label><input id="sp" inputmode="numeric" maxlength="10" autocomplete="tel"><label for="sw">Password (6 or more characters)</label><input id="sw" type="password" autocomplete="new-password">${ERR}<div class="two"><button class="alt" data-act="login">Back to log in</button><button class="go" data-act="doSignup">Create account</button></div>`)}
async function doLogin(){const u=$('#u').value.trim(),p=$('#pw').value;
 if(u==='admin'&&p==='medimart@admin'){isAdmin=true;role='admin';closeM();render();return}
 const h=await sha(p),x=users.find(z=>z.phone===u&&z.pw===h);
 if(!x)return $('#err').textContent='Wrong username, phone number or password. Try again.';
 user=x;put('mm_user',x.phone);closeM();render();toast('Welcome back, '+x.name)}
async function doSignup(){const n=$('#sn').value.trim(),p=$('#sp').value.trim(),w=$('#sw').value;
 if(!n)return $('#err').textContent='Enter your full name.';if(!/^\d{10}$/.test(p))return $('#err').textContent='Enter a 10-digit phone number.';if(w.length<6)return $('#err').textContent='Use a password with at least 6 characters.';
 if(users.some(z=>z.phone===p))return $('#err').textContent='This phone number already has an account. Log in instead.';
 user={name:n,phone:p,pw:await sha(w)};users.push(user);put('mm_users',users);put('mm_user',p);closeM();render();toast('Account created. Welcome, '+n)}
function logout(){isAdmin=false;role='shop';user=null;put('mm_user',null);try{location.hash=''}catch(e){}render()}

document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.tagName==='INPUT')return;if(b.tagName==='A')e.preventDefault();const a=b.dataset.act,id=b.dataset.id;
 if(a==='cat'){cat=b.dataset.v;render()}
 else if(a==='add')add(id,0,pick(id));else if(a==='buy'){const m=byId(id);if(!avail(m))return;cart={};add(id,1,pick(id));payForm()}else if(a==='pm')setPick(id,pick(id)+ +b.dataset.d);else if(a==='setpk')setPick(id,+b.dataset.v)
 else if(a==='openCart')openCart();else if(a==='closeCart')closeCart();
 else if(a==='inc'){add(id,1);drawCart()}else if(a==='dec'){if(--cart[id]<=0)delete cart[id];count();drawCart()}else if(a==='rm'){delete cart[id];count();drawCart()}
 else if(a==='pay')payForm();else if(a==='confirm')confirmPay();else if(a==='closeM')closeM();else if(a==='print')window.print();
 else if(a==='theme')toggleTheme()
 else if(a==='doLogin')doLogin();else if(a==='signup')signup();else if(a==='login')login();else if(a==='doSignup')doSignup();else if(a==='loginBtn'){if(isAdmin||user)logout();else login()}else if(a==='myorders')myOrders();else if(a==='viewbill')bill(sales.find(s=>s.no===b.dataset.no));else if(a==='rs'){const m=byId(id);m.qty+=+b.dataset.n;save();render();toast(m.name+' restocked by '+b.dataset.n)}
 else if(a==='logout'){isAdmin=false;role='shop';try{location.hash=''}catch(e){}render()}else if(a==='tab'){tab=b.dataset.v;render()}
 else if(a==='del'){meds=meds.filter(m=>m.id!==id);delete cart[id];save();render()}});
document.addEventListener('change',e=>{const t=e.target,id=t.dataset.id;if(isAdmin&&t.dataset.act==='ostatus'){setStatus(t.dataset.no,t.value);return}if(!isAdmin||!id)return;const m=byId(id);
 if(t.dataset.act==='qtyset'){m.qty=Math.max(0,Math.floor(+t.value)||0);if(cart[id]>m.qty){m.qty?cart[id]=m.qty:delete cart[id];count()}save();render();toast(m.name+' stock updated')}
 if(t.dataset.act==='price'){m.price=Math.max(0,+t.value||0);save();toast(m.name+' price updated')}});
$('#veil').addEventListener('click',e=>{if(e.target.id==='veil')closeM()});
const isDark=()=>{const t=document.documentElement.dataset.theme;return t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches};
function setTheme(t){document.documentElement.dataset.theme=t;put('mm_theme',t);$('#themeBtn').textContent=t==='dark'?'Light mode':'Dark mode'}
function toggleTheme(){setTheme(isDark()?'light':'dark')}
const savedTheme=get('mm_theme',null);if(savedTheme)setTheme(savedTheme);else $('#themeBtn').textContent=isDark()?'Light mode':'Dark mode';
function route(f){if(f||location.hash==='#admin'){if(isAdmin){role='admin';render()}else login()}}
let lc=0,lt;$('#logo').addEventListener('click',()=>{lc++;clearTimeout(lt);lt=setTimeout(()=>lc=0,2500);if(lc>=5){lc=0;route(true)}});
addEventListener('hashchange',()=>route());
{const sp=get('mm_user',null);user=users.find(z=>z.phone===sp)||null}
render();route();
