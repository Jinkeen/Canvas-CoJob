const app = 'http://127.0.0.1:4173';
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== 'capture' || sender.id !== chrome.runtime.id || !sender.tab) return;
  (async () => {
    const response = await fetch(app + '/api/captures', {
      method: 'POST', headers: {'Content-Type':'application/json','X-Coworker-Capture':'1'},
      body: JSON.stringify({...message.data, sourceUrl: sender.url})
    });
    if (!response.ok) throw new Error('摘录未保存，请检查文字与用途。');
    const {id} = await response.json();
    await chrome.tabs.create({url: app + '/#receipt=' + encodeURIComponent(id)});
    respond({ok:true});
  })().catch(error => respond({error: error.message === 'Failed to fetch'
    ? '请先启动本机 Canvas-CoJob（4173 端口），再重试。' : error.message}));
  return true;
});
