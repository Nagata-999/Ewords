// Sushi Quiz: Current Companies — intentionally small and date-sensitive.
// Facts reviewed for September 2026. Refresh periodically.
(() => {
const EXTRA=[
{cat:'Current Companies',q:'Who is the CEO of NVIDIA?',choices:['Jensen Huang','Satya Nadella','Tim Cook','Andy Jassy'],ans:0,exp:'Jensen Huang is NVIDIA’s co-founder, president, and CEO.'},
{cat:'Current Companies',q:'Which company is led by CEO Sam Altman?',choices:['OpenAI','NVIDIA','Amazon','Apple'],ans:0,exp:'Sam Altman is the CEO of OpenAI.'},
{cat:'Current Companies',q:'Which company is most closely associated with the CUDA computing platform?',choices:['NVIDIA','Netflix','Spotify','Airbnb'],ans:0,exp:'CUDA is NVIDIA’s parallel-computing platform and programming model.'},
{cat:'Current Companies',q:'Which company operates Amazon Web Services (AWS)?',choices:['Amazon','Microsoft','Alphabet','Meta'],ans:0,exp:'AWS is Amazon’s cloud-computing business.'},
{cat:'Current Companies',q:'Which company develops Windows and Azure?',choices:['Microsoft','Apple','NVIDIA','Netflix'],ans:0,exp:'Windows and the Azure cloud platform are Microsoft products.'},
{cat:'Current Companies',q:'Which company develops the iPhone?',choices:['Apple','Samsung','Microsoft','Sony'],ans:0,exp:'Apple develops the iPhone.'},
{cat:'Current Companies',q:'Which company owns Instagram?',choices:['Meta','Alphabet','Amazon','Microsoft'],ans:0,exp:'Instagram is owned by Meta.'},
{cat:'Current Companies',q:'Which company owns YouTube?',choices:['Google','Meta','Netflix','Amazon'],ans:0,exp:'YouTube is owned by Google.'},
{cat:'Current Companies',q:'Which company is best known for ChatGPT?',choices:['OpenAI','NVIDIA','Intel','Oracle'],ans:0,exp:'ChatGPT is developed by OpenAI.'},
{cat:'Current Companies',q:'Which company is strongly associated with the GeForce line of GPUs?',choices:['NVIDIA','Amazon','Spotify','Salesforce'],ans:0,exp:'GeForce is an NVIDIA GPU brand.'},
{cat:'Current Companies',q:'Which company began as an online bookstore?',choices:['Amazon','Netflix','Airbnb','Uber'],ans:0,exp:'Amazon began as an online bookseller before expanding into many other businesses.'},
{cat:'Current Companies',q:'Which company created the Android mobile operating system now developed by Google?',choices:['Android Inc.','Apple','NVIDIA','Meta'],ans:0,exp:'Android began at Android Inc., which Google acquired in 2005; Google later developed Android into a major mobile platform.'},
{cat:'Current Companies',q:'Which company operates the LinkedIn professional network?',choices:['Microsoft','Meta','Alphabet','Amazon'],ans:0,exp:'Microsoft owns LinkedIn.'},
{cat:'Current Companies',q:'Which company is associated with the Photoshop software?',choices:['Adobe','Oracle','Intel','Spotify'],ans:0,exp:'Photoshop is an Adobe product.'},
{cat:'Current Companies',q:'Which company is best known for the database product MySQL after acquiring Sun Microsystems?',choices:['Oracle','Netflix','NVIDIA','Airbnb'],ans:0,exp:'Oracle acquired Sun Microsystems, which had previously acquired MySQL AB, and MySQL is now developed under Oracle.'},
{cat:'Current Companies',q:'Which company is known for the streaming service that began with DVD-by-mail rentals?',choices:['Netflix','Spotify','Amazon','Uber'],ans:0,exp:'Netflix began with DVD rentals by mail before becoming a major streaming service.'},
{cat:'Current Companies',q:'Which company is best known for a music-streaming service founded in Sweden?',choices:['Spotify','Netflix','Adobe','Intel'],ans:0,exp:'Spotify is a Swedish-founded audio-streaming company.'},
{cat:'Current Companies',q:'Which company is associated with the cloud CRM platform Salesforce?',choices:['Salesforce','Adobe','Meta','Apple'],ans:0,exp:'Salesforce is a major provider of cloud-based customer relationship management software.'},
{cat:'Current Companies',q:'Which company manufactures the Ryzen family of processors?',choices:['AMD','NVIDIA','Amazon','Oracle'],ans:0,exp:'Ryzen is AMD’s family of consumer processors.'},
{cat:'Current Companies',q:'Which company is historically associated with the x86 processor families Core and Xeon?',choices:['Intel','Spotify','Netflix','Adobe'],ans:0,exp:'Intel produces the Core and Xeon processor families.'},
{cat:'Current Companies',q:'Which company operates the Airbnb accommodation marketplace?',choices:['Airbnb','Uber','Amazon','Netflix'],ans:0,exp:'Airbnb operates its namesake marketplace for stays and experiences.'},
{cat:'Current Companies',q:'Which company is best known for its ride-hailing app and Uber Eats?',choices:['Uber','Airbnb','Spotify','Adobe'],ans:0,exp:'Uber operates its ride-hailing platform and Uber Eats.'},
{cat:'Current Companies',q:'Which Japanese company created the PlayStation brand?',choices:['Sony','Nintendo','Toyota','Honda'],ans:0,exp:'PlayStation is a Sony gaming brand.'},
{cat:'Current Companies',q:'Which Japanese company created the Switch game console?',choices:['Nintendo','Sony','Honda','Canon'],ans:0,exp:'Nintendo develops the Nintendo Switch.'},
{cat:'Current Companies',q:'Which Japanese company is strongly associated with the Prius hybrid car?',choices:['Toyota','Sony','Nintendo','Canon'],ans:0,exp:'Toyota introduced the Prius as a mass-produced hybrid vehicle.'},
{cat:'Current Companies',q:'Which company was founded by Soichiro Honda?',choices:['Honda','Toyota','Sony','Nintendo'],ans:0,exp:'Soichiro Honda co-founded Honda Motor.'},
{cat:'Current Companies',q:'Which company was co-founded by Akio Morita and Masaru Ibuka?',choices:['Sony','Honda','Nintendo','Panasonic'],ans:0,exp:'Masaru Ibuka and Akio Morita were the key founders of the company that became Sony.'},
{cat:'Current Companies',q:'Which company is the parent company of Google?',choices:['Alphabet','Meta','Amazon','Oracle'],ans:0,exp:'Alphabet is Google’s parent company.'},
{cat:'Current Companies',q:'Which company operates Facebook, Instagram, and WhatsApp?',choices:['Meta','Alphabet','Microsoft','Amazon'],ans:0,exp:'Meta owns Facebook, Instagram, and WhatsApp.'},
{cat:'Current Companies',q:'Which company is closely associated with the Kindle e-reader?',choices:['Amazon','Apple','Adobe','Netflix'],ans:0,exp:'Kindle is Amazon’s e-reader and e-book platform.'}
];
function merge(){
 if(typeof QUESTIONS==='undefined'||!Array.isArray(QUESTIONS)) return false;
 const existing=new Set(QUESTIONS.map(q=>`${q.cat}::${q.q}`));
 const additions=EXTRA.filter(q=>!existing.has(`${q.cat}::${q.q}`));
 QUESTIONS.push(...additions); window.__sushiQuizCurrentCompaniesLoaded=true;
 if(typeof renderCategoryCards==='function') ['soloCatCards','localCatCards','onlineCatCards','buzzerCatCards'].forEach(renderCategoryCards);
 console.info(`Sushi Quiz: added ${additions.length} Current Companies questions (${QUESTIONS.length} total).`); return true;
}
if(!merge()) setTimeout(merge,500);
})();