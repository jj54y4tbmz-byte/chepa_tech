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
    screen.innerHTML = `<div class="grid home-grid groups-grid">${DATA.groups.map(g=>`
      <button class="card nav-card group-logo-card searchable" data-group="${g.id}" aria-label="${g.name}">
        <img src="./logo-${g.id}-white.png" alt="${g.name}" />
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

const SEARCH_KEYWORDS = {
  'technical-problems.pdf': 'поломка неисправность пропал звук отказ оборудования концерт',
  'emergency-situations.pdf': 'авария происшествие экстренный опасность пожар',
  'soundcheck.pdf': 'саундчек саунд чек проверка звук настройка',
  'organizer-interaction.pdf': 'организатор заказчик клиент общение взаимодействие',
  'company-vehicles.pdf': 'машина авто автомобиль транспорт поездка водитель',
  'chat-communication.pdf': 'чат переписка сообщения общение',
  'event-report.pdf': 'отчет отчёт отчетность мероприятие концерт',
  'warehouse.pdf': 'склад хранение оборудование выдача возврат',
  'dressing-room-filming.pdf': 'гримерка гримёрка съемка фото видео',
  'concert-filming.pdf': 'концерт съемка фото видео'
};

function normalizeSearch(text){
  return text.toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/g,' ').trim();
}

function searchForms(text){
  const en = "qwertyuiop[]asdfghjkl;'zxcvbnm,.";
  const ru = "йцукенгшщзхъфывапролджэячсмитьбю";
  const forms = [normalizeSearch(text)];
  if(/[a-z]/i.test(text)) forms.push(normalizeSearch([...text.toLowerCase()].map(c=>en.includes(c)?ru[en.indexOf(c)]:c).join('')));
  if(/[а-яё]/i.test(text)) forms.push(normalizeSearch([...text.toLowerCase()].map(c=>ru.includes(c)?en[ru.indexOf(c)]:c).join('')));
  return [...new Set(forms)].filter(Boolean);
}

function searchStem(word){
  return word.length < 5 ? word : word.replace(/(иями|ями|ами|ого|ему|ому|ией|ий|ый|ой|ая|яя|ое|ее|ые|ие|ов|ев|ах|ях|ам|ям|ом|ем|а|я|ы|и|у|ю|е|о)$/,'');
}

function searchDistance(a,b){
  const rows = Array.from({length:a.length+1},(_,i)=>Array(b.length+1).fill(0));
  for(let i=0;i<=a.length;i++) rows[i][0]=i;
  for(let j=0;j<=b.length;j++) rows[0][j]=j;
  for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++){
    rows[i][j]=Math.min(rows[i-1][j]+1,rows[i][j-1]+1,rows[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
    if(i>1 && j>1 && a[i-1]===b[j-2] && a[i-2]===b[j-1]) rows[i][j]=Math.min(rows[i][j],rows[i-2][j-2]+1);
  }
  return rows[a.length][b.length];
}

function searchScore(query, name, keywords=''){
  const title = normalizeSearch(name);
  const words = title.split(' ');
  const aliases = normalizeSearch(keywords).split(' ');
  let best = 0;
  for(const form of searchForms(query)){
    if(title === form){ best=Math.max(best,1000); continue; }
    const tokens = form.split(' ');
    let total = 0;
    for(const token of tokens){
      let score = 0;
      for(const [source, weight] of [[words,100],[aliases,65]]){
        for(const word of source){
          if(word===token) score=Math.max(score,weight);
          else if(word.startsWith(token)) score=Math.max(score,weight-10);
          else if(token.length>=3 && word.includes(token)) score=Math.max(score,weight-20);
          else if(token.length>=4 && searchStem(word)===searchStem(token)) score=Math.max(score,weight-15);
          else if(token.length>=4 && Math.abs(word.length-token.length)<=2 && searchDistance(token,word)<=(token.length>=7?2:1)) score=Math.max(score,weight-40);
        }
      }
      if(!score){ total=0; break; }
      total+=score;
    }
    best=Math.max(best,total+(title.includes(form)?200:0));
  }
  return best;
}

function searchCatalog(){
  return [
    ...DATA.groups.map(g=>({name:g.name,section:'Группы',route:'group:'+g.id,keywords:g.desc+' '+({'rvi-bayan':'rvi bayan','nemodnye':'nemodnye','konchiki':'на кончиках пальцев'}[g.id]||'')})),
    ...DATA.standards.map(d=>({name:d.name,section:'Стандарты',route:'standard:'+d.file,keywords:SEARCH_KEYWORDS[d.file]||''})),
    ...DATA.venues.map(v=>({name:v.name,section:'Площадки',route:'venues',keywords:v.city+' '+v.sound})),
    ...DATA.repair.map(([name,keywords])=>({name,section:'Ремонт',route:'repair',keywords})),
    ...[['Группы','groups'],['Стандарты','standards'],['Ремонт','repair'],['Площадки','venues']].map(([name,route])=>({name,route,section:'Раздел',keywords:''}))
  ];
}

function runSearch(query){
  if(activeRoute==='home'){
    if(!query.trim()){render();searchInput.focus();return;}
    const hits=searchCatalog().map(item=>({...item,score:searchScore(query,item.name,item.keywords)})).filter(item=>item.score>0).sort((a,b)=>b.score-a.score);
    screen.innerHTML=hits.length ? '<div class="list search-results"></div>' : '<div class="empty" role="status">Ничего не найдено. Попробуйте другое слово.</div>';
    const list=screen.querySelector('.search-results');
    for(const hit of hits){
      const button=document.createElement('button');
      button.className='list-item';
      const copy=document.createElement('div');copy.className='list-main';
      const heading=document.createElement('h4');heading.textContent=hit.name;
      const section=document.createElement('p');section.textContent=hit.section;
      copy.append(heading,section);button.append(copy);
      button.addEventListener('click',()=>navigate(hit.route));
      list.append(button);
    }
    return;
  }
  const elements=[...screen.querySelectorAll('.searchable')];
  const scored=elements.map((el,index)=>{
    const key=el.dataset.standard;
    const name=el.getAttribute('aria-label')||el.textContent;
    return {el,index,score:query.trim()?searchScore(query,name,SEARCH_KEYWORDS[key]||''):1};
  });
  scored.sort((a,b)=>b.score-a.score||a.index-b.index).forEach(({el,score},index)=>{el.style.display=score?'':'none';el.style.order=query.trim()?index:'';});
  screen.querySelector('.search-empty')?.remove();
  if(elements.length && !scored.some(item=>item.score)){
    const empty=document.createElement('div');empty.className='empty search-empty';empty.setAttribute('role','status');empty.textContent='Ничего не найдено. Попробуйте другое слово.';screen.append(empty);
  }
}

searchInput.addEventListener('input',()=>runSearch(searchInput.value));

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
