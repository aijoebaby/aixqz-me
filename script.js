/* style.css */
:root {
  --primary: #4CAF50;
  --on-primary: #fff;
  --bg-overlay: rgba(0,0,0,0.5);
  --radius: 8px;
  --gap: 1rem;
  --font: 'Segoe UI', sans-serif;
}
* { box-sizing: border-box; margin:0; padding:0; }
body { font-family: var(--font); min-height:100vh; position:relative; }
body::before {
  content:""; position:absolute; inset:0;
  /* updated to match your actual image name */
  background:url('joey-bg-2.png') center/cover no-repeat;
  z-index:0;
}
.overlay {
  position:absolute; inset:0;
  background:var(--bg-overlay);
  z-index:1;
}
.avatar, h1, .controls, .feature-section {
  position:relative; z-index:2;
}
.avatar {
  display:block; margin:2rem auto 1rem;
  width:120px; border-radius:50%;
  box-shadow:0 4px 12px rgba(0,0,0,0.7);
}
h1 {
  text-align:center; color:var(--on-primary);
  text-shadow:2px 2px 4px rgba(0,0,0,0.7);
  margin-bottom:1.5rem;
}
.controls {
  display:flex; flex-wrap:wrap; justify-content:center;
  gap:var(--gap); padding:0 1rem; margin-bottom:2rem;
}
.controls button {
  background:var(--primary); color:var(--on-primary);
  border:none; border-radius:var(--radius);
  padding:0.75rem 1.5rem; font-size:1rem;
  cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.3);
  transition:transform .15s, box-shadow .15s;
}
.controls button:hover {
  transform:translateY(-2px);
  box-shadow:0 6px 12px rgba(0,0,0,0.4);
}
.feature-section {
  display:none; padding:1rem; max-width:400px; margin:0 auto;
  background:var(--bg-overlay); border-radius:var(--radius);
  margin-bottom:2rem;
}
.feature-section.visible { display:block; }
.feature-section h2 { color:var(--on-primary); margin-bottom:0.5rem; }
.feature-section input {
  width:100%; padding:0.5rem; margin-bottom:0.5rem;
  border-radius:var(--radius); border:none;
}
.feature-section button {
  background:var(--primary); width:100%; margin-bottom:1rem;
}
.feature-section ul {
  list-style:none; max-height:150px; overflow:auto;
}
.feature-section li {
  background:rgba(255,255,255,0.1); padding:0.5rem;
  margin-bottom:0.25rem; border-radius:4px;
  display:flex; justify-content:space-between; align-items:center;
}
.feature-section li button {
  background:transparent; border:none; color:#f66;
  cursor:pointer;
}
@media (max-width:480px) {
  .controls button { flex:1 1 100%; max-width:100%; font-size:1.1rem; }
}
