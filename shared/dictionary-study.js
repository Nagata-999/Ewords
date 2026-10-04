/* Fetch one pre-rendered page, then reuse the existing sushian quiz and learning store. */
window.SushiDictionaryStudy=async function(slug){
  if(!/^(?:[a-z0-9-]|~[a-f0-9]+~)+$/.test(slug)||slug.length>500)throw Error('invalid word');
  const response=await fetch('/dictionary/'+slug+'/');if(!response.ok)throw Error('missing word');
  const doc=new DOMParser().parseFromString(await response.text(),'text/html');
  const card=JSON.parse(doc.querySelector('#dictionary-card').textContent);
  const id=SushiLearning.registerDictionaryWord(card);if(!id)throw Error('invalid card');
  return {id:card.en,word_id:id,word:card.en,meaning:card.jp};
};
