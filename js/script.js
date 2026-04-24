// #region *** DOM & Data                           ***********
const jsKamerInput = document.querySelector('.js-kamer-input');
const jsSubmitBtn = document.querySelector('.js-submit-btn');
const jsOrdersList = document.querySelector('.js-orders-list');
const jsMealPanes = document.querySelectorAll('.js-meal-pane');

const stockData = {
    "beleg_hartig": ["Americain", "Hesp", "Jonge kaas", "Kaas", "Kip curry", "Salami", "Smeerkaas", "Vissla", "Zalm"],
    "beleg_zoet": ["Choco", "Confituur aardbei", "Confituur abrikoos", "Confituur bosbes", "Confituur kers", "Honing", "Siroop", "Speculoospasta"],
    "brood": ["Beschuiten", "Brood bruin", "Brood maisbrood", "Brood roggebrood", "Brood speltbrood", "Brood volkorenbrood", "Brood wit"],
    "dranken": ["Appelsap", "Fruitsap", "Koffie", "Thee", "Melk", "Chocomelk"],
    "fruit": ["Appel", "Banaan", "Kiwi", "Mandarijn", "Peer", "Pruim", "Sinaasappel"],
    "dessert": ["Peperkoek", "Speculooskoek", "Pudding chocolade", "Pudding vanille", "Yoghurt natuur", "Yoghurt fruit aardbei", "Yoghurt fruit ananas", "Yoghurt fruit kers"]
};

let orders = JSON.parse(localStorage.getItem('wzc_kamer_dossiers')) || {};
// #endregion

// #region *** Visualisation                         ***********
const renderInputGroup = (label, prefix, options) => `
    <div class="col-8">
        <label class="form-label fw-bold small">${label}:</label>
        <select class="form-select c-input-hand js-sync-select" data-prefix="${prefix}">
            <option value="Geen">-- Geen --</option>
            ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
        </select>
    </div>
    <div class="col-4">
        <label class="form-label fw-bold small">Aantal:</label>
        <input type="number" class="form-control c-input-hand js-sync-amount" min="0" max="6" value="0" disabled>
    </div>
`;

const initForms = () => {
    jsMealPanes.forEach(pane => {
        const id = pane.id;
        if (id === 'middag') {
            pane.innerHTML = `
                <div class="mb-3">
                    <label class="form-label fw-bold">Warme Maaltijd:</label>
                    <select class="form-select c-input-hand js-main-select">
                        <option value="Geen">-- Geen --</option>
                        <option value="Dagmenu">Dagmenu (Warm)</option>
                        <option value="Vegetarisch">Vegetarisch (Warm)</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Dessert:</label>
                    <select class="form-select c-input-hand js-dessert-select">
                        <option value="Geen">-- Geen --</option>
                        ${stockData.dessert.map(d => `<option value="${d}">${d}</option>`).join('')}
                    </select>
                </div>`;
        } else {
            pane.innerHTML = `
                <div class="row g-3">
                    ${renderInputGroup('Brood', `${id}-bread`, stockData.brood)}
                    ${renderInputGroup('Hartig Beleg', `${id}-hartig`, stockData.beleg_hartig)}
                    ${renderInputGroup('Zoet Beleg', `${id}-zoet`, stockData.beleg_zoet)}
                    <div class="col-md-6">
                        <label class="form-label fw-bold small">Drank:</label>
                        <select class="form-select c-input-hand js-drink-select"><option value="Geen">-- Geen --</option>${stockData.dranken.map(d => `<option value="${d}">${d}</option>`).join('')}</select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold small">Extra Dessert / Fruit:</label>
                        <select class="form-select c-input-hand js-dessert-select"><option value="Geen">-- Geen --</option>
                            <optgroup label="Dessert">${stockData.dessert.map(d => `<option value="${d}">${d}</option>`).join('')}</optgroup>
                            <optgroup label="Fruit">${stockData.fruit.map(f => `<option value="${f}">${f}</option>`).join('')}</optgroup>
                        </select>
                    </div>
                    <div class="col-12">
                        <div class="form-check"><input class="form-check-input js-boter-check" type="checkbox" id="boter-${id}" disabled><label class="form-check-label fw-bold" for="boter-${id}">Boter (enkel bij brood)</label></div>
                    </div>
                </div>`;
        }
    });
    listenToInteractions();
};

const showOrders = () => {
    const keys = Object.keys(orders);
    if (keys.length === 0) {
        jsOrdersList.innerHTML = '<p class="text-muted italic text-center py-4">Geen dossiers opgeslagen.</p>';
        return;
    }
    jsOrdersList.innerHTML = keys.map(kamer => `
        <article class="c-order-item mb-4 border-bottom pb-3">
            <div class="d-flex justify-content-between align-items-center">
                <h4 class="c-order-item__room mb-0">Kamer ${kamer}</h4>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editDossier('${kamer}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteDossier('${kamer}')"><i class="bi bi-trash"></i></button>
                </div>
            </div>
            <div class="ps-2 mt-2 small">
                <strong>O:</strong> ${orders[kamer].ontbijt.summary}<br>
                <strong>M:</strong> ${orders[kamer].middag.summary}<br>
                <strong>A:</strong> ${orders[kamer].avond.summary}
            </div>
        </article>
    `).join('');
};
// #endregion

// #region *** Logic                                 ***********
const listenToInteractions = () => {
    document.querySelectorAll('.js-sync-select').forEach(select => {
        select.addEventListener('change', (e) => syncQuantityAndBoter(e.target));
    });
};

const syncQuantityAndBoter = (selectElem) => {
    const pane = selectElem.closest('.tab-pane');
    const amountInput = selectElem.parentElement.nextElementSibling.querySelector('.js-sync-amount');
    const boterCheck = pane.querySelector('.js-boter-check');
    
    amountInput.disabled = (selectElem.value === 'Geen');
    if (selectElem.value === 'Geen') amountInput.value = 0;
    else if (amountInput.value == 0) amountInput.value = 1;

    if (selectElem.dataset.prefix && selectElem.dataset.prefix.includes('bread') && boterCheck) {
        boterCheck.disabled = (selectElem.value === 'Geen');
        if (boterCheck.disabled) boterCheck.checked = false;
    }
};

const getMealData = (id) => {
    const pane = document.getElementById(id);
    if (id === 'middag') {
        const main = pane.querySelector('.js-main-select').value;
        const dessert = pane.querySelector('.js-dessert-select').value;
        return {
            values: { main, dessert },
            summary: (main === 'Geen' && dessert === 'Geen') ? "---" : `${main} (D: ${dessert})`
        };
    } else {
        const selects = pane.querySelectorAll('.js-sync-select');
        const amounts = pane.querySelectorAll('.js-sync-amount');
        const drank = pane.querySelector('.js-drink-select').value;
        const dessert = pane.querySelector('.js-dessert-select').value;
        const boter = pane.querySelector('.js-boter-check').checked;
        
        let itemsSummary = [];
        let rawValues = { 
            items: Array.from(selects).map((s, i) => ({ val: s.value, qty: amounts[i].value })),
            drank, dessert, boter 
        };

        rawValues.items.forEach(item => {
            if (item.val !== 'Geen') itemsSummary.push(`${item.qty}x ${item.val}`);
        });
        
        let summary = itemsSummary.join(', ') + (drank !== 'Geen' ? ` | Drank: ${drank}` : '') + (boter ? " + Boter" : "");
        return { values: rawValues, summary: summary || "---" };
    }
};

const saveDossier = () => {
    const kamer = jsKamerInput.value;
    if (!/^([0-3])\.([0-3][0-9]|40)$/.test(kamer)) {
        alert("Ongeldig kamernummer (V.KK)"); return;
    }

    orders[kamer] = {
        ontbijt: getMealData('ontbijt'),
        middag: getMealData('middag'),
        avond: getMealData('avond')
    };

    localStorage.setItem('wzc_kamer_dossiers', JSON.stringify(orders));
    jsKamerInput.value = "";
    showOrders();
    initForms();
};

window.editDossier = (kamer) => {
    const data = orders[kamer];
    jsKamerInput.value = kamer;

    // Herstel Ontbijt & Avond
    ['ontbijt', 'avond'].forEach(id => {
        const pane = document.getElementById(id);
        const mealData = data[id].values;
        
        const selects = pane.querySelectorAll('.js-sync-select');
        const amounts = pane.querySelectorAll('.js-sync-amount');
        
        mealData.items.forEach((item, i) => {
            selects[i].value = item.val;
            amounts[i].value = item.qty;
            syncQuantityAndBoter(selects[i]);
        });

        pane.querySelector('.js-drink-select').value = mealData.drank;
        pane.querySelector('.js-dessert-select').value = mealData.dessert;
        pane.querySelector('.js-boter-check').checked = mealData.boter;
    });

    // Herstel Middag
    const middagPane = document.getElementById('middag');
    middagPane.querySelector('.js-main-select').value = data.middag.values.main;
    middagPane.querySelector('.js-dessert-select').value = data.middag.values.dessert;

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteDossier = (kamer) => {
    if(confirm(`Dossier van kamer ${kamer} verwijderen?`)) {
        delete orders[kamer];
        localStorage.setItem('wzc_kamer_dossiers', JSON.stringify(orders));
        showOrders();
    }
};
// #endregion

document.addEventListener('DOMContentLoaded', () => {
    initForms();
    showOrders();
    jsSubmitBtn.addEventListener('click', saveDossier);
});