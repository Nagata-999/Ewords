from pathlib import Path
import re
p=Path('sushigacha/site-taskbar.js')
t=p.read_text(encoding='utf-8')
pat=r'''if\(!document\.querySelector\('script\[src\*="daily-quest-click-bridge\.js"\]'\)\)\{const s=document\.createElement\('script'\);s\.src='/sushigacha/daily-quest-click-bridge\.js\?v=[^']+';document\.head\.appendChild\(s\)\}'''
rep="""{const page=decodeURIComponent((location.pathname.split('/').pop()||'').toLowerCase());if((page==='sushi_idiom (1).html'||page==='sushi_idiom.html')&&!document.querySelector('script[src*=\"daily-quest-click-bridge.js\"]')){const s=document.createElement('script');s.src='/sushigacha/daily-quest-click-bridge.js?v=20260914-5';document.head.appendChild(s)}}"""
new,n=re.subn(pat,rep,t,count=1)
if n!=1:
    raise SystemExit(f'bridge autoload pattern matches: {n}')
p.write_text(new,encoding='utf-8')
print('limited legacy bridge autoload to idiom')
