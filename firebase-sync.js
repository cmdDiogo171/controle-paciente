<<<<<<< HEAD
// firebase-sync.js
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

// Inicialização
=======
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

>>>>>>> 3c9fedb5ef6568ca5cc896833cfe48012a74de0f
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

<<<<<<< HEAD
// Gerenciamento do Workspace (A "chave" da clínica)
=======
await signInAnonymously(auth);

// ws por link; se não tiver, cria um e fixa no URL + localStorage
>>>>>>> 3c9fedb5ef6568ca5cc896833cfe48012a74de0f
const params = new URLSearchParams(location.search);
let ws = params.get("ws") || localStorage.getItem("__ws__");

if (!ws) {
<<<<<<< HEAD
    ws = (crypto.randomUUID?.() || (Date.now() + "-" + Math.random().toString(16).slice(2))).replace(/-/g, "").slice(0, 12);
    localStorage.setItem("__ws__", ws);
} else {
    localStorage.setItem("__ws__", ws);
}

// Garante que o link na barra de endereços sempre tenha o ?ws=...
if (params.get("ws") !== ws) {
    params.set("ws", ws);
    window.history.replaceState(null, "", `${location.pathname}?${params.toString()}`);
=======
  ws = (crypto.randomUUID?.() || (Date.now() + "-" + Math.random().toString(16).slice(2))).replace(/-/g, "").slice(0, 12);
  localStorage.setItem("__ws__", ws);
  params.set("ws", ws);
  history.replaceState(null, "", `${location.pathname}?${params.toString()}`);
} else {
  localStorage.setItem("__ws__", ws);
>>>>>>> 3c9fedb5ef6568ca5cc896833cfe48012a74de0f
}

const ref = doc(db, "workspaces", ws);

<<<<<<< HEAD
// Função que recebe dados da nuvem e salva no seu PC
function applyCloudToLocalStorage(data) {
    if (!data) return;
    localStorage.setItem("pacientes", JSON.stringify(data.pacientes || []));
    localStorage.setItem("consultas", JSON.stringify(data.consultas || []));
    localStorage.setItem("pagamentos", JSON.stringify(data.pagamentos || []));
    
    // Dispara o evento que o dashboard.js usa para atualizar a tela
    window.dispatchEvent(new CustomEvent('cloud-updated'));
}

// Função para Enviar Dados (PUSH)
window.cloudPush = async () => {
    try {
        const dados = {
            pacientes: JSON.parse(localStorage.getItem("pacientes") || "[]"),
            consultas: JSON.parse(localStorage.getItem("consultas") || "[]"),
            pagamentos: JSON.parse(localStorage.getItem("pagamentos") || "[]"),
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser?.uid || null
        };
        await setDoc(ref, dados, { merge: true });
        console.log("Sincronizado com a nuvem!");
    } catch (err) {
        console.error("Erro ao enviar para nuvem:", err);
    }
};

// Inicialização da conexão
async function iniciarSincronizacao() {
    try {
        // 1. Loga anonimamente para ter permissão
        await signInAnonymously(auth);
        
        // 2. Faz o primeiro download dos dados (Pull)
        const snap = await getDoc(ref);
        if (snap.exists()) {
            applyCloudToLocalStorage(snap.data());
        }

        // 3. Fica "ouvindo" mudanças em tempo real
        onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                // Só aplica se a mudança não veio deste próprio computador (evita loops)
                // O Firebase cuida disso internamente com o cache
                applyCloudToLocalStorage(snap.data());
            }
        });
        
    } catch (err) {
        console.error("Falha na sincronização:", err);
    }
}

iniciarSincronizacao();
=======
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
>>>>>>> 3c9fedb5ef6568ca5cc896833cfe48012a74de0f
