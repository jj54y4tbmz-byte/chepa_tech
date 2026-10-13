const DATA = {
  groups: [
    {id:'nemodnye', name:'Немодные', desc:'6 составов · оборудование · Stage Plan · костюмы'},
    {id:'rvi-bayan', name:'Рви Баян', desc:'Оборудование · Stage Plan · костюмы'},
    {id:'true-party-band', name:'True Party Band', desc:'Оборудование · Stage Plan · костюмы'},
    {id:'konchiki', name:'На Кончиках Пальцев', desc:'Оборудование · Stage Plan · костюмы'}
  ],
  venues: [
    {name:'A2', city:'Санкт-Петербург', sound:'Звук: L-Acoustics', load:'Занос: лёгкий', cls:'blue'},
    {name:'Aurora', city:'Санкт-Петербург', sound:'Звук: d&b', load:'Занос: средний', cls:''},
    {name:'Космонавт', city:'Санкт-Петербург', sound:'Звук: L-Acoustics', load:'Занос: средний', cls:''},
    {name:'Севкабель', city:'Санкт-Петербург', sound:'Несколько пространств', load:'Занос: сложный', cls:'red'}
  ],
  standards: [
  {
    "name": "Алгоритм действий при возникновении технических проблем во время концерта",
    "file": "technical-problems.pdf"
  },
  {
    "name": "Алгоритм действий при нештатных ситуациях",
    "file": "emergency-situations.pdf"
  },
  {
    "name": "Алгоритм саундчека",
    "file": "soundcheck.pdf"
  },
  {
    "name": "Стандарт взаимодействия техника с организатором или заказчиком в день мероприятия",
    "file": "organizer-interaction.pdf"
  },
  {
    "name": "Стандарт использования служебных автомобилей",
    "file": "company-vehicles.pdf"
  },
  {
    "name": "Стандарт общения в чатах",
    "file": "chat-communication.pdf"
  },
  {
    "name": "Стандарт отчета после мероприятия",
    "file": "event-report.pdf"
  },
  {
    "name": "Стандарт работы на складе",
    "file": "warehouse.pdf"
  },
  {
    "name": "Стандарт съемки гримерки",
    "file": "dressing-room-filming.pdf"
  },
  {
    "name": "Стандарт съемки на концерте",
    "file": "concert-filming.pdf"
  }
],
  repair: [
    ['Кабели','XLR, Jack, Speakon, CAT и другое'],
    ['IEM / RF','Радиосистемы, антенны, мониторинг'],
    ['Playback','Mac, интерфейсы, DAW, MIDI'],
    ['Микшеры / Stagebox','Midas, Behringer и другое']
  ]
};

const screen = document.querySelector('#screen');
const backBtn = document.querySelector('#backBtn');
const title = document.querySelector('#screenTitle');
const searchInput = document.querySelector('#searchInput');
const brandHome = document.querySelector('#brandHome');

let routeStack = ['home'];
let activeRoute = 'home';
let pdfTask = null;
let pdfSession = 0;
let pdfLibrary;

function closePdf(){
  pdfSession++;
  if(pdfTask){ pdfTask.destroy(); pdfTask = null; }
}

async function showPdf(doc){
  const session = pdfSession;
  const status = screen.querySelector('.pdf-status');
  try {
    pdfLibrary ||= import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.mjs');
    const pdfjs = await pdfLibrary;
    if(session !== pdfSession) return;
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.worker.mjs';
    pdfTask = pdfjs.getDocument(new URL(doc.file, location.href).href);
    const pdf = await pdfTask.promise;
    if(session !== pdfSession) return;
    const pages = screen.querySelector('.pdf-pages');
    status.textContent = `Страниц: ${pdf.numPages}`;
    for(let n=1; n<=pdf.numPages; n++){
      const page = await pdf.getPage(n);
      if(session !== pdfSession) return;
      const width = Math.max(280, pages.clientWidth);
      const viewport = page.getViewport({scale: width / page.getViewport({scale:1}).width});
      const canvas = document.createElement('canvas');
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(viewport.width * ratio);
      canvas.height = Math.ceil(viewport.height * ratio);
      canvas.setAttribute('aria-label', `Страница ${n} из ${pdf.numPages}`);
      canvas.setAttribute('role', 'img');
      pages.append(canvas);
      await page.render({canvasContext:canvas.getContext('2d'), viewport,
        transform:[ratio,0,0,ratio,0,0]}).promise;
      page.cleanup();
    }
  } catch(error){
    if(session !== pdfSession) return;
    status.textContent = 'Не удалось загрузить документ. Проверьте интернет и попробуйте снова.';
    const retry = document.createElement('button');
    retry.className = 'list-item';
    retry.textContent = 'Повторить загрузку';
    retry.addEventListener('click', ()=>render());
    status.after(retry);
  }
}

function setHeader(t, s, placeholder='Поиск'){
  title.textContent = t;
  searchInput.placeholder = placeholder;
  backBtn.classList.toggle('hidden', activeRoute === 'home');
}

function listItem(icon, heading, sub, extra=''){
  return `<button class="list-item searchable">
    <div class="list-icon">${icon}</div>
    <div class="list-main"><h4>${heading}</h4><p>${sub}</p>${extra}</div>
    <div class="list-chevron">›</div>
  </button>`;
}

function navigate(route, push=true){
  activeRoute = route;
  if(push && routeStack[routeStack.length-1] !== route) routeStack.push(route);
  render();
  window.scrollTo({top:0, behavior:'smooth'});
}

function render(){
  closePdf();
  searchInput.value = '';
  searchInput.closest('.search-wrap').classList.toggle('hidden', activeRoute.startsWith('standard:'));
  document.querySelector('.app-shell').classList.toggle('reading-pdf', activeRoute.startsWith('standard:'));
  if(activeRoute === 'home'){
    setHeader('Лихтер-техник','ОБОРУДОВАНИЕ · ЛЮДИ · ПРОЦЕССЫ','Поиск');
    screen.innerHTML = document.querySelector('#homeTemplate').innerHTML;
    screen.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.route)));
    return;
  }

  if(activeRoute === 'groups'){
    setHeader('Группы','СОСТАВЫ И МАТЕРИАЛЫ','Поиск по группам');
    screen.innerHTML = `<div class="list">${DATA.groups.map(g=>`
      <button class="list-item searchable" data-group="${g.id}">
        <div class="list-icon">◫</div>
        <div class="list-main"><h4>${g.name}</h4><p>${g.desc}</p></div>
        <div class="list-chevron">›</div>
      </button>`).join('')}</div>`;
    screen.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>navigate(`group:${b.dataset.group}`)));
    return;
  }

  if(activeRoute.startsWith('group:')){
    const id = activeRoute.split(':')[1];
    const g = DATA.groups.find(x=>x.id===id) || DATA.groups[0];
    setHeader(g.name,'ГРУППА · МАТЕРИАЛЫ','Поиск по разделу');
    if(id === 'nemodnye'){
      const eq = Array.from({length:6},(_,i)=>listItem('▣',`Оборудование — Состав ${i+1}`,'Полный список оборудования'));
      screen.innerHTML = `
        <div class="section-title">Списки оборудования</div>
        <div class="list">${eq.join('')}</div>
        <div class="section-title" style="margin-top:22px">Stage Plan</div>
        <div class="subgrid">
          <button class="subcard searchable"><div>⌁</div><div class="big">Обычный</div><div class="mini">состав</div></button>
          <button class="subcard searchable"><div>⌁</div><div class="big">M</div><div class="mini">состав</div></button>
          <button class="subcard searchable"><div>⌁</div><div class="big">XL</div><div class="mini">состав</div></button>
        </div>
        <div class="section-title" style="margin-top:22px">Костюмы</div>
        <div class="list">${listItem('⌘','Общий список костюмов','Для всех составов')}</div>
      `;
    } else {
      screen.innerHTML = `<div class="empty">Структура для группы «${g.name}» будет добавлена следующим шагом.</div>`;
    }
    return;
  }

  if(activeRoute === 'standards'){
    setHeader('Стандарты','РЕГЛАМЕНТЫ И ИНСТРУКЦИИ','Поиск по стандартам');
    screen.innerHTML = `<div class="list">${DATA.standards.map(doc=>`
      <button class="list-item searchable" data-standard="${doc.file}">
        <div class="list-icon">▤</div>
        <div class="list-main"><h4>${doc.name}</h4><p>PDF</p></div>
        <div class="list-chevron">›</div>
      </button>`).join('')}</div>`;
    screen.querySelectorAll('[data-standard]').forEach(button=>button.addEventListener('click',()=>navigate(`standard:${button.dataset.standard}`)));
    return;
  }

  if(activeRoute.startsWith('standard:')){
    const doc = DATA.standards.find(item=>item.file === activeRoute.slice(9));
    if(!doc){ navigate('standards', false); return; }
    setHeader(doc.name, '');
    screen.innerHTML = '<div class="pdf-status" role="status">Загрузка документа…</div><div class="pdf-pages"></div>';
    showPdf(doc);
    return;
  }

  if(activeRoute === 'venues'){
    setHeader('Площадки','ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ','Поиск площадки');
    screen.innerHTML = `<div class="list">${DATA.venues.map(v=>listItem('⌂',v.name,v.city,
      `<div class="pill-row"><span class="pill">${v.sound}</span><span class="pill ${v.cls}">${v.load}</span></div>`)).join('')}</div>`;
    return;
  }

  if(activeRoute === 'repair'){
    setHeader('Ремонт','ДИАГНОСТИКА И РЕШЕНИЯ','Поиск неисправности');
    screen.innerHTML = `<div class="list">${DATA.repair.map(([a,b])=>listItem('⌁',a,b)).join('')}</div>`;
    return;
  }

}

backBtn.addEventListener('click',()=>{
  if(routeStack.length>1) routeStack.pop();
  activeRoute = routeStack[routeStack.length-1] || 'home';
  render();
});

brandHome.addEventListener('click',()=>{routeStack=['home']; activeRoute='home'; render();});

searchInput.addEventListener('input',()=>{
  const q = searchInput.value.trim().toLowerCase();
  document.querySelectorAll('.searchable').forEach(el=>{
    el.style.display = !q || el.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

if(window.Telegram?.WebApp){
  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();
  try{
    tg.setHeaderColor('#080b10');
    tg.setBackgroundColor('#080b10');
  }catch(e){}
}

render();
