/******** Kill any old backend checks (keeps page stable) ********/
try { window.AIJOE_ENDPOINT = null; } catch {}
window.addEventListener("unhandledrejection", e => console.warn("Silenced bg error:", e.reason));

/**************** SPEAK helper — calm, clear MALE voice ****************/
function pickMaleVoice() {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;

  const isEn = v => (v.lang || "").toLowerCase().startsWith("en");
  const byName = needle =>
    voices.find(v => isEn(v) && v.name.toLowerCase().includes(needle));

  // Most common good male voices across platforms
  const preferred = [
    "google uk english male",
    "microsoft guy", "microsoft david", "microsoft mark", "microsoft james", "microsoft george",
    "alex", "daniel", "oliver", "thomas", "fred", "bruce", "brian", "justin", "matthew"
  ];
  for (const p of preferred) {
    const v = byName(p);
    if (v) return v;
  }

  // Any English voice that literally says "male"
  const hasMaleTag = voices.find(v => isEn(v) && /male/i.test(v.name));
  if (hasMaleTag) return hasMaleTag;

  // Any English Google voice (fallback)
  const googleEn = voices.find(v => isEn(v) && /google/.test(v.name.toLowerCase()));
  if (googleEn) return googleEn;

  // Any English → any voice
  return voices.find(isEn) || voices[0];
}

function speak(text){
  if(!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(String(text||" ").trim()||" ");
  u.lang   = "en-US";
  u.rate   = 0.95; // slightly slower = calmer
  u.pitch  = 0.9;  // a bit deeper
  u.volume = 1;

  const go = () => { const v = pickMaleVoice(); if (v) u.voice = v; speechSynthesis.speak(u); };

  if (!speechSynthesis.getVoices().length) {
    speechSynthesis.addEventListener("voiceschanged", go, { once:true });
  } else { go(); }
}

// prime audio once (mobile)
document.addEventListener("click", function p(){ const u=new SpeechSynthesisUtterance(" "); u.volume=0; speechSynthesis.speak(u); document.removeEventListener("click",p); }, { once:true });

/**************** UI helpers ****************/
const $ = id => document.getElementById(id);
const out = $("output"), micStatus=$("micStatus"), wakeStatus=$("wakeStatus"), lastHeard=$("lastHeard");
function show(t, say=true){ out.textContent=t; if(say) speak(t); }
const withTimeout=(p,ms=8000)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error("timeout")),ms))]);

/******** Bible Verse ********/
const LOCAL_VERSES=[
 "Psalm 23:1 — The Lord is my shepherd; I shall not want.",
 "Philippians 4:13 — I can do all things through Christ who strengthens me.",
 "Proverbs 3:5 — Trust in the Lord with all your heart and lean not on your own understanding.",
 "Isaiah 41:10 — Fear not, for I am with you; be not dismayed, for I am your God.",
 "John 3:16 — For God so loved the world that He gave His only Son…",
];
async function getBibleVerse(){
  try{
    const r=await withTimeout(fetch("https://beta.ourmanna.com/api/v1/get/?format=json",{cache:"no-store"}),7000);
    if(!r.ok) throw 0; const j=await r.json();
    const t=j?.verse?.details?.text, ref=j?.verse?.details?.reference;
    if(t) return ref?`${t} — ${ref}`:t; throw 0;
  }catch{ return LOCAL_VERSES[Math.floor(Math.random()*LOCAL_VERSES.length)]; }
}

/******** Joke ********/
const LOCAL_JOKES=[
 "Why did the scarecrow win an award? Because he was outstanding in his field!",
 "I tried to catch fog yesterday. Mist.",
 "What do you call cheese that isn’t yours? Nacho cheese!",
 "I told my computer I needed a break, and it said, “No problem—I’ll go to sleep.”",
 "I asked my dog what’s two minus two. He said nothing."
];
async function getJoke(){
  try{
    const r=await withTimeout(fetch("https://official-joke-api.appspot.com/jokes/random",{cache:"no-store"}),7000);
    if(!r.ok) throw 0; const j=await r.json();
    const t=[j?.setup,j?.punchline].filter(Boolean).join(" … "); if(t) return t; throw 0;
  }catch{ return LOCAL_JOKES[Math.floor(Math.random()*LOCAL_JOKES.length)]; }
}

/******** Weather + GPS ********/
const WCODE={0:"clear sky",1:"mainly clear",2:"partly cloudy",3:"overcast",45:"fog",48:"rime fog",
 51:"light drizzle",53:"moderate drizzle",55:"dense drizzle",
 61:"light rain",63:"moderate rain",65:"heavy rain",
 71:"light snow",73:"moderate snow",75:"heavy snow",
 80:"rain showers",81:"rain showers",82:"violent rain showers",
 95:"thunderstorm",96:"thunderstorm with hail",99:"thunderstorm with heavy hail"};
const cToF=c=>Math.round(c*9/5+32);
async function getWeather(lat,lon){
  const r=await withTimeout(fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,{cache:"no-store"}),7000);
  if(!r.ok) throw 0; const d=await r.json(); const cw=d?.current_weather; if(!cw) throw 0;
  const desc=WCODE[cw.weathercode]||"current conditions";
  return `It's ${cToF(cw.temperature)}°F with ${desc}, wind ${Math.round(cw.windspeed)} mph.`;
}
async function reverseGeocode(lat,lon){
  const r=await withTimeout(fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2`,{headers:{Accept:"application/json"}}),8000);
  if(!r.ok) throw 0; const j=await r.json(); return j?.display_name||"";
}

/************ Music (YouTube) ************/
function openYouTube(query = "soothing music") {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  // Try a new tab first; if blocked, navigate this tab
  let win = null;
  try { win = window.open(url, "_blank", "noopener"); } catch {}
  if (!win) window.location.href = url;
  show(`Opening YouTube for ${query}…`, false);
}

/******** Call for Help (with confirmation) ********/
const HELP_NUMBER = "911"; // change if needed
let confirmCall = false;
function startHelpFlow(){
  confirmCall = true;
  speak("Do you want me to dial 9 1 1 now? Say yes or no.");
  show("Do you want me to dial 911 now? Say YES or NO.", false);
}
function performCall(){
  confirmCall = false;
  show("Opening your phone dialer…", false);
  try { window.location.href = `tel:${HELP_NUMBER}`; } catch {}
}

/******** Buttons ********/
$("btnVerse")?.addEventListener("click", async()=>{ show("Loading Bible verse…"); show(await getBibleVerse()); });
$("btnJoke")?.addEventListener("click", async()=>{ show("Loading a joke…"); show(await getJoke()); });
$("btnWeather")?.addEventListener("click", ()=>{
  show("Getting your weather (allow location)…");
  if(!("geolocation" in navigator)) return show("Location not supported on this device.");
  navigator.geolocation.getCurrentPosition(async(pos)=>{
    try{ const {latitude:lat,longitude:lon}=pos.coords; show(await getWeather(lat,lon)); }
    catch{ show("Couldn't fetch weather. Try again in a bit."); }
  },()=>show("Location permission denied. I can’t get weather without it."));
});
$("btnGPS")?.addEventListener("click", ()=>{
  show("Getting your GPS (allow location)…");
  if(!("geolocation" in navigator)) return show("Location not supported on this device.");
  navigator.geolocation.getCurrentPosition(async(pos)=>{
    const {latitude:lat,longitude:lon}=pos.coords;
    try{
      const place=await reverseGeocode(lat,lon);
      const coords=`Latitude ${lat.toFixed(5)}, Longitude ${lon.toFixed(5)}`;
      show(place?`You are near: ${place}. (${coords})`:`Your location: ${coords}`);
    }catch{ show(`Your location: Latitude ${lat.toFixed(5)}, Longitude ${lon.toFixed(5)}.`); }
  },()=>show("Location permission denied."));
});
$("btnMusic")?.addEventListener("click", ()=> openYouTube());          // ⬅️ YouTube on click
$("btnHelp")?.addEventListener("click", startHelpFlow);

/******** Voice recognition + wake word + chat ********/
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recog=null, voiceOn=false, armed=false, armTimer=null, chatMode=false;

function setMic(on){ micStatus.textContent=`Mic: ${on?"On":"Off"}`; }
function setHeard(t){ lastHeard.textContent=`Heard: ${t||"—"}`; }
function armFor(ms=10000){
  armed=true; wakeStatus.textContent='Wake word: AIJOE ✅ (Listening for a command…)';
  clearTimeout(armTimer); armTimer=setTimeout(()=>{ armed=false; wakeStatus.textContent='Wake word: “AIJOE”'; }, ms);
}
function hasWakeWord(s){ return /(hey\s+)?(ai\s*joe|ai\s*joey|ai\s*jo|aijo|ayo)\b/.test(s); }

async function smallTalk(s){
  if(/how are you|how's it going|how are u/.test(s)) return "I’m feeling great and ready to help.";
  if(/who are you|what are you/.test(s)) return "I’m AIJOE, your voice helper. Say Bible verse, Joke, Weather, GPS, Music, or Call for help.";
  if(/thank(s)?|thanks/.test(s)) return "You’re welcome!";
  if(/good (morning|afternoon|evening)/.test(s)) return "Good day! What can I do for you?";
  return "I’m here. Say Bible verse, Joke, Weather, GPS, Music, or Call for help.";
}

async function handleCommand(s){
  if(confirmCall && /\b(yes|yeah|yep|sure)\b/.test(s)) return performCall();
  if(confirmCall && /\b(no|nope|cancel|stop)\b/.test(s)) { confirmCall=false; return show("Okay, I won’t call.", false); }

  if(/(bible|verse)/.test(s))            return show(await getBibleVerse());
  if(/(joke|funny)/.test(s))             return show(await getJoke());
  if(/(weather|temperature|forecast)/.test(s)) return $("btnWeather").click();
  if(/(gps|where am i|my location|where.*am.*i)/.test(s)) return $("btnGPS").click();

  if(/(music|song|play)/.test(s)) {
    // Try to honor a style if user says one
    const kind = /worship|praise/.test(s) ? "worship music"
               : /lofi|relax|chill/.test(s) ? "lofi beats"
               : /jazz/.test(s) ? "jazz"
               : "soothing music";
    return openYouTube(kind);   // ⬅️ YouTube via voice
  }

  if(/(help|emergency|call 911|call nine one one)/.test(s)) return startHelpFlow();
  if(/(talk to ai ?joe|talk mode|chat|chat mode)/.test(s)) { chatMode = true; speak("Chat mode on. I’m listening."); return; }
  if(/(stop voice|stop listening|quiet)/.test(s)) { speechSynthesis.cancel(); stopVoice(); return show("Voice off.", false); }

  if(chatMode) return show(await smallTalk(s));
  return show('Sorry, I didn’t catch that. Say “Bible verse”, “Joke”, “Weather”, “GPS”, “Music”, or “Call for help”.', true);
}

function handleTranscript(raw){
  const t=String(raw||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
  if(!t) return; setHeard(t);

  if(!armed && hasWakeWord(t)){ armFor(); speak("How can I help?"); return; }
  if(armed){ armed=false; wakeStatus.textContent='Wake word: “AIJOE”'; handleCommand(t); return; }
  if(chatMode){ handleCommand(t); }
}

function startVoice(){
  if(!SR) { show("Voice recognition not supported here. Use Chrome for best results."); return; }
  if(voiceOn) return;
  recog = new SR(); recog.lang="en-US"; recog.continuous=true; recog.interimResults=false;

  recog.onresult=(e)=>{
    const t=Array.from(e.results).slice(e.resultIndex).map(r=>r[0]?.transcript||"").join(" ");
    handleTranscript(t);
  };
  recog.onerror=(ev)=>{
    if(ev.error==="not-allowed") show("Mic permission blocked. Allow microphone in your browser settings.", false);
  };
  recog.onend=()=>{ if(voiceOn){ try{recog.start();}catch{} } };

  try { recog.start(); voiceOn=true; setMic(true); show('Voice on. Say "AIJOE".', false); }
  catch { show("Couldn’t start mic. Tap 🎤 Start Voice again.", false); }
}
function stopVoice(){
  voiceOn=false; chatMode=false; armed=false;
  try{ recog && recog.stop(); }catch{}
  setMic(false); wakeStatus.textContent='Wake word: “AIJOE”';
}
$("btnMic")?.addEventListener("click", startVoice);
$("btnMicStop")?.addEventListener("click", stopVoice);
$("btnChat")?.addEventListener("click", ()=>{ chatMode=true; startVoice(); speak("Chat mode on. I’m listening."); });

/* preload voices */
window.addEventListener("load", ()=>{ if("speechSynthesis" in window) speechSynthesis.getVoices(); });
