// #region *** DATA & DOM ***
const jsKamerInput = document.querySelector('.js-kamer-input');
const jsSubmitBtn = document.querySelector('.js-submit-btn');
const jsOrdersList = document.querySelector('.js-orders-list');
const jsMealPanes = document.querySelectorAll('.js-meal-pane');

const stockData = {
    "beleg_hartig": ["Americain", "Hesp", "Jonge kaas", "Kaas", "Kip curry", "Salami", "Smeerkaas", "Vissla", "Zalm"],
    "beleg_zoet": ["Choco", "Confituur aardbei", "Confituur abrikoos", "Confituur kers", "Honing", "Siroop", "Speculoospasta"],
    "brood": ["Beschuiten", "Brood bruin", "Brood maisbrood", "Brood roggebrood", "Brood speltbrood", "Brood volkorenbrood", "Brood wit"],
    "dranken": ["Appelsap", "Fruitsap", "Koffie", "Thee", "Melk", "Chocomelk"],
    "dessert": ["Peperkoek", "Speculooskoek", "Pudding chocolade", "Pudding vanille", "Yoghurt natuur", "Yoghurt fruit aardbei"]
};

let orders = JSON.parse(localStorage.getItem('wzc_kamer_dossiers')) || {};
// #endregion

// #region *** RENDER & INIT ***
const initForms = () => {
    jsMealPanes.forEach(pane => {
        const id = pane.id;
        if (id === 'middag') {
            pane.innerHTML = `
                <div class="mb-3"><label class="fw-bold small">Warm Maaltijd:</label>
                <select class="form-select c-input-hand js-main-select"><option value="Geen">-- Geen --</option><option value="Dagmenu">Dagmenu</option><option value="Vegetarische maaltijd">Vegetarische maaltijd</option></select></div>
                <div class="mb-3"><label class="fw-bold small">Dessert:</label>
                <select class="form-select c-input-hand js-dessert-select"><option value="Geen">-- Geen --</option>${stockData.dessert.map(d=>`<option value="${d}">${d}</option>`).join('')}</select></div>`;
        } else {
            pane.innerHTML = `
                <div class="row g-3">
                    <div class="col-8"><label class="fw-bold small">Brood:</label><select class="form-select c-input-hand js-sel" data-idx="0"><option value="Geen">-- Geen --</option>${stockData.brood.map(b=>`<option value="${b}">${b}</option>`).join('')}</select></div>
                    <div class="col-4"><label class="fw-bold small">Aantal:</label><input type="number" class="form-control c-input-hand js-amt" data-idx="0" min="0" max="6" value="0" disabled></div>
                    
                    <div class="col-8"><label class="fw-bold small">Hartig Beleg:</label><select class="form-select c-input-hand js-sel" data-idx="1" disabled><option value="Geen">-- Geen --</option>${stockData.beleg_hartig.map(h=>`<option value="${h}">${h}</option>`).join('')}</select></div>
                    <div class="col-4"><label class="fw-bold small">Aantal:</label><input type="number" class="form-control c-input-hand js-amt" data-idx="1" min="0" max="6" value="0" disabled></div>
                    
                    <div class="col-8"><label class="fw-bold small">Zoet Beleg:</label><select class="form-select c-input-hand js-sel" data-idx="2" disabled><option value="Geen">-- Geen --</option>${stockData.beleg_zoet.map(z=>`<option value="${z}">${z}</option>`).join('')}</select></div>
                    <div class="col-4"><label class="fw-bold small">Aantal:</label><input type="number" class="form-control c-input-hand js-amt" data-idx="2" min="0" max="6" value="0" disabled></div>
                    
                    <div class="col-6"><label class="fw-bold small">Drank:</label><select class="form-select c-input-hand js-drank"><option value="Geen">-- Geen --</option>${stockData.dranken.map(d=>`<option value="${d}">${d}</option>`).join('')}</select></div>
                    <div class="col-6"><label class="fw-bold small">Dessert:</label><select class="form-select c-input-hand js-extra"><option value="Geen">-- Geen --</option>${stockData.dessert.map(d=>`<option value="${d}">${d}</option>`).join('')}</select></div>
                    
                    <div class="col-12"><div class="form-check"><input class="form-check-input js-boter" type="checkbox" disabled><label class="form-check-label small fw-bold ms-2">Boter (enkel bij brood)</label></div></div>
                </div>`;
        }
    });
    document.querySelectorAll('.js-sel, .js-amt').forEach(el => el.addEventListener('input', (e) => validate(e.target.closest('.tab-pane'), e.target)));
};
// #endregion

// #region *** LOGIC (STRICT) ***
const validate = (pane, target) => {
    if (!pane || pane.id === 'middag') return;
    const sels = pane.querySelectorAll('.js-sel');
    const amts = pane.querySelectorAll('.js-amt');
    const boter = pane.querySelector('.js-boter');

    const hasBread = sels[0].value !== 'Geen';
    amts[0].disabled = !hasBread;

    if (!hasBread) {
        amts.forEach(a => a.value = 0);
        sels.forEach((s, i) => { if(i>0) { s.value = 'Geen'; s.disabled = true; } });
        boter.checked = false; boter.disabled = true;
        return;
    }

    [sels[1], sels[2], boter].forEach(el => el.disabled = false);
    if(amts[0].value == 0) amts[0].value = 1;

    amts[1].disabled = (sels[1].value === 'Geen');
    amts[2].disabled = (sels[2].value === 'Geen');

    if(amts[1].disabled) amts[1].value = 0; else if(amts[1].value == 0) amts[1].value = 1;
    if(amts[2].disabled) amts[2].value = 0; else if(amts[2].value == 0) amts[2].value = 1;

    const max = parseInt(amts[0].value);
    let h = parseInt(amts[1].value);
    let z = parseInt(amts[2].value);

    if (h + z > max) {
        if (target.dataset && target.dataset.idx == "1") { 
            amts[1].value = Math.min(h, max);
            amts[2].value = max - amts[1].value;
        } else if (target.dataset && target.dataset.idx == "2") { 
            amts[2].value = Math.min(z, max);
            amts[1].value = max - amts[2].value;
        } else { 
            amts[1].value = Math.min(h, max);
            amts[2].value = Math.max(0, max - amts[1].value);
        }
    }

    if(amts[1].value == 0 && sels[1].value !== 'Geen') { sels[1].value = 'Geen'; amts[1].disabled = true; }
    if(amts[2].value == 0 && sels[2].value !== 'Geen') { sels[2].value = 'Geen'; amts[2].disabled = true; }
};
// #endregion

// #region *** SAVE & SHOW ***
const showOrders = () => {
    if (!jsOrdersList) return;
    const keys = Object.keys(orders);
    
    if (keys.length === 0) {
        jsOrdersList.innerHTML = '<p class="text-muted text-center py-4">Geen dossiers opgeslagen.</p>';
        return;
    }

    jsOrdersList.innerHTML = keys.sort().map(nr => `
        <div class="card mb-3 p-3 border-2 border-dark shadow-sm">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="m-0 fw-bold">Kamer ${nr}</h5>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editOrder('${nr}')">Bewerk</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder('${nr}')">Wis</button>
                </div>
            </div>
            <div class="small">
                <strong>O:</strong> ${orders[nr].ontbijt.summary}<br>
                <strong>M:</strong> ${orders[nr].middag.summary}<br>
                <strong>A:</strong> ${orders[nr].avond.summary}
            </div>
        </div>
    `).join('');
};

const save = () => {
    const nr = jsKamerInput.value.trim();
    if (!nr) return alert("Voer een kamernummer in");

    orders[nr] = {
        ontbijt: getFullData('ontbijt'),
        middag: getFullData('middag'),
        avond: getFullData('avond')
    };

    localStorage.setItem('wzc_kamer_dossiers', JSON.stringify(orders));
    
    jsKamerInput.value = "";
    initForms();
    showOrders();
};

const getFullData = (id) => {
    const p = document.getElementById(id);
    if(id === 'middag') {
        const m = p.querySelector('.js-main-select').value;
        const d = p.querySelector('.js-dessert-select').value;
        
        let mPart = m !== 'Geen' ? m : "";
        let dPart = d !== 'Geen' ? d : "";
        let summary = (mPart && dPart) ? `${mPart} + ${dPart}` : (mPart || dPart || "");

        return { 
            raw: { m, d }, 
            summary: summary
        };
    }

    const sels = Array.from(p.querySelectorAll('.js-sel')).map(s => s.value);
    const amts = Array.from(p.querySelectorAll('.js-amt')).map(a => a.value);
    const drank = p.querySelector('.js-drank').value;
    const extra = p.querySelector('.js-extra').value;
    const boter = p.querySelector('.js-boter').checked;

    let summaryParts = [];
    sels.forEach((val, i) => { if(val !== 'Geen') summaryParts.push(`${amts[i]}x ${val}`); });
    if(drank !== 'Geen') summaryParts.push(drank);
    if(extra !== 'Geen') summaryParts.push(extra);
    if(boter) summaryParts.push("Boter");

    return {
        raw: { sels, amts, drank, extra, boter },
        summary: summaryParts.join(', ')
    };
};

window.editOrder = (nr) => {
    const data = orders[nr];
    jsKamerInput.value = nr;

    ['ontbijt', 'avond'].forEach(id => {
        const pane = document.getElementById(id);
        const raw = data[id].raw;
        pane.querySelectorAll('.js-sel').forEach((s, i) => s.value = raw.sels[i]);
        pane.querySelectorAll('.js-amt').forEach((a, i) => a.value = raw.amts[i]);
        pane.querySelector('.js-drank').value = raw.drank;
        pane.querySelector('.js-extra').value = raw.extra;
        pane.querySelector('.js-boter').checked = raw.boter;
        validate(pane, { dataset: { idx: -1 } }); 
    });

    const mPane = document.getElementById('middag');
    mPane.querySelector('.js-main-select').value = data.middag.raw.m;
    mPane.querySelector('.js-dessert-select').value = data.middag.raw.d;

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteOrder = (nr) => {
    if (confirm(`Kamer ${nr} wissen?`)) {
        delete orders[nr];
        localStorage.setItem('wzc_kamer_dossiers', JSON.stringify(orders));
        showOrders();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initForms();
    showOrders();
    if (jsSubmitBtn) jsSubmitBtn.onclick = save;
});
// #endregion