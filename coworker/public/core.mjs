export const CATEGORIES = {
  idea: { label: '产品启发', short: '启发', color: '#515257', background: '#f0f0f2', icon: 'spark' },
  solution: { label: '技术方案', short: '方案', color: '#515257', background: '#f0f0f2', icon: 'code' },
  action: { label: '行动待办', short: '行动', color: '#515257', background: '#f0f0f2', icon: 'check' },
  inbox: { label: '待整理', short: '收集', color: '#515257', background: '#f0f0f2', icon: 'inbox' },
};
export const WIDTH = 300;
export const HEIGHT = 106;
export const STORAGE_KEY = 'canvas-coworker.workspace.v1';
export const clone = value => JSON.parse(JSON.stringify(value));
export const uid = () => crypto.randomUUID();
const text = (value, max = 16000) => typeof value === 'string' ? value.slice(0, max) : '';
export const safeUrl = value => {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
};
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function classify(quote, intent) {
  const content = (intent || quote).toLowerCase();
  const rules = {
    action: /待办|下一步|跟进|安排|截止|负责人|需要确认|验证|测试一下|todo|deadline/g,
    solution: /算法|接口|架构|数据库|缓存|代码|技术|实现|性能|api|debug|token|rag|服务端/g,
    idea: /需求|交互|体验|产品|用户|启发|引导|灵感|设计|内容|文案|选题|营销/g,
  };
  const scores = Object.entries(rules).map(([key, rule]) => [key, [...content.matchAll(rule)].length]);
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] ? scores[0][0] : 'inbox';
}
export function makeCard(input) {
  if (!text(input.quote).trim()) throw new Error('请先粘贴一段原文。');
  return {
    id: uid(), title: text(input.title, 100).trim() || text(text(input.intent).trim() || text(input.quote).trim(), 28).replace(/\n/g, ' '),
    quote: text(input.quote).trim(), intent: text(input.intent).trim(),
    category: Object.hasOwn(CATEGORIES, input.category) ? input.category : classify(input.quote, input.intent),
    source: text(input.source, 100).trim() || '手动摘录', sourceUrl: safeUrl(input.sourceUrl),
    owner: text(input.owner, 60).trim(), nextStep: text(input.nextStep, 2000).trim(),
    status: input.status === 'done' ? 'done' : 'open',
    x: Number.isFinite(input.x) ? Math.max(24, Math.min(1000000, input.x)) : 48,
    y: Number.isFinite(input.y) ? Math.max(72, Math.min(1000000, input.y)) : 104,
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : new Date().toISOString(),
  };
}
export function createProject(name = '未命名画布') {
  return { id: uid(), name: text(name, 80).trim() || '未命名画布', description: '', cards: [], edges: [] };
}
export function arrange(project) {
  let column = 0;
  for (const category of Object.keys(CATEGORIES)) {
    const cards = project.cards.filter(card => card.category === category);
    if (!cards.length) continue;
    cards.forEach((card, row) => { card.x = 48 + column * 356; card.y = 104 + row * (HEIGHT + 28); });
    column++;
  }
  return project;
}
export function initialWorkspace() {
  const project = createProject('新用户引导 · 体验优化');
  project.description = '示例画布 · 把散落在 AI 对话里的想法，变成团队可以接着做的事。';
  const samples = [
    {title:'把第一次使用，变成一次小成功',quote:'与其在首页介绍所有功能，可以先让用户完成一个最小任务，让价值在第一次操作中被感知。',intent:'用于新用户引导改版。把功能介绍改成「创建第一张摘录卡」，让用户直接体验到价值。',category:'idea',source:'AI 对话 · 产品讨论',owner:'产品同事',nextStep:'画一版首次进入的引导流程。'},
    {title:'保留原话，也保留你的判断',quote:'团队交接需要保留信息来源和结论形成的依据，否则接收者只能看到结果，难以判断适用边界。',intent:'交接卡片需要同时呈现摘录和用途说明；在导出的材料里，也要能回到原始出处。',category:'idea',source:'AI 对话 · 协作探索',owner:'设计同事'},
    {title:'先在本地保存，降低使用门槛',quote:'小型原型可以先使用 localStorage 保存结构化数据，以 JSON 导入导出实现基础迁移，后续再考虑服务端同步。',intent:'这是第一版的数据方案。先把单人整理到文件交接的链路做通，减少部署与账号依赖。',category:'solution',source:'Codex · 技术讨论',owner:'开发同事',nextStep:'验证刷新恢复、导入导出和异常文件处理。'},
    {title:'规则整理先走通，再接模型',quote:'先使用有限的类别和确定的排列规则，能够让画布整理结果稳定、可解释，并降低模型输出异常的影响。',intent:'按用途整理为产品启发、技术方案和行动待办。AI 提炼以建议形式出现，确认后再应用。',category:'solution',source:'AI 对话 · 实现思路',owner:'开发同事'},
    {title:'用一次真实交接来验证',quote:'找一位没有参与前期讨论的同事，让他只阅读交接材料，再复述目标、结论和下一步，以验证信息是否足够。',intent:'下次需求评审前做一次小测试，看看同事能否在两分钟内理解这张画布。',category:'action',source:'AI 对话 · 验证方法',owner:'我',nextStep:'收集一份真实对话，做成三张卡后给同事看。'},
    {title:'确认哪些内容需要补证据',quote:'模型提出的判断可以作为候选假设，但重要的用户结论和性能数据应回到访谈记录或实际测试中确认。',intent:'交接前标记待验证项，避免把 AI 推测写成已验证的产品结论。',category:'action',source:'AI 对话 · 评审清单',owner:'我',nextStep:'为关键结论补充原始记录或测试结果。'},
  ];
  project.cards = samples.map(makeCard);
  project.edges = [{id:uid(),from:project.cards[0].id,to:project.cards[4].id}];
  arrange(project);
  return { version: 1, activeProjectId: project.id, projects: [project] };
}
export function validateWorkspace(input) {
  if (!input || input.version !== 1 || !Array.isArray(input.projects) || !input.projects.length || input.projects.length > 50)
    throw new Error('文件格式不受支持，请选择本应用导出的 JSON 备份。');
  let total = 0;
  const projectIds = new Set();
  const projects = input.projects.map(item => {
    if (!item || typeof item.id !== 'string' || !item.id || projectIds.has(item.id) || !Array.isArray(item.cards) || !Array.isArray(item.edges))
      throw new Error('备份中的画布结构不完整。');
    projectIds.add(item.id);
    total += item.cards.length;
    if (total > 1000) throw new Error('备份最多支持 1000 张卡片。');
    const ids = new Set();
    const cards = item.cards.map(card => {
      if (!card || typeof card.id !== 'string' || !card.id || ids.has(card.id) || typeof card.quote !== 'string' || !card.quote.trim())
        throw new Error('备份中有无效或重复的卡片。');
      ids.add(card.id);
      return { ...makeCard(card), id: card.id };
    });
    if (item.edges.length > 3000) throw new Error('备份中的关联过多。');
    const pairs = new Set();
    const edges = item.edges.flatMap(edge => {
      if (!edge || !ids.has(edge.from) || !ids.has(edge.to) || edge.from === edge.to) return [];
      const pair = JSON.stringify([edge.from, edge.to]);
      if (pairs.has(pair)) return [];
      pairs.add(pair);
      return [{id:uid(),from:edge.from,to:edge.to}];
    });
    return {id:item.id,name:text(item.name,80).trim() || '导入的画布',description:text(item.description,400),cards,edges};
  });
  return {version:1,activeProjectId:projects.some(p=>p.id===input.activeProjectId)?input.activeProjectId:projects[0].id,projects};
}
export function mergeWorkspace(current, imported) {
  const incoming = validateWorkspace(imported);
  if (current.projects.length + incoming.projects.length > 50 ||
      [...current.projects,...incoming.projects].reduce((n,p)=>n+p.cards.length,0)>1000)
    throw new Error('导入后将超过 50 个画布或 1000 张卡片的上限。');
  const projects = incoming.projects.map(project => {
    const ids = new Map(project.cards.map(card => [card.id,uid()]));
    return {...project,id:uid(),name:project.name+'（导入）',cards:project.cards.map(card=>({...card,id:ids.get(card.id)})),
      edges:project.edges.map(edge=>({...edge,id:uid(),from:ids.get(edge.from),to:ids.get(edge.to)}))};
  });
  return {...clone(current),activeProjectId:projects[0].id,projects:[...current.projects,...projects]};
}
export function keywordFor(card) {
  const phrase = card.intent.trim()
    .replace(/^(?:这段(?:文字|内容)?|这句话)?\s*(?:可以用来|主要用于|用于|用来|作为)\s*[：:]?\s*/, '')
    .split(/[。！？；，、,.!?;\n]/u)[0].trim();
  return Array.from(phrase || card.title).slice(0, 20).join('');
}

export function handoffSections(project, selectedIds, logical = false) {
  const selected = selectedIds?.length ? new Set(selectedIds) : null;
  const cards = project.cards.filter(card => !selected || selected.has(card.id));
  if (!logical) {
    return Object.entries(CATEGORIES).map(([key, category]) => ({
      label: category.label, cards: cards.filter(card => card.category === key)
    })).filter(section => section.cards.length);
  }

  const byId = new Map(cards.map(card => [card.id, card]));
  const edges = project.edges.filter(edge => byId.has(edge.from) && byId.has(edge.to));
  const neighbors = new Map();
  const outgoing = new Map();
  const indegree = new Map();
  for (const {from, to} of edges) {
    if (!neighbors.has(from)) neighbors.set(from, []);
    if (!neighbors.has(to)) neighbors.set(to, []);
    neighbors.get(from).push(to);
    neighbors.get(to).push(from);
    if (!outgoing.has(from)) outgoing.set(from, []);
    outgoing.get(from).push(to);
    indegree.set(to, (indegree.get(to) || 0) + 1);
  }

  const seen = new Set();
  const sections = [];
  for (const card of cards) {
    if (!neighbors.has(card.id) || seen.has(card.id)) continue;
    const component = [card.id];
    seen.add(card.id);
    for (const id of component) {
      for (const neighbor of neighbors.get(id)) {
        if (seen.has(neighbor)) continue;
        seen.add(neighbor);
        component.push(neighbor);
      }
    }
    const ordered = component.filter(id => !indegree.get(id));
    for (const id of ordered) {
      for (const target of outgoing.get(id) || []) {
        const remaining = indegree.get(target) - 1;
        indegree.set(target, remaining);
        if (!remaining) ordered.push(target);
      }
    }
    const remaining = component.filter(id => !ordered.includes(id));
    sections.push({
      label: '逻辑组 ' + (sections.length + 1),
      cards: [...ordered, ...remaining].map(id => byId.get(id)),
      note: remaining.length ? '此组存在循环连线，请以各节点的明确指向为准。' : ''
    });
  }
  return sections;
}

export function linkedTitles(project, cards, cardId, logical) {
  const byId = new Map(cards.map(card => [card.id, card]));
  return project.edges.flatMap(edge => {
    if (edge.from === cardId && byId.has(edge.to)) {
      return [(logical ? '指向 ' : '') + keywordFor(byId.get(edge.to))];
    }
    if (!logical && edge.to === cardId && byId.has(edge.from)) {
      return [keywordFor(byId.get(edge.from))];
    }
    return [];
  });
}

export function handoffMarkdown(project, selectedIds, logical = false) {
  const sections = handoffSections(project, selectedIds, logical);
  const cards = sections.flatMap(section => section.cards);
  let result = '# '+project.name+'\n\n'+(!logical&&project.description?project.description+'\n\n':'')+
    '> 共 '+cards.length+' 张摘录卡。用途说明为整理者的判断，原文保留供核对。\n\n';
  for (const {label, cards: group, note} of sections) {
    result += '## '+label+'\n\n';
    if (note) result += note+'\n\n';
    for (const card of group) {
      result += '### '+(logical?keywordFor(card):card.title)+'\n\n';
      result += '**用途说明**\n\n'+(card.intent||'待补充用途说明')+'\n\n';
      result += '**原始摘录**\n\n'+card.quote.split('\n').map(line=>'> '+line).join('\n')+'\n\n';
      result += '**来源**：'+card.source+(card.sourceUrl?' '+card.sourceUrl:'')+'\n\n';
      if(card.owner) result+='**对接人**：'+card.owner+'\n\n';
      if(card.nextStep) result+='**下一步**：'+card.nextStep+'\n\n';
      result+='**状态**：'+(card.status==='done'?'已完成':'待推进')+'\n\n';
      const linked=linkedTitles(project,cards,card.id,logical);
      if(linked.length) result+='**关联**：'+linked.join('、')+'\n\n';
    }
  }
  return result;
}
export function bindHandoffEvidence(root) {
  const view = root.ownerDocument.defaultView;
  let printState;
  root.addEventListener('click', event => {
    const button = event.target.closest('button[data-evidence]');
    if (!button || !root.contains(button)) return;
    const expanded = button.dataset.evidence === 'full';
    root.querySelectorAll('details[data-handoff-evidence]').forEach(detail => {
      detail.open = expanded;
    });
    root.querySelectorAll('button[data-evidence]').forEach(control => {
      control.setAttribute('aria-pressed', String(control === button));
    });
  });
  view.addEventListener('beforeprint', () => {
    if (root.tagName === 'DIALOG' && !root.open) return;
    if (printState) return;
    printState = Array.from(root.querySelectorAll('details[data-handoff-evidence]'),
      detail => [detail, detail.open]);
    for (const [detail] of printState) detail.open = true;
  });
  view.addEventListener('afterprint', () => {
    if (!printState) return;
    for (const [detail, wasOpen] of printState) detail.open = wasOpen;
    printState = undefined;
  });
}

export function handoffHtml(project, selectedIds, logical = false) {
  const sections = handoffSections(project, selectedIds, logical);
  const cards = sections.flatMap(section => section.cards);
  const e=escapeHtml;
  const groups=sections.map(({label,cards:group,note})=>{
    return group.length?'<section><h2>'+e(label)+'</h2>'+(note?'<p>'+e(note)+'</p>':'')+group.map(card=>'<article><h3>'+e(logical?keywordFor(card):card.title)+'</h3><label>用途说明</label><p>'+e(card.intent||'待补充用途说明')+'</p><footer>来源：'+e(card.source)+(card.owner?' · 对接人：'+e(card.owner):'')+' · '+(card.status==='done'?'已完成':'待推进')+'</footer>'+(card.nextStep?'<p class="next">下一步：'+e(card.nextStep)+'</p>':'')+(()=>{const linked=linkedTitles(project,cards,card.id,logical);return linked.length?'<p class="next">关联：'+linked.map(e).join('、')+'</p>':'';})()+'<details data-handoff-evidence><summary>查看原始摘录与出处</summary><blockquote>'+e(card.quote)+'</blockquote>'+(card.sourceUrl?'<a target="_blank" rel="noopener noreferrer" href="'+e(card.sourceUrl)+'">查看原始出处 ↗</a>':'')+'</details></article>').join('')+'</section>':'';
  }).join('');
  return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+e(project.name)+' · 交接简报</title><style>body{margin:0;background:#f5f5f7;color:#202124;font:15px/1.75 -apple-system,BlinkMacSystemFont,system-ui,sans-serif} main{max-width:760px;margin:auto;padding:clamp(24px,6vw,64px)} h1{font-size:clamp(28px,5vw,42px);line-height:1.15;letter-spacing:-.035em} h2{margin-top:36px;font-size:17px}h3{margin:0 0 14px;font-size:20px} small,label,summary,footer{font-size:13px;color:#595b60} article{padding:22px;margin:12px 0;background:#fff;border:1px solid #e2e2e5;border-radius:16px;break-inside:avoid} p,blockquote{white-space:pre-wrap;overflow-wrap:anywhere}blockquote{margin:12px 0;padding:10px 14px;border-left:3px solid #b2d5e5;background:#f5f5f7} details{margin-top:14px;padding-top:10px;border-top:1px solid #e2e2e5}summary{cursor:pointer} .next{margin:10px 0;color:#202124;font-weight:550}a{color:#303238} .evidence-switch{display:inline-flex;gap:3px;padding:3px;background:#e8e8eb;border-radius:10px} .evidence-switch button{border:0;border-radius:7px;padding:7px 12px;background:transparent;color:#303238;font:inherit;font-size:13px;cursor:pointer} .evidence-switch button[aria-pressed=true]{background:#b2d5e5;color:#202124} button:focus-visible,summary:focus-visible,a:focus-visible{outline:2px solid #202124;outline-offset:3px} @media print{body{background:white}main{margin:0;padding:0}.print-hide{display:none}article{border-color:#ddd}h2{break-after:avoid}}</style><main><small>CANVAS COWORKER / 交接简报</small><h1>'+e(project.name)+'</h1><p>'+e(logical?'':project.description)+'</p><p>'+cards.length+' 张摘录卡 · 用途说明与原始出处一并保留</p><div class="evidence-switch print-hide" role="group" aria-label="原始依据显示方式"><button type="button" data-evidence="quick" aria-pressed="true">快速看</button><button type="button" data-evidence="full" aria-pressed="false">看依据</button></div>'+groups+'</main><script data-handoff-controls>('+bindHandoffEvidence.toString()+')(document.querySelector("main"));</script></html>';
}
export function validateSuggestion(input) {
  if (!input || typeof input !== 'object' || !Object.hasOwn(CATEGORIES, input.category) || typeof input.title!=='string' ||
      !input.title.trim() || typeof input.intent!=='string' || !input.intent.trim())
    throw new Error('模型返回的建议格式不完整，原卡片未修改。');
  return {title:input.title.slice(0,100),category:input.category,intent:input.intent.slice(0,4000),nextStep:text(input.nextStep,2000)};
}
