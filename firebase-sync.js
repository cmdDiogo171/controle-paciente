// firebase-sync.js  (carregar com <script type="module">)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

await signInAnonymously(auth); // login automático sem senha [web:139]

const ws = new URLSearchParams(location.search).get("ws") || "familia";
const ref = doc(db, "workspaces", ws);

window.cloudPull = async () => {
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const data = snap.data();

  localStorage.setItem("pacientes", JSON.stringify(data.pacientes || []));
  localStorage.setItem("consultas", JSON.stringify(data.consultas || []));
  localStorage.setItem("pagamentos", JSON.stringify(data.pagamentos || []));
  return true;
};

window.cloudPush = async () => {
  const dados = {
    pacientes: JSON.parse(localStorage.getItem("pacientes") || "[]"),
    consultas: JSON.parse(localStorage.getItem("consultas") || "[]"),
    pagamentos: JSON.parse(localStorage.getItem("pagamentos") || "[]"),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, dados, { merge: true });
};

// puxa do Firestore 1x e recarrega para o dashboard.js ler do localStorage
(async () => {
  if (sessionStorage.getItem("__pulled_cloud__") === "1") return;
  const ok = await window.cloudPull();
  sessionStorage.setItem("__pulled_cloud__", "1");
  if (ok) location.reload();
})();
