// /scripts/load-audio.js

import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { storage } from './firebase-config.js';

const bananaRef = ref(storage, 'locus-classicus/s-v-banana.mp3');

getDownloadURL(bananaRef).then((url) => {
  const audio = document.querySelector('#banana-audio source');
  audio.src = url;
  audio.parentElement.load(); // reload audio player with new source
});
