/*
  API contracts (V1 hooks only)
  GET /api/v1/catalog/channels
  GET /api/v1/catalog/channels/{id}
  GET /api/v1/metrics/operations
*/

const mockDatabase = {
  channels: [
    {
      id: "hbo-go",
      title: "HBO Go",
      genre: "Series",
      highlight: "Dramas e estreias",
      image: "assets/img/hbomax.png",
      backgroundImage: "assets/img/hbomax.png"
    },
    {
      id: "nat-geo",
      title: "National Geographic",
      genre: "Documentarios",
      highlight: "Exploracao e ciencia",
      image: "assets/img/nationalgeographic.png",
      backgroundImage: "assets/img/nationalgeographic.png"
    },
    {
      id: "history",
      title: "History Channel",
      genre: "Historia",
      highlight: "Guerras e civilizacoes",
      image: "assets/img/history.png",
      backgroundImage: "assets/img/history.png"
    },
    {
      id: "discovery",
      title: "Discovery",
      genre: "Natureza",
      highlight: "Vida selvagem",
      image: "assets/img/discovery.png",
      backgroundImage: "assets/img/discovery.png"
    },
    {
      id: "animal-planet",
      title: "Animal Planet",
      genre: "Fauna",
      highlight: "Mundo dos animais",
      image: "assets/img/animalplanet.png",
      backgroundImage: "assets/img/animalplanet.png"
    },
    {
      id: "bbc-earth",
      title: "BBC Earth",
      genre: "Documentarios",
      highlight: "Planeta hostil",
      image: "assets/img/bbcearth.png",
      backgroundImage: "assets/img/bbcearth.png"
    },
    {
      id: "espn",
      title: "ESPN",
      genre: "Esportes",
      highlight: "Eventos ao vivo",
      image: "assets/img/espn.png",
      backgroundImage: "assets/img/espn.png"
    },
    {
      id: "globo",
      title: "Globo",
      genre: "Variedades",
      highlight: "Programacao nacional",
      image: "assets/img/globo.png",
      backgroundImage: "assets/img/globo.png"
    }
  ],
  metrics: {
    avgOpenTime: "2.8s",
    completedSessions: "1,284",
    navigationErrors: "1.7%"
  }
};

const sectionMeta = {
  inicio: {
    title: "Inicio"
  },
  canais: {
    title: "Canais"
  },
  "minha-lista": {
    title: "Minha lista"
  },
  series: {
    title: "Series"
  },
  filmes: {
    title: "Filmes"
  },
  videoconferencia: {
    title: "Videoconferencia"
  }
};

const availableSections = new Set(["inicio", "canais", "minha-lista", "series", "filmes", "videoconferencia"]);

const appState = {
  status: "loading",
  activeSection: "canais",
  channelViewMode: "browse",
  channels: [],
  selectedChannelId: null,
  detailChannelId: null,
  selectedProgramByChannel: {},
  metrics: null,
  focusGroup: "menu",
  focusIndex: 0
};

const ui = {
  topbar: document.querySelector(".topbar"),
  dashboard: document.querySelector(".dashboard"),
  detailsBackTop: document.getElementById("details-back-btn-top"),
  sectionTitle: document.getElementById("section-title"),
  dashboardContent: document.getElementById("dashboard-content"),
  toast: document.getElementById("toast")
};

const routeKeys = {
  view: "view",
  channel: "channel"
};

const channelProgramming = {
  "hbo-go": [
    {
      status: "live",
      statusLabel: "AO VIVO",
      timeInfo: "Comecou ha 20min",
      title: "The Last of Us | Episodio 6",
      year: "2026",
      image: "https://picsum.photos/seed/smartx-hbo-live/900/500",
      progress: 48
    },
    {
      status: "soon",
      statusLabel: "Em breve",
      timeInfo: "21:30 - 22:35",
      title: "House of the Dragon | Episodio 3",
      year: "2026",
      image: "https://picsum.photos/seed/smartx-hbo-next1/900/500"
    },
    {
      status: "soon",
      statusLabel: "Em breve",
      timeInfo: "22:35 - 23:20",
      title: "Westworld | Reprise",
      year: "2026",
      image: "https://picsum.photos/seed/smartx-hbo-next2/900/500"
    },
    {
      status: "soon",
      statusLabel: "Em breve",
      timeInfo: "23:20 - 00:30",
      title: "Cinema Prime | Estreia da noite",
      year: "2026",
      image: "https://picsum.photos/seed/smartx-hbo-next3/900/500"
    }
  ]
};

function fetchChannels() {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      const failMode = new URLSearchParams(window.location.search).get("fail");
      if (failMode === "1") {
        reject(new Error("Falha ao consultar catalogo local."));
        return;
      }

      resolve(mockDatabase.channels);
    }, 560);
  });
}

function fetchMetrics() {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(mockDatabase.metrics), 180);
  });
}

function renderStateBox({ title, description, actionLabel }) {
  return `
    <div class="state-box">
      <h4>${title}</h4>
      <p>${description}</p>
      ${actionLabel ? `<button class="menu-item" data-focusable="true" data-group="content" data-action="retry-load">${actionLabel}</button>` : ""}
    </div>
  `;
}

function renderChannelsSkeleton() {
  return `
    <section class="carousel-section">
      <div class="skeleton-row" aria-hidden="true">
        ${Array.from({ length: 6 }).map(() => '<div class="skeleton-card"></div>').join("")}
      </div>
    </section>
  `;
}

function renderHomeSection() {
  const metrics = appState.metrics || { avgOpenTime: "--", completedSessions: "--", navigationErrors: "--" };
  return `
    <section class="section-shell">
      <h2>Painel de operacao</h2>
      <p>Ambiente de entrada para sessao na TV. Use o menu superior para alternar entre os modulos.</p>
      <div class="metrics-inline">
        <article class="metric-tile">
          <span>Tempo medio para abrir</span>
          <strong>${metrics.avgOpenTime}</strong>
        </article>
        <article class="metric-tile">
          <span>Sessoes concluidas hoje</span>
          <strong>${metrics.completedSessions}</strong>
        </article>
        <article class="metric-tile">
          <span>Erros de navegacao</span>
          <strong>${metrics.navigationErrors}</strong>
        </article>
      </div>
    </section>
  `;
}

function renderChannelsSection() {
  if (appState.status === "loading") {
    return renderChannelsSkeleton();
  }

  if (appState.status === "error") {
    return renderStateBox({
      title: "Erro ao atualizar canais",
      description: "Nao foi possivel buscar os dados. Tente novamente.",
      actionLabel: "Tentar novamente"
    });
  }

  if (!appState.channels.length) {
    return renderStateBox({
      title: "Catalogo vazio",
      description: "Nenhum canal disponivel para o perfil atual."
    });
  }

  return `
    <section class="carousel-section" aria-label="Carrossel de canais">
      <div class="carousel-shell" data-carousel-shell data-carousel-id="channels">
        <div class="carousel-lane carousel-lane-left" data-carousel-lane="left">
          <button class="carousel-btn" data-focusable="false" data-group="content" data-action="carousel-prev" data-carousel-target="channels" aria-label="Voltar canais">&#10094;</button>
        </div>

        <div class="carousel-viewport" data-carousel-viewport>
          <div class="carousel-track" role="list">
            ${appState.channels
              .map((channel) => {
                const selectedClass = channel.id === appState.selectedChannelId ? "is-selected" : "";
                return `
                  <article
                    class="catalog-item ${selectedClass}"
                    role="listitem"
                    data-focusable="true"
                    data-group="content"
                    data-action="select-channel"
                    data-channel-id="${channel.id}"
                    tabindex="0"
                  >
                    <img class="catalog-thumb" src="${channel.image}" alt="Poster do canal ${channel.title}" loading="lazy" />
                    <div class="catalog-overlay">
                      <h4>${channel.title}</h4>
                      <p>${channel.highlight}</p>
                    </div>
                  </article>
                `;
              })
              .join("")}
          </div>
        </div>

        <div class="carousel-lane carousel-lane-right" data-carousel-lane="right">
          <button class="carousel-btn" data-focusable="false" data-group="content" data-action="carousel-next" data-carousel-target="channels" aria-label="Avancar canais">&#10095;</button>
        </div>
      </div>
    </section>
    ${renderChannelRowsSection()}
  `;
}

function getChannelById(channelId) {
  return appState.channels.find((channel) => channel.id === channelId) || null;
}

function getSelectedProgramIndex(channelId, programs) {
  const stored = appState.selectedProgramByChannel[channelId];
  const fallback = 0;
  if (!Number.isInteger(stored)) {
    return fallback;
  }

  return Math.max(0, Math.min(stored, programs.length - 1));
}

function getChannelCategories(channelId) {
  const categoriesByChannel = {
    "hbo-go": ["Acao", "Suspense", "Drama", "Ficcao"],
    globo: ["Filmes nacionais", "Comedia", "Acao", "Romance"]
  };

  return categoriesByChannel[channelId] || [];
}

function getChannelProgramming(channel) {
  const predefined = channelProgramming[channel.id];
  if (Array.isArray(predefined) && predefined.length) {
    return predefined;
  }

  return [
    {
      status: "live",
      statusLabel: "AO VIVO",
      timeInfo: "Comecou ha 12min",
      title: `Ao vivo | Especial ${channel.title}`,
      year: "2026",
      image: channel.backgroundImage,
      progress: 34
    },
    {
      status: "soon",
      statusLabel: "Em breve",
      timeInfo: "21:10 - 22:00",
      title: `Reprise | Destaques ${channel.title}`,
      year: "2026",
      image: `https://picsum.photos/seed/smartx-${channel.id}-next-1/900/500`
    },
    {
      status: "soon",
      statusLabel: "Em breve",
      timeInfo: "22:00 - 23:20",
      title: `Programa especial | ${channel.title}`,
      year: "2026",
      image: `https://picsum.photos/seed/smartx-${channel.id}-next-2/900/500`
    }
  ];
}

function renderProgramCard({ channelId, program, programIndex, isSelected, showStatus = true }) {
  const statusClass = program.status === "live" ? "is-live" : "is-soon";
  const progressMarkup = showStatus && program.status === "live" ? `<progress class="program-progress" max="100" value="${program.progress || 0}"></progress>` : "";
  const statusMarkup = showStatus ? `<span class="program-status ${statusClass}">${program.statusLabel}</span>` : "";
  const selectedClass = isSelected ? "is-selected" : "";

  return `
    <article
      class="program-card ${selectedClass}"
      data-program-card
      data-focusable="true"
      data-group="content"
      data-action="select-program"
      data-channel-id="${channelId}"
      data-program-index="${programIndex}"
      data-program-image="${program.image}"
    >
      <div class="program-visual">
        <img src="${program.image}" alt="Capa da programacao ${program.title}" loading="lazy" />
        <div class="program-overlay">
          ${statusMarkup}
          ${progressMarkup}
        </div>
      </div>
      <div class="program-meta">
        <span>${program.timeInfo}</span>
        <strong>${program.title}</strong>
        <small>${program.year}</small>
      </div>
    </article>
  `;
}

function renderChannelRowsSection() {
  return `
    <section class="channel-rows" aria-label="Faixas por canal">
      ${appState.channels
        .map((channel) => {
          const channelId = `channel-${channel.id}`;
          const schedule = getChannelProgramming(channel);
          const selectedProgramIndex = getSelectedProgramIndex(channel.id, schedule);
          const selectedProgram = schedule[selectedProgramIndex] || schedule[0];
          const activeClass = channel.id === appState.selectedChannelId ? "is-active" : "";

          return `
            <section
              class="channel-hero-section ${activeClass}"
              id="${channelId}"
              data-channel-section="${channel.id}"
              style="--channel-bg: url('${selectedProgram.image || channel.backgroundImage}')"
            >
              <div class="channel-hero-left">
                <h3>${channel.title}</h3>
                <button class="channel-details-btn" data-focusable="true" data-group="content" data-action="channel-details" data-channel-id="${channel.id}">DETALHES</button>
              </div>

              <div class="channel-hero-right">
                <div class="carousel-shell" data-carousel-shell data-carousel-id="${channelId}">
                  <div class="carousel-lane carousel-lane-left" data-carousel-lane="left">
                    <button class="carousel-btn" data-focusable="false" data-group="content" data-action="carousel-prev" data-carousel-target="${channelId}" aria-label="Voltar programacao de ${channel.title}">&#10094;</button>
                  </div>

                  <div class="carousel-viewport" data-carousel-viewport>
                    <div class="carousel-track program-track" role="list">
                      ${schedule
                        .map((program, index) =>
                          renderProgramCard({
                            channelId: channel.id,
                            program,
                            programIndex: index,
                            isSelected: index === selectedProgramIndex
                          })
                        )
                        .join("")}
                    </div>
                  </div>

                  <div class="carousel-lane carousel-lane-right" data-carousel-lane="right">
                    <button class="carousel-btn" data-focusable="false" data-group="content" data-action="carousel-next" data-carousel-target="${channelId}" aria-label="Avancar programacao de ${channel.title}">&#10095;</button>
                  </div>
                </div>
              </div>
            </section>
          `;
        })
        .join("")}
    </section>
  `;
}

function renderDetailCardsSection({ sectionId, title, channelId, programs, showStatus }) {
  return `
    <section id="${sectionId}" class="carousel-section details-carousel-section details-snap-section" data-details-section aria-label="${title}">
      <h3 class="details-section-title">${title}</h3>
      <div class="carousel-shell" data-carousel-shell data-carousel-id="${sectionId}">
        <div class="carousel-lane carousel-lane-left" data-carousel-lane="left">
          <button class="carousel-btn" data-focusable="false" data-group="content" data-action="carousel-prev" data-carousel-target="${sectionId}" aria-label="Voltar ${title}">&#10094;</button>
        </div>

        <div class="carousel-viewport" data-carousel-viewport>
          <div class="carousel-track program-track" role="list">
            ${programs
              .map((program) =>
                renderProgramCard({
                  channelId,
                  program,
                  programIndex: program.programIndex,
                  isSelected: appState.selectedProgramByChannel[channelId] === program.programIndex,
                  showStatus
                })
              )
              .join("")}
          </div>
        </div>

        <div class="carousel-lane carousel-lane-right" data-carousel-lane="right">
          <button class="carousel-btn" data-focusable="false" data-group="content" data-action="carousel-next" data-carousel-target="${sectionId}" aria-label="Avancar ${title}">&#10095;</button>
        </div>
      </div>
    </section>
  `;
}

function getProgramsByIndexes(schedule, indexes) {
  return indexes
    .map((index) => ({
      ...schedule[index],
      programIndex: index
    }))
    .filter((program) => Boolean(program?.title));
}

function renderChannelDetailsView() {
  const channel = getChannelById(appState.detailChannelId);
  if (!channel) {
    return renderStateBox({
      title: "Canal nao encontrado",
      description: "Nao foi possivel abrir os detalhes deste canal."
    });
  }

  const schedule = getChannelProgramming(channel);
  const selectedProgramIndex = getSelectedProgramIndex(channel.id, schedule);
  const selectedProgram = schedule[selectedProgramIndex] || schedule[0];
  const indexedSchedule = schedule.map((program, index) => ({ ...program, programIndex: index }));
  const livePrograms = indexedSchedule.filter((program) => program.status === "live" || program.status === "soon");
  const reprisePrograms = indexedSchedule.filter((program) => program.title.toLowerCase().includes("reprise"));
  const highlights = indexedSchedule.slice(0, 4);
  const categories = getChannelCategories(channel.id);

  const categorySections = categories.map((category, idx) => {
    const base = idx % schedule.length;
    const categoryPrograms = getProgramsByIndexes(schedule, [base, (base + 1) % schedule.length, (base + 2) % schedule.length]);
    return renderDetailCardsSection({
      sectionId: `details-${channel.id}-category-${idx}`,
      title: category,
      channelId: channel.id,
      programs: categoryPrograms,
      showStatus: false
    });
  });

  return `
    <section class="channel-details-view">
      <section class="details-overlay-content" data-detail-hero data-channel-id="${channel.id}">
        <span class="program-status ${selectedProgram.status === "live" ? "is-live" : "is-soon"}">${selectedProgram.status === "live" ? "AO VIVO" : "Em breve"}</span>
        <h2>${selectedProgram.title}</h2>
        <p>${selectedProgram.timeInfo}</p>
      </section>

      <div class="details-scroll-area" data-details-scroll-area>
        <nav class="details-vertical-nav" aria-label="Navegacao vertical de secoes">
          <button class="carousel-btn" data-focusable="false" data-group="content" data-action="details-prev-section" aria-label="Secao anterior">&#9650;</button>
          <button class="carousel-btn" data-focusable="false" data-group="content" data-action="details-next-section" aria-label="Proxima secao">&#9660;</button>
        </nav>

        <div class="details-sections-stack">

        ${renderDetailCardsSection({
          sectionId: `details-${channel.id}-live`,
          title: "Ao vivo",
          channelId: channel.id,
          programs: livePrograms.length ? livePrograms : [indexedSchedule[0]],
          showStatus: true
        })}

        ${renderDetailCardsSection({
          sectionId: `details-${channel.id}-highlights`,
          title: "Destaques da programacao",
          channelId: channel.id,
          programs: highlights,
          showStatus: false
        })}

        ${renderDetailCardsSection({
          sectionId: `details-${channel.id}-reprises`,
          title: "Reprises",
          channelId: channel.id,
          programs: reprisePrograms.length ? reprisePrograms : indexedSchedule.slice(1, 4),
          showStatus: false
        })}

        ${categorySections.join("")}
        </div>
      </div>
    </section>
  `;
}

function renderPlaceholderSection(section) {
  const map = {
    "minha-lista": {
      title: "Minha lista",
      description: "Lista pessoal de canais e conteudos fixados para acesso rapido.",
      items: [
        "Favoritos recentes",
        "Continuar assistindo",
        "Alertas de novos episodios"
      ]
    },
    series: {
      title: "Series",
      description: "Area de series com recomendacoes por genero e comportamento.",
      items: [
        "Top da semana",
        "Novas temporadas",
        "Recomendado para voce"
      ]
    },
    filmes: {
      title: "Filmes",
      description: "Colecao de filmes com trilhas por tema, duracao e classificacao.",
      items: [
        "Estreias",
        "Classicos",
        "Festival de documentarios"
      ]
    },
    videoconferencia: {
      title: "Videoconferencia",
      description: "Modulo em planejamento para chamadas entre usuarios em telas de TV.",
      items: [
        "Sala privada",
        "Assistir junto",
        "Convites por contato"
      ]
    }
  };

  const current = map[section];
  if (!current) {
    return renderStateBox({ title: "Secao indisponivel", description: "Modulo em configuracao." });
  }

  return `
    <section class="section-shell">
      <h2>${current.title}</h2>
      <p>${current.description}</p>
      <div class="placeholder-grid">
        ${current.items
          .map(
            (item) => `
              <article class="placeholder-card" data-focusable="true" data-group="content" data-action="roadmap" data-feature="${section}">
                <h4>${item}</h4>
                <p>Interface em evolucao para a proxima etapa.</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderDashboardContent() {
  const meta = sectionMeta[appState.activeSection] || sectionMeta.canais;
  const detailsChannel = getChannelById(appState.detailChannelId);
  const isDetailsMode = appState.activeSection === "canais" && appState.channelViewMode === "channel-details" && Boolean(detailsChannel);

  ui.sectionTitle.textContent = isDetailsMode ? detailsChannel.title : meta.title;
  document.body.classList.toggle("is-details-mode", isDetailsMode);
  ui.topbar?.classList.toggle("is-details-topbar", isDetailsMode);
  ui.dashboard?.classList.toggle("is-details-dashboard", isDetailsMode);

  if (ui.detailsBackTop) {
    ui.detailsBackTop.classList.toggle("is-visible", isDetailsMode);
    ui.detailsBackTop.dataset.focusable = isDetailsMode ? "true" : "false";
  }

  if (isDetailsMode) {
    const schedule = getChannelProgramming(detailsChannel);
    const selectedProgramIndex = getSelectedProgramIndex(detailsChannel.id, schedule);
    const selectedProgram = schedule[selectedProgramIndex] || schedule[0];
    ui.dashboard?.style.setProperty("--details-bg", `url('${selectedProgram.image || detailsChannel.backgroundImage}')`);
  } else {
    ui.dashboard?.style.removeProperty("--details-bg");
  }

  if (appState.activeSection === "inicio") {
    ui.dashboardContent.innerHTML = renderHomeSection();
    return;
  }

  if (appState.activeSection === "canais") {
    if (appState.channelViewMode === "channel-details") {
      ui.dashboardContent.innerHTML = renderChannelDetailsView();
      setupAllCarousels();
    } else {
      ui.dashboardContent.innerHTML = renderChannelsSection();
      setupAllCarousels();
    }
    return;
  }

  ui.dashboardContent.innerHTML = renderPlaceholderSection(appState.activeSection);
}

function setMenuActive(section) {
  document.querySelectorAll(".menu-item").forEach((button) => {
    const isCurrent = button.dataset.section === section;
    button.classList.toggle("is-active", isCurrent);
  });
}

function getRouteStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    view: params.get(routeKeys.view),
    channelId: params.get(routeKeys.channel)
  };
}

function syncUrlWithState({ replace = false } = {}) {
  const nextUrl = new URL(window.location.href);

  if (appState.activeSection === "canais" && appState.channelViewMode === "channel-details" && appState.detailChannelId) {
    nextUrl.searchParams.set(routeKeys.view, "details");
    nextUrl.searchParams.set(routeKeys.channel, appState.detailChannelId);
  } else {
    nextUrl.searchParams.delete(routeKeys.view);
    nextUrl.searchParams.delete(routeKeys.channel);
  }

  const next = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next === current) {
    return;
  }

  if (replace) {
    window.history.replaceState({}, "", next);
    return;
  }

  window.history.pushState({}, "", next);
}

function applyRouteStateFromUrl() {
  const routeState = getRouteStateFromUrl();
  if (routeState.view === "details" && routeState.channelId) {
    const channel = getChannelById(routeState.channelId);
    if (channel) {
      appState.activeSection = "canais";
      appState.channelViewMode = "channel-details";
      appState.detailChannelId = channel.id;
      appState.selectedChannelId = channel.id;
      setMenuActive("canais");
      return true;
    }
  }

  appState.channelViewMode = "browse";
  appState.detailChannelId = null;
  setMenuActive(appState.activeSection);
  return false;
}

function findFocusableByGroup(group) {
  if (group === "menu") {
    return Array.from(document.querySelectorAll(".menu-item[data-focusable='true']"));
  }

  if (group === "content") {
    return Array.from(document.querySelectorAll("#dashboard-content [data-focusable='true']"));
  }

  return Array.from(document.querySelectorAll("[data-focusable='true']"));
}

function applyFocusVisual(element) {
  document.querySelectorAll(".is-focused").forEach((node) => {
    node.classList.remove("is-focused");
  });
  element.classList.add("is-focused");
  element.focus();
}

function focusGroup(group, direction = 1) {
  const list = findFocusableByGroup(group);
  if (!list.length) {
    return;
  }

  appState.focusGroup = group;
  appState.focusIndex = Math.max(0, Math.min(appState.focusIndex, list.length - 1));
  if (direction !== 0) {
    appState.focusIndex = (appState.focusIndex + list.length + direction) % list.length;
  }

  const element = list[appState.focusIndex];
  if (element) {
    applyFocusVisual(element);
    if (element.classList.contains("catalog-item")) {
      element.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
    }
  }
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("is-visible");
  window.setTimeout(() => ui.toast.classList.remove("is-visible"), 2000);
}

function setSection(section) {
  setMenuActive(section);

  if (!availableSections.has(section)) {
    showToast(`A secao ${section} entra no roadmap apos V1.`);
    return;
  }

  appState.activeSection = section;
  appState.channelViewMode = "browse";
  appState.detailChannelId = null;
  renderDashboardContent();
  syncUrlWithState();
  appState.focusGroup = "menu";
  appState.focusIndex = -1;
  focusGroup("menu", 1);
}

function selectProgramCard(channelId, programIndex, programImage) {
  const channel = getChannelById(channelId);
  if (!channel) {
    return;
  }

  appState.selectedProgramByChannel[channelId] = programIndex;
  selectChannel(channelId, false);

  if (appState.channelViewMode === "channel-details" && appState.detailChannelId === channelId) {
    const schedule = getChannelProgramming(channel);
    const selectedProgram = schedule[programIndex] || schedule[0];

    if (selectedProgram) {
      ui.dashboard?.style.setProperty("--details-bg", `url('${selectedProgram.image || channel.backgroundImage}')`);

      const detailsContent = document.querySelector(".details-overlay-content");
      if (detailsContent) {
        const statusNode = detailsContent.querySelector(".program-status");
        const titleNode = detailsContent.querySelector("h2");
        const timeNode = detailsContent.querySelector("p");

        if (statusNode) {
          const isLive = selectedProgram.status === "live";
          statusNode.textContent = isLive ? "AO VIVO" : "Em breve";
          statusNode.classList.toggle("is-live", isLive);
          statusNode.classList.toggle("is-soon", !isLive);
        }

        if (titleNode) {
          titleNode.textContent = selectedProgram.title;
        }

        if (timeNode) {
          timeNode.textContent = selectedProgram.timeInfo;
        }
      }
    }

    document.querySelectorAll(`[data-program-card][data-channel-id="${channelId}"]`).forEach((card) => {
      card.classList.toggle("is-selected", Number(card.dataset.programIndex) === programIndex);
    });

    return;
  }

  const bgValue = `url('${programImage}')`;
  document.querySelectorAll(`[data-channel-section="${channelId}"]`).forEach((section) => {
    section.style.setProperty("--channel-bg", bgValue);
  });

  document.querySelectorAll(`[data-program-card][data-channel-id="${channelId}"]`).forEach((card) => {
    card.classList.toggle("is-selected", Number(card.dataset.programIndex) === programIndex);
  });
}

function openChannelDetails(channelId) {
  const channel = getChannelById(channelId);
  if (!channel) {
    return;
  }

  appState.channelViewMode = "channel-details";
  appState.detailChannelId = channelId;
  setMenuActive("canais");
  renderDashboardContent();
  syncUrlWithState();
  window.scrollTo({ top: 0, behavior: "auto" });
  document.querySelectorAll(".is-focused").forEach((node) => node.classList.remove("is-focused"));
  ui.detailsBackTop?.focus();
  appState.focusGroup = "content";
  appState.focusIndex = -1;
}

function closeChannelDetails() {
  appState.channelViewMode = "browse";
  appState.detailChannelId = null;
  renderDashboardContent();
  syncUrlWithState({ replace: true });
}

function selectChannel(channelId, shouldScrollToSection = false) {
  const match = appState.channels.find((channel) => channel.id === channelId);
  if (!match) {
    return;
  }

  appState.selectedChannelId = channelId;
  document.querySelectorAll(".catalog-item").forEach((item) => {
    item.classList.toggle("is-selected", item.dataset.channelId === channelId);
  });

  document.querySelectorAll("[data-channel-section]").forEach((section) => {
    section.classList.toggle("is-active", section.dataset.channelSection === channelId);
  });

  if (shouldScrollToSection) {
    const targetSection = document.getElementById(`channel-${channelId}`);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

function findCarouselShell(carouselId) {
  return document.querySelector(`[data-carousel-shell][data-carousel-id="${carouselId}"]`);
}

function scrollCarousel(carouselId, direction) {
  const shell = findCarouselShell(carouselId);
  const viewport = shell?.querySelector("[data-carousel-viewport]");
  if (!viewport || !shell) {
    return;
  }

  const step = Math.max(260, Math.round(viewport.clientWidth * 0.58));
  viewport.scrollBy({ left: direction * step, behavior: "smooth" });
  window.setTimeout(() => updateCarouselArrowState(shell), 220);
}

function updateCarouselArrowState(shell) {
  const viewport = shell?.querySelector("[data-carousel-viewport]");
  const leftLane = shell?.querySelector('[data-carousel-lane="left"]');
  const rightLane = shell?.querySelector('[data-carousel-lane="right"]');
  if (!viewport || !leftLane || !rightLane) {
    return;
  }

  const leftButton = leftLane.querySelector(".carousel-btn");
  const rightButton = rightLane.querySelector(".carousel-btn");

  const canScrollLeft = viewport.scrollLeft > 2;
  const canScrollRight = viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 2;

  leftLane.classList.toggle("is-available", canScrollLeft);
  rightLane.classList.toggle("is-available", canScrollRight);

  if (leftButton) {
    leftButton.disabled = !canScrollLeft;
    leftButton.dataset.focusable = canScrollLeft ? "true" : "false";
  }

  if (rightButton) {
    rightButton.disabled = !canScrollRight;
    rightButton.dataset.focusable = canScrollRight ? "true" : "false";
  }
}

function setupCarouselShell(shell) {
  const viewport = shell?.querySelector("[data-carousel-viewport]");
  if (!shell || !viewport) {
    return;
  }

  if (!shell.dataset.bound) {
    shell.dataset.bound = "1";

    shell.addEventListener("mousemove", (event) => {
      const rect = shell.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const zone = 64;
      shell.classList.toggle("near-left", x <= zone);
      shell.classList.toggle("near-right", x >= rect.width - zone);
    });

    shell.addEventListener("mouseleave", () => {
      shell.classList.remove("near-left", "near-right");
    });

    viewport.addEventListener("scroll", () => updateCarouselArrowState(shell));
  }

  updateCarouselArrowState(shell);
}

function setupAllCarousels() {
  document.querySelectorAll("[data-carousel-shell]").forEach((shell) => {
    setupCarouselShell(shell);
  });
}

function scrollDetailsSection(direction) {
  const scrollArea = document.querySelector("[data-details-scroll-area]");
  const sections = Array.from(document.querySelectorAll(".details-snap-section"));
  if (!sections.length || !scrollArea) {
    return;
  }

  const anchor = scrollArea.scrollTop + Math.round(scrollArea.clientHeight * 0.32);
  let currentIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  sections.forEach((section, index) => {
    const distance = Math.abs(section.offsetTop - anchor);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      currentIndex = index;
    }
  });

  const nextIndex = Math.max(0, Math.min(sections.length - 1, currentIndex + direction));
  scrollArea.scrollTo({ top: sections[nextIndex].offsetTop, behavior: "smooth" });
}

function initializeProgramSelections(channels) {
  const map = {};
  channels.forEach((channel) => {
    map[channel.id] = 0;
  });
  appState.selectedProgramByChannel = map;
}

async function loadInitialData() {
  appState.status = "loading";
  renderDashboardContent();

  try {
    const [channels, metrics] = await Promise.all([fetchChannels(), fetchMetrics()]);
    appState.channels = channels;
    appState.selectedChannelId = channels[0]?.id || null;
    initializeProgramSelections(channels);
    appState.metrics = metrics;
    appState.status = "ready";

    applyRouteStateFromUrl();
    renderDashboardContent();
    syncUrlWithState({ replace: true });

    appState.focusGroup = appState.channelViewMode === "channel-details" ? "content" : "menu";
    appState.focusIndex = -1;
    focusGroup(appState.focusGroup, 1);
  } catch (error) {
    appState.status = "error";
    renderDashboardContent();
  }
}

function handleAction(action, target) {
  if (!action) {
    return;
  }

  if (action === "retry-load") {
    loadInitialData();
    return;
  }

  if (action === "section") {
    setSection(target.dataset.section);
    return;
  }

  if (action === "select-channel") {
    selectChannel(target.dataset.channelId, true);
    return;
  }

  if (action === "select-program") {
    selectProgramCard(target.dataset.channelId, Number(target.dataset.programIndex), target.dataset.programImage);
    return;
  }

  if (action === "channel-details") {
    openChannelDetails(target.dataset.channelId);
    return;
  }

  if (action === "details-back") {
    closeChannelDetails();
    return;
  }

  if (action === "details-prev-section") {
    scrollDetailsSection(-1);
    return;
  }

  if (action === "details-next-section") {
    scrollDetailsSection(1);
    return;
  }

  if (action === "carousel-prev") {
    scrollCarousel(target.dataset.carouselTarget, -1);
    return;
  }

  if (action === "carousel-next") {
    scrollCarousel(target.dataset.carouselTarget, 1);
    return;
  }

  if (action === "roadmap") {
    showToast(`Recurso ${target.dataset.feature || "futuro"} planejado para V1.1+.`);
  }
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }

  handleAction(target.dataset.action, target);
});

document.addEventListener("keydown", (event) => {
  const key = event.key;
  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(key)) {
    return;
  }

  if (key === "ArrowRight") {
    event.preventDefault();
    if (appState.focusGroup === "menu") {
      focusGroup("menu", 1);
      return;
    }

    focusGroup("content", 1);
    return;
  }

  if (key === "ArrowLeft") {
    event.preventDefault();
    if (appState.focusGroup === "menu") {
      focusGroup("menu", -1);
      return;
    }

    focusGroup("content", -1);
    return;
  }

  if (key === "ArrowDown") {
    event.preventDefault();
    appState.focusIndex = -1;
    focusGroup("content", 1);
    return;
  }

  if (key === "ArrowUp") {
    event.preventDefault();
    appState.focusIndex = -1;
    focusGroup("menu", 1);
    return;
  }

  if (key === "Enter") {
    event.preventDefault();
    const currentGroup = findFocusableByGroup(appState.focusGroup);
    const element = currentGroup[appState.focusIndex];
    if (element?.dataset?.action) {
      handleAction(element.dataset.action, element);
    }
  }
});

window.addEventListener("popstate", () => {
  if (appState.status !== "ready") {
    return;
  }

  applyRouteStateFromUrl();
  renderDashboardContent();
});

loadInitialData();
