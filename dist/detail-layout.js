// One main card contains the experience and discussion; updates are sibling cards below.
const detailMainCard=document.createElement('div');detailMainCard.className='detail-main-card';
function arrangeDetailCards(){if(!detailMainCard.isConnected){const children=[...dialog.children].filter(el=>el!==updateSection);dialog.prepend(detailMainCard);children.forEach(el=>detailMainCard.append(el))}const stageNode=document.querySelector('#dialog-stage'),info=document.querySelector('#full-work-panel');if(info)stageNode.after(info);if(sliceDiscussion.isConnected)(info||stageNode).after(sliceDiscussion);if(updateSection.isConnected)dialog.append(updateSection)}
const layoutOpenBefore=openWork;openWork=function(id,remix=false){layoutOpenBefore(id,remix);arrangeDetailCards()};
const layoutDecorateBefore=decorateWork;decorateWork=function(w){layoutDecorateBefore(w);arrangeDetailCards()};
arrangeDetailCards();
