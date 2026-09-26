// Content type is a product boundary, separate from the HTML runtime format.
const interactiveTemplates = ['beat', 'orbit', 'quiz', 'wave', 'draw', 'social'];
function hasInteractiveRuntime(source) {
  if (typeof source !== 'string' || !source.trim()) return false;
  const doc = new DOMParser().parseFromString(source, 'text/html');
  const eventPattern = /^on(click|input|change|submit|key\w+|pointer\w+|mouse\w+|touch\w+)$/i;
  if ([...doc.querySelectorAll('*')].some(el => [...el.attributes].some(a => eventPattern.test(a.name) && a.value.trim()))) return true;
  return [...doc.querySelectorAll('script:not([src])')].some(script =>
    (!script.type || /^(module|text\/javascript|application\/javascript)$/i.test(script.type)) &&
    /addEventListener\s*\(|\.on(?:click|input|change|submit|key\w+|pointer\w+|mouse\w+|touch\w+)\s*=/.test(script.textContent));
}
function isPublishableWork(work) {
  if (!work || (work.contentType && work.contentType !== 'interactive') || work.postType || work.plainPost || work.daily || work.lifeType) return false;
  if (work.assetType) return work.assetType === 'html' && hasInteractiveRuntime(work.asset);
  return interactiveTemplates.includes(work.template);
}
