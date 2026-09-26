// Verify the imported experience in its sandbox before publishing locally.
const interactiveCheck=document.createElement('label');
interactiveCheck.className='interactive-confirmation';
interactiveCheck.innerHTML='<input type="checkbox" id="confirm-playable"> I tested the preview and confirmed that it responds to user input.';
document.querySelector('#html-help').after(interactiveCheck);
const checkModeBefore=setCreationMode;
setCreationMode=function(mode,clear=true){checkModeBefore(mode,clear);document.querySelector('#confirm-playable').checked=false};
const checkPreviewBefore=updatePublishPreview;
let reviewedRevision=-1;
updatePublishPreview=function(reset=false){if(reviewedRevision!==fileRevision){document.querySelector('#confirm-playable').checked=false;reviewedRevision=fileRevision}checkPreviewBefore(reset)};
const checkSubmitBefore=publishForm.onsubmit;
publishForm.onsubmit=e=>{if(creationMode==='html'&&!document.querySelector('#confirm-playable').checked){e.preventDefault();document.querySelector('#publish-error').textContent='Try the preview and confirm that the experience responds to input before publishing.';return}checkSubmitBefore(e)};
// Use product-owned English errors regardless of the browser's UI language.
document.addEventListener('invalid',event=>{
  const field=event.target,form=field.form;
  if(!form)return;
  event.preventDefault();
  let message=form.querySelector('.form-validation');
  if(!message){message=document.createElement('p');message.className='form-validation';message.setAttribute('role','alert');form.prepend(message)}
  message.textContent=field.validity.typeMismatch&&field.type==='url'?'Enter a valid URL.':'Complete all required fields with valid values.';
  field.setAttribute('aria-invalid','true');
  message.scrollIntoView({block:'nearest'});
},true);
document.addEventListener('input',event=>{
  event.target.removeAttribute('aria-invalid');
  const message=event.target.form?.querySelector('.form-validation');
  if(message)message.textContent='';
});
