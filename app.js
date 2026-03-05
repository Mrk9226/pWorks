// Element helpers
const $ = (sel) => document.querySelector(sel);

const btn = $("#btnSearch");
const input = $("#isbn");
const statusEl = $("#status");
const tableWrap = document.querySelector(".table-wrap");

// Utilities
function normalizeISBN(raw) {
  // Rimuove spazi, trattini e altri caratteri non validi (mantiene X/x per ISBN-10)
  return (raw || "").replace(/[^\dXx]/g, "").toUpperCase();
}

function setStatus(msg, type = "") {
  statusEl.textContent = msg;
  statusEl.className = "status " + (type || "");
}

function setTableVisible(visible) {
  tableWrap.hidden = !visible;
}

function populateTable(data, isbn) {
  const coverUrl = data.cover?.medium || data.cover?.small || null;

  const authors = (data.authors || []).map(a => a.name).join(", ");
  const publishers = (data.publishers || []).map(p => p.name).join(", ");
  const subjects = (data.subjects || []).map(s => s.name || s).slice(0, 6).join(", ");

  $("#cell-title").textContent = data.title || "—";
  $("#cell-authors").textContent = authors || "—";
  $("#cell-publisher").textContent = publishers || "—";
  $("#cell-date").textContent = data.publish_date || data.publishDate || "—";
  $("#cell-pages").textContent = data.number_of_pages || data.pagination || "—";
  $("#cell-categories").textContent = subjects || "—";

  const workOrBookUrl = (data.url || data.key)
    ? `https://openlibrary.org${data.url || data.key}`
    : `https://openlibrary.org/isbn/${isbn}`;

 $("#cell-link").innerHTML = `${workOrBookUrl}${workOrBookUrl}</a>`;

  const coverCell = $("#cell-cover");
  coverCell.innerHTML = "";
  if (coverUrl) {
    const img = document.createElement("img");
    img.src = coverUrl;
    img.alt = `Copertina di ${data.title || "libro"}`;
    img.decoding = "async";
    img.loading = "lazy";
    coverCell.classList.add("cover");
    coverCell.appendChild(img);
  } else {
    coverCell.textContent = "—";
  }
}

async function fetchFromOpenLibrary(isbn) {
  // Endpoint documentato: /api/books?bibkeys=ISBN:{ISBN}&format=json&jscmd=data
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json[`ISBN:${isbn}`] || null;
}

// Event handlers
async function onSearch() {
  const raw = input.value.trim();
  const isbn = normalizeISBN(raw);

  setTableVisible(false);

  if (!isbn) {
    setStatus("Inserisci un ISBN.", "err");
    return;
  }
  if (!/^\d{10}$|^\d{13}$/.test(isbn)) {
    // accettiamo X finale per ISBN-10
    if (!/^\d{9}[\dX]$/.test(isbn)) {
      setStatus("Formato ISBN non valido. Usa 10 o 13 cifre (trattini opzionali).", "err");
      return;
    }
  }

  btn.disabled = true;
  setStatus("Ricerca in corso…");

  try {
    const data = await fetchFromOpenLibrary(isbn);
    if (!data) {
      setStatus("Nessun risultato trovato per questo ISBN su Open Library.", "err");
      return;
    }
    populateTable(data, isbn);
    setTableVisible(true);
    setStatus("Dati caricati correttamente.", "ok");
  } catch (err) {
    console.error(err);
    setStatus("Errore durante la richiesta a Open Library. Riprova.", "err");
  } finally {
    btn.disabled = false;
  }
}

// Bind UI
btn.addEventListener("click", onSearch);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") onSearch();
});
