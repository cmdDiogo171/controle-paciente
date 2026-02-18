// firebase-sync.js  (carregar com <script type="module">)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCBHQ8Eblp8AqOc9rdWYD-JTb3Z_dIQEZE",
  authDomain: "controle-paciente.firebaseapp.com",
  projectId: "controle-paciente",
  storageBucket: "controle-paciente.firebasestorage.app",
  messagingSenderId: "848298925076",
  appId: "1:848298925076:web:b7a50af9fc590736681b01"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

await signInAnonymously(auth);

// ws por link; se não tiver, cria um e fixa no URL + localStorage
const params = new URLSearchParams(location.search);
let ws = params.get("ws") || localStorage.getItem("__ws__");

if (!ws) {
  ws = (crypto.randomUUID?.() || (Date.now() + "-" + Math.random().toString(16).slice(2))).replace(/-/g, "").slice(0, 12);
  localStorage.setItem("__ws__", ws);
  params.set("ws", ws);
  history.replaceState(null, "", `${location.pathname}?${params.toString()}`);
} else {
  localStorage.setItem("__ws__", ws);
}

const ref = doc(db, "workspaces", ws);

function applyCloudToLocalStorage(data) {
  localStorage.setItem("pacientes", JSON.stringify(data.pacientes || []));
  localStorage.setItem("consultas", JSON.stringify(data.consultas || []));
  localStorage.setItem("pagamentos", JSON.stringify(data.pagamentos || []));
  window.dispatchEvent(new Event("cloud-updated"));
}

window.cloudPull = async () => {
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  applyCloudToLocalStorage(snap.data());
  return true;
};

window.cloudPush = async () => {
  const dados = {
    pacientes: JSON.parse(localStorage.getItem("pacientes") || "[]"),
    consultas: JSON.parse(localStorage.getItem("consultas") || "[]"),
    pagamentos: JSON.parse(localStorage.getItem("pagamentos") || "[]"),
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser?.uid || null
  };
  await setDoc(ref, dados, { merge: true });
};

// 1º pull (se existir)
await window.cloudPull().catch(() => {});

// realtime: qualquer mudança em qualquer device atualiza localStorage
onSnapshot(ref, (snap) => {
  if (!snap.exists()) return;
  applyCloudToLocalStorage(snap.data());
});
