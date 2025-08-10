"use strict";

(() => {
  const selector = (sel) => document.querySelector(sel);

  const getJSON = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const getJSONWithNewPromise = (url) =>
    new Promise((resolve, reject) => {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(resolve)
        .catch(reject);
    });

  const FIELDS = "name,population,currencies,region";
  const urlAll  = `https://restcountries.com/v3.1/all?fields=${FIELDS}`;
  const urlName = (q) => `https://restcountries.com/v3.1/name/${encodeURIComponent(q)}?fields=${FIELDS}`;

  const formatNum = (n) =>
    (typeof n === "number" && isFinite(n)) ? n.toLocaleString("en") : "0";

  const computeStats = (arr) => {
    const init = { count:0, totalPop:0, countriesRows:[], regions:{}, currencies:{} };

    const out = (arr || []).reduce((acc, c) => {
      const name = (c && c.name && c.name.common) ? c.name.common : "—";
      const pop  = (c && typeof c.population === "number") ? c.population : 0;

      acc.count += 1;
      acc.totalPop += pop;
      acc.countriesRows.push(`<tr><td>${name}</td><td>${formatNum(pop)}</td></tr>`);

      const region = (c && c.region) ? c.region : "Unknown";
      acc.regions[region] = (acc.regions[region] || 0) + 1;

      if (c && c.currencies && typeof c.currencies === "object") {
        Object.keys(c.currencies).forEach((code) => {
          acc.currencies[code] = (acc.currencies[code] || 0) + 1;
        });
      }
      return acc;
    }, init);

    const avg = out.count ? Math.round(out.totalPop / out.count) : 0;

    const regionsHTML = Object.keys(out.regions)
      .sort((a,b) => a.localeCompare(b))
      .map((k) => `<tr><td>${k}</td><td>${out.regions[k]}</td></tr>`)
      .join("");

    const currHTML = Object.keys(out.currencies)
      .sort((a,b) => a.localeCompare(b))
      .map((k) => `<tr><td>${k}</td><td>${out.currencies[k]}</td></tr>`)
      .join("");

    return {
      count: out.count,
      totalPop: out.totalPop,
      avgPop: avg,
      countriesHTML: out.countriesRows.join(""),
      regionsHTML,
      currHTML
    };
  };

  const clearError = () => { const el = selector("#error"); el.hidden = true; el.textContent = ""; };
  const showError  = (msg) => { const el = selector("#error"); el.textContent = msg; el.hidden = false; };

  const triggerFrameAnimation = () => {
    ["#countries-wrap", "#regions-wrap", "#currencies-wrap"].forEach((id) => {
      const wrap = selector(id);
      if (!wrap) return;
      wrap.classList.remove("animate-frame");
      setTimeout(() => {
        wrap.classList.add("animate-frame");
      }, 0); 
    });
  };

  const renderStats = (arr) => {
    const { count, totalPop, avgPop, countriesHTML, regionsHTML, currHTML } = computeStats(arr);

    selector("#stat-count").textContent      = String(count);
    selector("#stat-pop-total").textContent  = formatNum(totalPop);
    selector("#stat-pop-avg").textContent    = formatNum(avgPop);

    selector("#tbl-countries-body").innerHTML = countriesHTML;
    selector("#tbl-regions-body").innerHTML   = regionsHTML;
    selector("#tbl-currencies-body").innerHTML= currHTML;

    selector("#stats").hidden = false;

    triggerFrameAnimation();
  };

  const form   = selector("#search-form");
  const input  = selector("#country-input");
  const btnAll = selector("#btn-all");

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    clearError();
    selector("#stats").hidden = true;

    const q = input.value.trim();
    if (!q) { showError("Please enter a country name (or part of it)."); return; }

    try {
      const data = await getJSON(urlName(q));
      renderStats(data);
    } catch (e) {
      showError(`Search failed: ${e.message}`);
    }
  });

  btnAll.addEventListener("click", () => {
    clearError();
    selector("#stats").hidden = true;

    getJSONWithNewPromise(urlAll)
      .then((data) => renderStats(data))
      .catch((e) => showError(`ALL failed: ${e.message}`));
  });
})();
