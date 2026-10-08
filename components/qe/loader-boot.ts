export const LOADER_SEEN_KEY='qe-intro-seen';
// Runs before first paint (see layout) so returning visitors in the same tab session never see the loader flash.
export const loaderBootScript=`try{if(sessionStorage.getItem('${LOADER_SEEN_KEY}'))document.documentElement.classList.add('qe-intro-seen')}catch(e){}`;
