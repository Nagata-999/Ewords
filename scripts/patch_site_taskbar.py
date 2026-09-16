from pathlib import Path
p=Path('sushigacha/site-taskbar.js')
s=p.read_text(encoding='utf-8')
# Never write from render(): write() emits the same event render listens to.
s=s.replace("else{c.disabled=true;c.textContent=`🔒 あと ${COUNT-done} 個`};write(l)}","else{c.disabled=true;c.textContent=`🔒 あと ${COUNT-done} 個`}}")
# Restore navigation from daily quest rows if an earlier patch omitted it.
needle="sheet.querySelector('#sdqChest').onclick=chest;"
if "#sdqRows').addEventListener('click'" not in s:
    s=s.replace(needle,needle+"sheet.querySelector('#sdqRows').addEventListener('click',e=>{const row=e.target.closest?.('.sdq-row');if(!row)return;e.preventDefault();e.stopPropagation();const href=row.getAttribute('href');if(href){sheet.classList.remove('open');window.location.assign(new URL(href,window.location.origin).href)}});")
# Restore useful bottom clearances for game UIs.
marker="body.sushi-taskbar-on{padding-bottom:max(124px,calc(96px + env(safe-area-inset-bottom)))}"
extra="body.sushi-taskbar-on{padding-bottom:max(124px,calc(96px + env(safe-area-inset-bottom)));scroll-padding-bottom:max(124px,calc(96px + env(safe-area-inset-bottom)))}body.sushi-taskbar-on .modal{padding-bottom:max(124px,calc(96px + env(safe-area-inset-bottom)))!important;scroll-padding-bottom:max(124px,calc(96px + env(safe-area-inset-bottom)))}body.sushi-taskbar-on #homeAvatarWalker{bottom:72px!important}body.sushi-taskbar-on #sushiAvatarWidget{bottom:76px!important}body.sushi-taskbar-on #sushiGemToast{bottom:84px!important}body.sushi-taskbar-on #controlBar{bottom:64px!important}"
s=s.replace(marker,extra)
p.write_text(s,encoding='utf-8')
print('patched site-taskbar.js')
