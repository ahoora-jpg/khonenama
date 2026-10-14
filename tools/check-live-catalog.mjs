const routes=[
 ['/search?q='+encodeURIComponent('مینیمال'),'پرده مینیمال'],
 ['/search?q=minimalist%20curtain','پرده مینیمال'],
 ['/category/lighting','نورپردازی داخلی منزل'],
 ['/magazine/interior-lighting-guide','نورپردازی داخلی منزل'],
 ['/magazine/minimalist-curtain-guide','آیا میل‌پرده قدیمی'],
 ['/magazine','پرده مینیمال؛ آیا میل‌پرده قبلی مناسب است؟'],
 ['/services/curtain/'+encodeURIComponent('پرده-مینیمال'),'پرده مینیمال'],
 ['/services/flooring/'+encodeURIComponent('کفپوش-لینولئوم'),'کفپوش لینولئوم'],
 ['/services/carpet/'+encodeURIComponent('موکت-اکسمینستر'),'موکت اکسمینستر'],
 ['/services/wallpaper/'+encodeURIComponent('دیوارپوش-لینکراستا'),'دیوارپوش لینکراستا'],
];
let failed=false;for(const [path,text] of routes){const r=await fetch('https://khonenama.ir'+path,{signal:AbortSignal.timeout(30000)});const html=await r.text();const ok=r.ok&&html.includes(text);console.log(JSON.stringify({path,status:r.status,passed:ok}));failed ||= !ok;}
if(failed)process.exitCode=1;
