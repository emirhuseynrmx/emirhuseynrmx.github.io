(function(){
  function normalized(text){
    return (text || '')
      .toLocaleLowerCase('tr-TR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'');
  }

  function titleFor(card, index){
    var heading = card.querySelector('h3');
    var raw = heading ? heading.textContent.trim() : '';
    if(!raw) return 'step';
    return raw.split(/\s+/).slice(0, 2).join(' ').toLowerCase();
  }

  function setupScenarioSections(){
    document.querySelectorAll('.lsection').forEach(function(section){
      var title = section.querySelector('.lsection-title');
      var grid = section.querySelector('.features-grid');
      if(!title || !grid || grid.dataset.scenarioReady === '1') return;

      var text = normalized(title.textContent);
      var explicit = section.dataset.scenario === 'true';
      var looksLikeScenario =
        text.indexOf('adim adim') !== -1 ||
        text.indexOf('step-by-step') !== -1 ||
        text.indexOf('scenario') !== -1 ||
        text.indexOf('senaryo') !== -1;
      if(!explicit && !looksLikeScenario) return;

      var cards = Array.prototype.slice.call(grid.children).filter(function(el){
        return el.classList && el.classList.contains('feature');
      });
      if(cards.length < 2) return;

      section.classList.add('scenario-section','is-js');
      grid.classList.add('scenario-grid');
      grid.dataset.scenarioReady = '1';

      var tabs = document.createElement('div');
      tabs.className = 'scenario-tabs';
      tabs.setAttribute('role','tablist');
      tabs.setAttribute('aria-label','Scenario steps');

      var progress = document.createElement('div');
      progress.className = 'scenario-progress';
      progress.innerHTML = '<span></span>';
      var fill = progress.querySelector('span');

      function activate(index){
        cards.forEach(function(card,i){
          var active = i === index;
          card.classList.toggle('is-active', active);
          card.setAttribute('aria-hidden', active ? 'false' : 'true');
        });
        Array.prototype.slice.call(tabs.children).forEach(function(tab,i){
          var active = i === index;
          tab.classList.toggle('is-active', active);
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        if(fill) fill.style.width = (((index + 1) / cards.length) * 100).toFixed(2) + '%';
      }

      cards.forEach(function(card,index){
        var step = String(index + 1).padStart(2,'0');
        card.classList.add('scenario-card');
        card.setAttribute('tabindex','0');
        card.dataset.scenarioStep = step;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'scenario-tab';
        btn.setAttribute('role','tab');
        btn.innerHTML = '<span>' + step + '</span><b>' + titleFor(card, index) + '</b>';
        btn.addEventListener('click',function(){ activate(index); });
        tabs.appendChild(btn);

        card.addEventListener('click',function(){ activate(index); });
        card.addEventListener('keydown',function(event){
          if(event.key === 'Enter' || event.key === ' '){
            event.preventDefault();
            activate(index);
          }
        });
      });

      grid.parentNode.insertBefore(tabs, grid);
      grid.parentNode.insertBefore(progress, grid.nextSibling);
      activate(0);
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', setupScenarioSections);
  }else{
    setupScenarioSections();
  }
})();
