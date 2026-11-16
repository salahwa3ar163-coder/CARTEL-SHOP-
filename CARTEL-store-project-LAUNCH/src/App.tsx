import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Instagram, Menu, Minus, Plus, ShoppingBag, ShieldCheck, X } from 'lucide-react';
import { backendReady, demoProducts, money, Product, supabase } from './lib';

type CartLine = { product: Product; size: string; color: string; qty: number };
type Customer = { full_name:string; phone:string; email:string; city:string; address:string };

const initialCustomer:Customer = {full_name:'',phone:'',email:'',city:'',address:''};

function Emblem({small=false}:{small?:boolean}) {
  return <span className={`emblem ${small?'small':''}`} aria-label="CARTEL crossed emblem">
    <svg viewBox="0 0 100 100" role="img" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M17 24 L36 43 L44 35 L25 16 L18 16 Z M36 43 L28 58 L36 66 L48 47"/>
        <path d="M83 24 L64 43 L56 35 L75 16 L82 16 Z M64 43 L72 58 L64 66 L52 47"/>
        <path d="M50 12 L50 88 M12 50 L88 50" strokeWidth="2"/>
      </g>
    </svg>
  </span>;
}
function App() {
  const [products,setProducts] = useState<Product[]>(demoProducts);
  const [cart,setCart] = useState<CartLine[]>(() => { try{return JSON.parse(localStorage.getItem('cartel-cart')||'[]')}catch{return []} });
  const [page,setPage] = useState<'home'|'shop'|'contact'|'admin'>('home');
  const [selected,setSelected] = useState<Product|null>(null);
  const [size,setSize] = useState('M'), [color,setColor] = useState('Black'), [qty,setQty] = useState(1);
  const [cartOpen,setCartOpen] = useState(false), [checkout,setCheckout] = useState(false);
  const [customer,setCustomer] = useState<Customer>(initialCustomer);
  const [notice,setNotice] = useState(''), [orderNo,setOrderNo] = useState('');
  const [mobileOpen,setMobileOpen] = useState(false);
  const [adminEmail,setAdminEmail] = useState(''), [adminPassword,setAdminPassword] = useState('');
  const [admin,setAdmin] = useState(false), [orders,setOrders] = useState<any[]>([]);
  const [busy,setBusy] = useState(false);

  useEffect(()=>{localStorage.setItem('cartel-cart',JSON.stringify(cart))},[cart]);
  useEffect(()=>{ if(supabase) supabase.from('products').select('*').eq('active',true).then(({data})=>{if(data?.length)setProducts(data as Product[])}) },[]);
  const count=cart.reduce((s,l)=>s+l.qty,0), subtotal=cart.reduce((s,l)=>s+l.product.price*l.qty,0);
  const delivery=0, total=subtotal+delivery;
  const add=(p:Product,s=size,c=color,q=qty)=>{setCart(old=>{const i=old.findIndex(x=>x.product.id===p.id&&x.size===s&&x.color===c);if(i>=0)return old.map((x,j)=>j===i?{...x,qty:x.qty+q}:x);return [...old,{product:p,size:s,color:c,qty:q}]});setNotice('ADDED TO BAG');setTimeout(()=>setNotice(''),1800)};
  const updateQty=(i:number,n:number)=>setCart(old=>old.map((x,j)=>j===i?{...x,qty:Math.max(1,n)}:x));
  const remove=(i:number)=>setCart(old=>old.filter((_,j)=>j!==i));
  const go=(p:any)=>{setPage(p);setSelected(null);setMobileOpen(false);window.scrollTo({top:0,behavior:'smooth'})};
  const openProduct=(p:Product)=>{setSelected(p);setSize(p.sizes?.[0]||'M');setColor(p.colors?.[0]||'Black');setQty(1);window.scrollTo({top:0,behavior:'smooth'})};

  async function submitOrder(e:React.FormEvent){
    e.preventDefault(); if(!cart.length)return;
    if(!supabase){setNotice('DEMO MODE — connect Supabase to save orders.');return}
    setBusy(true);
    const orderNumber='CTL-'+Date.now().toString().slice(-8);
    const payload={order_number:orderNumber,customer_name:customer.full_name,phone:customer.phone,email:customer.email,city:customer.city,address:customer.address,items:cart.map(x=>({product_id:x.product.id,name:x.product.name,price:x.product.price,size:x.size,color:x.color,quantity:x.qty})),subtotal,delivery_fee:delivery,total,status:'New'};
    const {error}=await supabase.from('orders').insert(payload);
    if(error){setNotice(`ORDER ERROR: ${error.message}`);setBusy(false);return}
    setOrderNo(orderNumber);setCart([]);setCheckout(false);setCartOpen(false);setCustomer(initialCustomer);setBusy(false);
    setNotice('ORDER RECEIVED');
    // Email notification is sent by a database trigger invoking the Edge Function; see setup guide.
  }
  async function login(e:React.FormEvent){e.preventDefault();if(!supabase){setNotice('Connect Supabase before admin login.');return}const {error}=await supabase.auth.signInWithPassword({email:adminEmail,password:adminPassword});if(error){setNotice(error.message);return}setAdmin(true);loadOrders()}
  async function loadOrders(){if(!supabase)return;const {data}=await supabase.from('orders').select('*').order('created_at',{ascending:false});setOrders(data||[])}
  async function statusOrder(id:string,status:string){if(!supabase)return;await supabase.from('orders').update({status}).eq('id',id);loadOrders()}
  async function logout(){await supabase?.auth.signOut();setAdmin(false);go('home')}

  const productCards=useMemo(()=>products.map(p=><article className="product-card" key={p.id}>
    <button className="product-image" onClick={()=>openProduct(p)} aria-label={`View ${p.name}`}><img src={p.image_url} alt={p.name}/><span className="quick-view">QUICK VIEW <ArrowUpRight/></span></button>
    <div className="product-meta"><div><p className="eyebrow">{p.category}</p><h3>{p.name}</h3></div><strong>{money(p.price)}</strong></div>
    <button className="text-link" onClick={()=>openProduct(p)}>VIEW PRODUCT <ArrowRight size={14}/></button>
  </article>),[products]);
  return <div className="app">
    <div className="announcement"><div>✳ &nbsp; Livraison gratuite partout au Maroc &nbsp; ✳ &nbsp; Livraison gratuite partout au Maroc &nbsp; ✳ &nbsp; Livraison gratuite partout au Maroc &nbsp; ✳ &nbsp;</div></div>
    <header className="header">
      <button className="wordmark" onClick={()=>go('home')}>CARTEL<span>®</span></button>
      <nav className={mobileOpen?'nav open':'nav'}>
        {(['home','shop','contact'] as const).map(x=><button key={x} className={page===x?'active':''} onClick={()=>go(x)}>{x.toUpperCase()}</button>)}
      </nav>
      <div className="header-actions"><button className="bag-button" onClick={()=>setCartOpen(true)} aria-label="Open shopping bag"><ShoppingBag size={18}/><span>BAG ({count})</span></button><button className="menu-button" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen?<X/>:<Menu/>}</button></div>
    </header>

    {page==='home'&&!selected&&<main>
      <section className="hero hero-minimal">
        <div className="hero-image"></div><div className="hero-grain"></div>
        <div className="hero-center"><div className="logo-stage"><span className="logo-orbit orbit-one"></span><span className="logo-orbit orbit-two"></span><img className="hero-logo" src="/cartel-logo.png" alt="CARTEL — Wear Your Identity"/></div><p className="hero-signature">WEAR YOUR IDENTITY</p></div>
      </section>
      <div className="ticker"><div>NO RISK. NO STORY. &nbsp; ✳ &nbsp; NO RISK. NO STORY. &nbsp; ✳ &nbsp; NO RISK. NO STORY. &nbsp; ✳ &nbsp; NO RISK. NO STORY. &nbsp; ✳ &nbsp;</div></div>
      <section className="home-collection">
        <div className="product-grid">{productCards}</div>
      </section>
    </main>}

    {page==='shop'&&!selected&&<main className="page-shell"><div className="product-grid">{productCards}</div></main>}
    {selected&&<main className="page-shell detail-page"><button className="back-link" onClick={()=>setSelected(null)}><ArrowLeft size={15}/> BACK TO SHOP</button><div className="detail-grid"><div className="detail-photo"><img src={selected.image_url} alt={selected.name}/><span>FRONT / 001</span></div><div className="detail-info"><p className="eyebrow">{selected.category} / CARTEL 001</p><h1>{selected.name}</h1><p className="detail-price">{money(selected.price)}</p><p className="detail-description">{selected.description}</p><label className="field-label">SIZE <span>SIZE GUIDE</span></label><div className="size-options">{selected.sizes.map(s=><button className={size===s?'chosen':''} onClick={()=>setSize(s)} key={s}>{s}</button>)}</div><label className="field-label">COLOR</label><div className="color-options">{selected.colors.map(c=><button className={color===c?'chosen':''} onClick={()=>setColor(c)} key={c}><i/> {c}</button>)}</div><label className="field-label">QUANTITY</label><div className="quantity"><button onClick={()=>setQty(Math.max(1,qty-1))}><Minus size={14}/></button><span>{qty}</span><button onClick={()=>setQty(qty+1)}><Plus size={14}/></button></div><button className="button button-light full" onClick={()=>{add(selected,size,color,qty);setCartOpen(true)}}>ADD TO BAG — {money(selected.price*qty)} <ShoppingBag size={16}/></button><p className="detail-note"><ShieldCheck size={15}/> SECURE CHECKOUT · CASH ON DELIVERY AVAILABLE</p><div className="accordion"><details open><summary>PRODUCT DETAILS</summary><p>{selected.description} Designed with a relaxed athletic sensibility and the CARTEL signature.</p></details><details><summary>SHIPPING & RETURNS</summary><p>Livraison gratuite partout au Maroc. Contact our team for sizing or return questions before ordering.</p></details></div></div></div></main>}

    {page==='contact'&&<main className="page-shell contact-page"><p className="eyebrow">CARTEL / GET IN TOUCH</p><h1>LET'S TALK<span>.</span></h1><p>Questions about sizing, delivery or your order? Reach out.</p><a className="button button-light" href="https://wa.me/212600000000" target="_blank" rel="noreferrer">WHATSAPP SUPPORT <ArrowRight size={16}/></a><a className="contact-social" href="https://instagram.com/" target="_blank" rel="noreferrer"><Instagram/> INSTAGRAM</a><p className="small-note">Replace the placeholder WhatsApp number and social links with your official accounts.</p></main>}

    {page==='admin'&&<main className="page-shell admin-page"><p className="eyebrow">CARTEL / PRIVATE ACCESS</p><h1>ADMIN<span>.</span></h1>{!admin?<form className="admin-login" onSubmit={login}><label>EMAIL<input type="email" value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} required/></label><label>PASSWORD<input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} required/></label><button className="button button-light">SIGN IN</button></form>:<><div className="admin-bar"><h2>ORDERS ({orders.length})</h2><button className="text-link" onClick={logout}>SIGN OUT</button></div>{orders.map(o=><div className="order-row" key={o.id}><div><b>{o.order_number}</b><p>{o.customer_name} · {o.phone} · {money(o.total)}</p></div><select value={o.status} onChange={e=>statusOrder(o.id,e.target.value)}>{['New','Confirmed','Preparing','Shipped','Delivered','Cancelled'].map(s=><option>{s}</option>)}</select></div>)}</>}</main>}

    <footer className="footer"><div className="footer-main"><div><button className="footer-logo" onClick={()=>go('home')}>CARTEL<span>®</span></button><p>WEAR YOUR IDENTITY.</p></div><div><p className="eyebrow">EXPLORE</p><button onClick={()=>go('shop')}>SHOP ALL</button><button onClick={()=>go('contact')}>CONTACT</button></div><div><p className="eyebrow">FOLLOW THE MOVEMENT</p><a href="https://instagram.com/" target="_blank" rel="noreferrer">INSTAGRAM ↗</a><a href="https://tiktok.com/" target="_blank" rel="noreferrer">TIKTOK ↗</a></div></div></footer>

    {cartOpen&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setCartOpen(false)}}><aside className="cart-drawer"><div className="drawer-head"><div><p className="eyebrow">CARTEL / YOUR BAG</p><h2>THE BAG ({count})</h2></div><button onClick={()=>setCartOpen(false)}><X/></button></div>{!checkout?<>{cart.length===0?<div className="empty-cart"><Emblem/><h3>YOUR BAG IS EMPTY.</h3><button className="button button-light" onClick={()=>{setCartOpen(false);go('shop')}}>DISCOVER THE DROP</button></div>:<><div className="cart-items">{cart.map((l,i)=><div className="cart-item" key={`${l.product.id}-${l.size}-${l.color}`}><img src={l.product.image_url}/><div className="cart-item-info"><h3>{l.product.name}</h3><p>SIZE {l.size} / {l.color}</p><strong>{money(l.product.price*l.qty)}</strong><div className="quantity compact"><button onClick={()=>updateQty(i,l.qty-1)}><Minus size={12}/></button><span>{l.qty}</span><button onClick={()=>updateQty(i,l.qty+1)}><Plus size={12}/></button><button className="remove" onClick={()=>remove(i)}>REMOVE</button></div></div></div>)}</div><div className="cart-summary"><div><span>SUBTOTAL</span><b>{money(subtotal)}</b></div><div><span>DELIVERY</span><b>{delivery===0?'FREE':money(delivery)}</b></div><div className="total"><span>TOTAL</span><b>{money(total)}</b></div><p>Livraison gratuite partout au Maroc.</p><button className="button button-light full" onClick={()=>setCheckout(true)}>PROCEED TO CHECKOUT <ArrowRight size={16}/></button></div></>}</>:<><button className="back-link" onClick={()=>setCheckout(false)}><ArrowLeft size={14}/> BACK TO BAG</button><form className="checkout-form" onSubmit={submitOrder}><p className="eyebrow">معلومات التوصيل</p><h2>فين نوصّلو ليك؟</h2>{([['full_name','الاسم الكامل','text'],['phone','رقم الهاتف','tel'],['email','البريد الإلكتروني','email'],['city','المدينة','text'],['address','العنوان بالتفصيل','text']] as const).map(([key,label,type])=><label key={key}>{label}<input type={type} value={customer[key]} onChange={e=>setCustomer({...customer,[key]:e.target.value})} required/></label>)}<div className="checkout-total"><span>المجموع</span><b>{money(total)}</b></div><p className="small-note">الدفع عند الاستلام. سيتم التواصل معك لتأكيد الطلب.</p><button className="button button-light full" disabled={busy}>{busy?'جارٍ إرسال الطلب…':'تأكيد الطلب'}</button></form></>}</aside></div>}
    {orderNo&&<div className="success-modal"><div><Emblem/><p className="eyebrow">ORDER RECEIVED</p><h2>YOU'RE IN.</h2><p>Your order reference is</p><strong>{orderNo}</strong><p>Our team will contact you to confirm delivery details.</p><button className="button button-light" onClick={()=>{setOrderNo('');go('home')}}>BACK TO CARTEL</button></div></div>}
    {notice&&<div className="toast">{notice}</div>}
    {!backendReady&&<div className="demo-flag">DEMO STORE · BACKEND NOT CONNECTED</div>}
  </div>;
}
function ArrowUpRight(){return <ArrowRight size={14}/>}
export default App;
