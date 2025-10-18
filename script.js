// script.js (reemplazar por completo)

let logoDataURL = "imagenes/Escudo.jpg"; // imagen por defecto si no cargan archivo
let pendingLogoPromise = null;

// UTIL: leer File como dataURL -> Promise
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Error leyendo el archivo"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function padNumber(n, digits = 3) {
  n = Number(n) || 0;
  return String(n).padStart(digits, "0");
}

function escapeHtml(unsafe) {
  if (unsafe === undefined || unsafe === null) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createTicketFromData(numberStr, data) {
  const ticket = document.createElement("div");
  ticket.className = "ticket";

  const stub = document.createElement("div");
  stub.className = "stub";
  stub.innerHTML = `
    <div class="stub-inner">
      <div class="field">Nomb:</div>
      <div class="field">Direc:</div>
      <div class="field">Telef:</div>
      <div class="payRow">
        <span>Pago</span><span class="box"></span>
        <span>Debe</span><span class="box"></span>
        <div class="number-vertical">${numberStr}</div>
      </div>
    </div>
  `;

  const main = document.createElement("div");
  main.className = "main";
  main.innerHTML = `
    <div class="title">
      <h1>${escapeHtml(data.nombreRifa)}</h1>
      <h2>${escapeHtml(data.subtitulo || "")}</h2>
      <img src="${logoDataURL}" alt="imagen">
    </div>

    <div class="info">
    <div class="line"><label>Juega el</label><div class="fill">${escapeHtml(data.fechaJuegaText + (data.loteria ? ' con la lotería ' + data.loteria : ''))}</div></div>
   

    <div class="line" style="margin-top:4px"><label>Valor</label><div class="fill">${escapeHtml(data.descripcion ? data.valor : ( data.valor + ' Pesos '))}</div></div>
    <div class="line" style="margin-top:6px"><label>Responsable:</label><div class="fill">${escapeHtml(data.responsable)}</div></div>
    <div class="line" style="margin-top:4px"><label>Cel:</label><div class="fill">${escapeHtml(data.celular)}</div></div>

    <div class="bottomRow">
      <div style="font-size:16px;color:#333"> ${escapeHtml(data.descripcion || 'Descripción de la rifa')}</div>
      <div class="num-box">${numberStr}</div>
    </div>
  </div>

  `;

  const perf = document.createElement("div");
  perf.className = "perforation";
  for (let i = 0; i < 16; i++) {
    const d = document.createElement("div");
    d.className = "dot";
    perf.appendChild(d);
  }

  ticket.appendChild(stub);
  ticket.appendChild(main);
  ticket.appendChild(perf);

  return ticket;
}

// Esperar DOM listo y enlazar listeners
document.addEventListener("DOMContentLoaded", () => {
  const inputLogo = document.getElementById("logoInput");
  const previewImg = document.getElementById("logoPreview");
  const genBtn = document.getElementById("gen");
  const clearBtn = document.getElementById("clear");
  const printBtn = document.getElementById("print");

  // si no existe input, salir (para compatibilidad)
  if (inputLogo) {
    inputLogo.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) {
        // si se quita, volver a imagen por defecto
        logoDataURL = "imagenes/Escudo.jpg";
        if (previewImg) {
          previewImg.style.display = "none";
          previewImg.src = "";
        }
        pendingLogoPromise = null;
        return;
      }

      // arrancar la lectura; guardamos la promesa para que generar espere si aún no termina
      pendingLogoPromise = readFileAsDataURL(file)
        .then((dataUrl) => {
          logoDataURL = dataUrl;
          pendingLogoPromise = null;
          if (previewImg) {
            previewImg.src = dataUrl;
            previewImg.style.display = "inline-block";
          }
          return dataUrl;
        })
        .catch((err) => {
          pendingLogoPromise = null;
          console.error("Error leyendo imagen:", err);
          alert("No se pudo leer la imagen. Intente otro archivo.");
        });
    });
  }

  // Generar talonario: espera a que la imagen (si la hay) termine de leerse
  genBtn.addEventListener("click", async () => {
    // Si hay una lectura pendiente, esperar
    if (pendingLogoPromise) {
      genBtn.disabled = true;
      genBtn.textContent = "Cargando imagen…";
      await pendingLogoPromise;
      genBtn.disabled = false;
      genBtn.textContent = "Generar talonario";
    }

    // ahora se puede generar con logoDataURL ya listo
    const cnt = parseInt(document.getElementById("count").value) || 0;
    const start = parseInt(document.getElementById("start").value) || 1;

    if (cnt <= 0) {
      alert("La cantidad debe ser mayor que 0");
      return;
    }

    const nombreRifa = document.getElementById("nombreRifa").value || " ";
    const fechaJuega = document.getElementById("fechaJuega").value || "";
    const fechaJuegaText = fechaJuega ? new Date(fechaJuega).toLocaleDateString() : "";
    const loteria = document.getElementById("loteria").value || "";
    const responsable = document.getElementById("responsable").value || "";
    const celular = document.getElementById("celular").value || "";
    const descripcion = document.getElementById("descripcion").value || "";
    const valor = document.getElementById("valor").value || "";

    const data = { nombreRifa, fechaJuegaText, loteria, responsable, celular, descripcion, valor };

    const container = document.getElementById("container");
    container.innerHTML = "";

    for (let i = 0; i < cnt; i++) {
      const num = padNumber(start + i, 3);
      container.appendChild(createTicketFromData(num, data));
    }

    if (cnt > 0) window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Limpiar
  clearBtn.addEventListener("click", () => {
    const container = document.getElementById("container");
    container.innerHTML = "";
    // también limpiar preview
    if (previewImg) {
      previewImg.src = "";
      previewImg.style.display = "none";
    }
    logoDataURL = "imagenes/Escudo.jpg";
    pendingLogoPromise = null;
  });

  // Imprimir
  printBtn.addEventListener("click", () => {
    // esperar si hay lectura pendiente (por si el usuario seleccionó y enseguida imprimió)
    if (pendingLogoPromise) {
      pendingLogoPromise.then(() => window.print());
    } else {
      window.print();
    }
  });
});


  

