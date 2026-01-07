(function(){
  const cfg = window.SL || {};
  const phone = (cfg.phone_e164 || "").replace(/\D/g,'');
  const waBase = phone ? `https://wa.me/${phone}` : "#";
  const telLink = phone ? `tel:+${phone}` : "#";

  const $ = (id) => document.getElementById(id);

  // Fill meta
  const meta = cfg.city ? `${cfg.city} • Commande WhatsApp` : "Commande WhatsApp";
  if($("brandMeta")) $("brandMeta").textContent = meta;

  // Open / closed
  const pill = $("pillOpen");
  if(pill){
    const isOpen = !!cfg.open;
    pill.textContent = isOpen ? "OUVERT" : "FERMÉ";
    pill.classList.toggle("pill--open", isOpen);
    pill.classList.toggle("pill--closed", !isOpen);
  }

  // Populate selects
  const fillSelect = (id, arr, placeholder=null) => {
    const el = $(id);
    if(!el) return;
    el.innerHTML = "";
    if(placeholder){
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = placeholder;
      opt.disabled = true;
      opt.selected = true;
      el.appendChild(opt);
    }
    (arr || []).forEach(v=>{
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      el.appendChild(opt);
    });
  };

  fillSelect("zone", cfg.zones || []);
  fillSelect("slot", cfg.time_slots || []);

  // Dishes dropdown + list
  const dishes = (cfg.daily || []).map(d => `${d.name}${d.price ? " — " + d.price : ""}`);

  // Multi-dish rows
  const dishRows = $("dishRows");
  const addBtn = $("addDish");

  const qtyOptions = ["1","2","3","4","5","6","8","10"];

  const createRow = (presetDish="", presetQty="1") => {
    const row = document.createElement("div");
    row.className = "dishRow";

    const sel = document.createElement("select");
    sel.required = true;
    dishes.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      sel.appendChild(opt);
    });
    // Ensure "Autre" is present
    const otherOpt = document.createElement("option");
    otherOpt.value = "Autre (à préciser)";
    otherOpt.textContent = "Autre (à préciser)";
    sel.appendChild(otherOpt);

    if(presetDish){ sel.value = presetDish; }

    const qty = document.createElement("select");
    qty.required = true;
    qtyOptions.forEach(v=>{
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      qty.appendChild(o);
    });
    qty.value = presetQty;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "removeBtn";
    remove.textContent = "×";
    remove.title = "Supprimer";

    // Other input
    const otherWrap = document.createElement("div");
    otherWrap.className = "otherInput";
    otherWrap.hidden = true;
    const otherInput = document.createElement("input");
    otherInput.type = "text";
    otherInput.placeholder = "Précisez le plat (ex: poisson braisé, etc.)";
    otherInput.setAttribute("aria-label","Plat autre");
    otherWrap.appendChild(otherInput);

    const syncOther = () => {
      const isOther = (sel.value || "").startsWith("Autre");
      otherWrap.hidden = !isOther;
      if(!isOther){ otherInput.value = ""; }
    };
    sel.addEventListener("change", syncOther);
    syncOther();

    remove.addEventListener("click", () => {
      row.remove();
      // Always keep at least 1 row
      if(dishRows && dishRows.children.length === 0){
        createRow();
      }
    });

    row.appendChild(sel);
    row.appendChild(qty);
    row.appendChild(remove);
    row.appendChild(otherWrap);

    // store refs
    row._dishSelect = sel;
    row._qtySelect = qty;
    row._otherInput = otherInput;

    dishRows.appendChild(row);
  };

  if(addBtn){ addBtn.addEventListener("click", () => createRow()); }
  if(dishRows){ createRow(dishes[0] || "", "1"); }

  
  const dailyList = $("dailyList");
  if(dailyList){
    dailyList.innerHTML = "";
    (cfg.daily || []).forEach(d=>{
      const li = document.createElement("li");
      const price = (d.price || "").trim();
      if(!price) return; // ne pas afficher les éléments sans prix (ex: Gésier simple, Autre)
      li.innerHTML = `<span class="name">${escapeHtml(d.name)}</span><span class="price">${escapeHtml(price)}</span>`;
      dailyList.appendChild(li);
    });
  }

  // Payments
  const paySelect = $("pay");
  if(paySelect){
    paySelect.innerHTML = "";
    (cfg.payments || []).forEach(p=>{
      if(!p.enabled) return;
      const opt = document.createElement("option");
      opt.value = p.label;
      opt.textContent = p.label;
      paySelect.appendChild(opt);
    });
  }

  // Buttons top
  if($("btnCallTop")) $("btnCallTop").setAttribute("href", telLink);
  if($("btnCall")) $("btnCall").setAttribute("href", telLink);

  // Group links
  const groupLinkRaw = (cfg.group_invite_link || "").trim();
  const groupJoinMsg = `Bonjour ${cfg.brand || "SAVEUR LOCAL (SL)"}, je souhaite rejoindre votre groupe WhatsApp (clients). Merci de m\u2019ajouter.`;
  const groupLink = groupLinkRaw.includes("wa.me/")
    ? (groupLinkRaw.includes("?") ? `${groupLinkRaw}&text=${encodeURIComponent(groupJoinMsg)}` : `${groupLinkRaw}?text=${encodeURIComponent(groupJoinMsg)}`)
    : groupLinkRaw;
  const groupBtns = ["btnGroupTop","btnGroup"];
  groupBtns.forEach(id=>{
    const b = $(id);
    if(!b) return;
    if(groupLink){
      b.setAttribute("href", groupLink);
      b.removeAttribute("aria-disabled");
      b.title = "Rejoindre le groupe WhatsApp";
    }else{
      b.setAttribute("href", "#");
      b.setAttribute("aria-disabled", "true");
    }
  });

  // WhatsApp button
  if($("btnWhatsApp")) $("btnWhatsApp").setAttribute("href", waBase);

  // Form submit -> open WhatsApp with prefilled message
  const form = $("orderForm");
  if(form){
    form.addEventListener("submit", (e)=>{
      e.preventDefault();
      if(waBase === "#") return;

      const type = $("orderType")?.value || "now";
      const mode = $("mode")?.value || "";
      const slot = $("slot")?.value || "";
      const zone = $("zone")?.value || "";
      const date = $("date")?.value || "";
      const qty = $("qty")?.value || "";
            const pay = $("pay")?.value || "";
      const address = $("address")?.value || "";
      const note = $("note")?.value || "";

      const lines = [];
      lines.push(`Bonjour ${cfg.brand || "SAVEUR LOCAL (SL)"}, je souhaite ${type === "reserve" ? "réserver" : "passer une commande"}.`);
      lines.push("");
      lines.push(`Plats :`);
      const rows = Array.from(dishRows ? dishRows.children : []);
      rows.forEach((r, idx) => {
        const d = r._dishSelect ? r._dishSelect.value : "";
        const q = r._qtySelect ? r._qtySelect.value : "";
        let finalDish = d;
        if((d || "").startsWith("Autre")){
          const custom = (r._otherInput ? r._otherInput.value : "").trim();
          finalDish = custom ? `Autre: ${custom}` : "Autre";
        }
        if(finalDish){
          lines.push(`- ${q} x ${finalDish}`);
        }
      });
      lines.push(`Quantité : ${qty}`);
      lines.push(`Mode : ${mode}`);
      lines.push(`Zone : ${zone}`);
      if(type === "reserve"){
        lines.push(`Date : ${date || "..."}`);
      }else{
        lines.push(`Créneau : ${slot}`);
      }
      lines.push(`Quartier : ${address}`);
      lines.push(`Paiement : ${pay}`);

      if(note.trim()){
        lines.push("");
        lines.push(`Message : ${note.trim()}`);
      }

      lines.push("");
      if(type === "reserve"){
        lines.push("Je règle 50% maintenant pour confirmer (j’envoie la capture du reçu), puis 50% le jour de la livraison (avec capture).");
      }else{
        lines.push("Après paiement, je vous enverrai une capture d’écran du reçu de paiement.");
      }
      lines.push("Merci.");

      const url = `${waBase}?text=${encodeURIComponent(lines.join("\n"))}`;
      window.open(url, "_blank");
    });
  }

  
  // Combo UI (2 plats)
  const comboToggle = $("comboToggle");
  const comboRow = $("comboRow");
  const dish2Sel = $("dish2");
  if(comboToggle && comboRow){
    const sync = () => {
      const on = !!comboToggle.checked;
      comboRow.hidden = !on;
      if(!on && dish2Sel) dish2Sel.value = "(Aucun)";
    };
    comboToggle.addEventListener("change", sync);
    sync();
  }


  // Toggle réservation (afficher/cacher date)
  const orderTypeEl = $("orderType");
  const dateWrap = $("dateWrap");
  const dateEl = $("date");
  const slotEl = $("slot");
  const slotLabel = slotEl ? slotEl.closest("label") : null;

  const syncReserveUI = () => {
    const isReserve = (orderTypeEl && orderTypeEl.value === "reserve");
    if(dateWrap) dateWrap.style.display = isReserve ? "" : "none";
    if(dateEl && !isReserve) dateEl.value = "";
    // Créneau utile surtout pour commande maintenant
    if(slotLabel) slotLabel.style.display = isReserve ? "none" : "";
  };

  if(orderTypeEl){
    orderTypeEl.addEventListener("change", syncReserveUI);
    syncReserveUI();
  }


  
  // Sticky mobile CTAs
  const stickyWA = $("stickyWhatsApp");
  const stickyCall = $("stickyCall");
  const callNumber = (cfg.phone || "").trim();
  if(stickyCall && callNumber){
    stickyCall.href = `tel:${callNumber.replace(/\s+/g,"")}`;
  }
  if(stickyWA){
    stickyWA.addEventListener("click", () => {
      // trigger same behavior as main WhatsApp button if present
      const btn = $("sendWhatsApp") || document.querySelector('[data-action="whatsapp"]');
      if(btn){ btn.click(); return; }
      // fallback: open wa link
      const wa = (cfg.whatsapp || "").trim();
      if(wa) window.open(wa, "_blank");
    });
  }

  // Year
  const y = new Date().getFullYear();
  const yearEl = $("year");
  if(yearEl) yearEl.textContent = String(y);

  function escapeHtml(str){
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }
})();