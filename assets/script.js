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
  homeFeaturedIndex: 0,
  channels: [],
  selectedChannelId: null,
  detailChannelId: null,
  programDetailReturnMode: "browse",
  programPlayerReturnMode: "browse",
  selectedProgramByChannel: {},
  watchlistProgramKeys: [],
  metrics: null,
  focusGroup: "menu",
  focusIndex: 0
};

let homeHeroAutoRotateTimer = null;

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
  channel: "channel",
  program: "program"
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

function deriveProgramGenre(channel, program, index) {
  const text = `${channel.genre} ${program.title}`.toLowerCase();
  if (text.includes("document")) {
    return "Documentario";
  }
  if (text.includes("comedia")) {
    return "Comedia";
  }
  if (text.includes("drama")) {
    return "Drama";
  }
  if (text.includes("fic") || text.includes("sci")) {
    return "Ficcao Cientifica";
  }
  if (text.includes("acao") || text.includes("guerra")) {
    return "Acao";
  }

  const fallback = ["Acao", "Ficcao Cientifica", "Comedia", "Drama"];
  return fallback[(index + channel.title.length) % fallback.length];
}

function getAllProgramsCatalog() {
  if (!appState.channels.length) {
    return [];
  }

  return appState.channels.flatMap((channel) => {
    const schedule = getChannelProgramming(channel);
    return schedule.map((program, programIndex) => ({
      channelId: channel.id,
      channelTitle: channel.title,
      channelGenre: channel.genre,
      programIndex,
      program,
      genreLabel: deriveProgramGenre(channel, program, programIndex)
    }));
  });
}

function getHomeFeaturedPrograms() {
  const pool = getAllProgramsCatalog();
  if (!pool.length) {
    return [];
  }

  const ordered = [...pool].sort((a, b) => Number(b.program.status === "live") - Number(a.program.status === "live"));
  const featured = ordered.slice(0, 6);
  while (featured.length < 6) {
    featured.push(ordered[featured.length % ordered.length]);
  }
  return featured;
}

function getHomeRailsData() {
  const pool = getAllProgramsCatalog();
  const watchlistKeys = new Set(appState.watchlistProgramKeys);
  const continueWatching = [...pool].sort((a, b) => Number(b.program.status === "live") - Number(a.program.status === "live")).slice(0, 14);
  const minhaLista = getWatchlistPrograms().map((item) => ({
    channelId: item.channelId,
    channelTitle: item.channel.title,
    channelGenre: item.channel.genre,
    programIndex: item.programIndex,
    program: item.program,
    genreLabel: deriveProgramGenre(item.channel, item.program, item.programIndex)
  }));
  const recomendados = pool.filter((item) => !watchlistKeys.has(getProgramKey(item.channelId, item.programIndex))).slice(0, 14);
  const top10 = [...pool].slice(0, 10);

  const genreRows = ["Acao", "Ficcao Cientifica", "Comedia", "Drama"]
    .map((genre) => {
      const items = pool.filter((item) => item.genreLabel === genre).slice(0, 14);
      if (!items.length) {
        return null;
      }
      return {
        id: `home-genre-${genre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        title: `Filmes de ${genre}`,
        items
      };
    })
    .filter((row) => Boolean(row));

  return {
    continueWatching,
    minhaLista,
    recomendados,
    top10,
    genreRows
  };
}

function renderHomeRailSection({ id, title, items, isTop10 = false }) {
  if (!items.length) {
    return "";
  }

  const cardMarkup = isTop10
    ? items
        .map(
          (item, index) => `
            <article
              class="home-top10-card"
              data-focusable="true"
              data-group="content"
              data-action="select-program"
              data-channel-id="${item.channelId}"
              data-program-index="${item.programIndex}"
            >
              <span class="home-top10-rank" aria-hidden="true">${index + 1}</span>
              <div class="home-top10-visual">
                <img src="${item.program.image}" alt="Capa do Top 10 ${item.program.title}" loading="lazy" />
              </div>
            </article>
          `
        )
        .join("")
    : items
        .map((item) =>
          renderProgramCard({
            channelId: item.channelId,
            program: item.program,
            programIndex: item.programIndex,
            isSelected: false,
            showStatus: false
          })
        )
        .join("");

  return `
    <section class="home-rail-section" aria-label="${title}">
      <h3 class="home-rail-title">${title}</h3>
      <div class="carousel-shell" data-carousel-shell data-carousel-id="${id}">
        <div class="carousel-lane carousel-lane-left" data-carousel-lane="left">
          <button class="carousel-btn" data-focusable="false" data-group="content" data-action="carousel-prev" data-carousel-target="${id}" aria-label="Voltar ${title}">&#10094;</button>
        </div>

        <div class="carousel-viewport" data-carousel-viewport>
          <div class="carousel-track program-track ${isTop10 ? "home-top10-track" : ""}" role="list">
            ${cardMarkup}
          </div>
        </div>

        <div class="carousel-lane carousel-lane-right" data-carousel-lane="right">
          <button class="carousel-btn" data-focusable="false" data-group="content" data-action="carousel-next" data-carousel-target="${id}" aria-label="Avancar ${title}">&#10095;</button>
        </div>
      </div>
    </section>
  `;
}

function renderHomeSection() {
  const featured = getHomeFeaturedPrograms();
  if (!featured.length) {
    return renderStateBox({
      title: "Sem destaques no momento",
      description: "Nao foi possivel montar os destaques da home."
    });
  }

  appState.homeFeaturedIndex = Math.max(0, Math.min(appState.homeFeaturedIndex || 0, featured.length - 1));
  const active = featured[appState.homeFeaturedIndex];
  const rails = getHomeRailsData();

  return `
    <section class="home-screen" aria-label="Destaques da home">
      <section class="home-hero" aria-label="Slide principal de destaques">
        <div class="home-hero-slides" role="presentation">
          ${featured
            .map(
              (item, index) => `
                <article class="home-hero-slide ${index === appState.homeFeaturedIndex ? "is-active" : ""}" aria-hidden="${index === appState.homeFeaturedIndex ? "false" : "true"}">
                  <img src="${item.program.image}" alt="Destaque ${item.program.title}" loading="eager" />
                </article>
              `
            )
            .join("")}
        </div>

        <div class="home-hero-scrim" aria-hidden="true"></div>

        <div class="home-hero-content">
          <h2>${active.program.title}</h2>
          <div class="home-hero-meta">
            <span class="home-hero-rating">16</span>
            <span>${active.program.year}</span>
            <span>${active.genreLabel}</span>
          </div>
          <p>${active.program.status === "live" ? `Em exibicao agora em ${active.channelTitle}.` : `${active.program.timeInfo} em ${active.channelTitle}.`}</p>
          <div class="home-hero-actions">
            <button class="program-watch-btn" data-focusable="true" data-group="content" data-action="watch-program" data-channel-id="${active.channelId}" data-program-index="${active.programIndex}">Assistir agora</button>
            <button class="home-hero-info-btn" data-focusable="true" data-group="content" data-action="select-program" data-channel-id="${active.channelId}" data-program-index="${active.programIndex}" aria-label="Abrir informacoes do programa">
              i
            </button>
          </div>
        </div>

        <button class="home-hero-arrow is-left" data-focusable="false" data-group="content" data-action="home-slide-prev" aria-label="Slide anterior">&#10094;</button>
        <button class="home-hero-arrow is-right" data-focusable="false" data-group="content" data-action="home-slide-next" aria-label="Proximo slide">&#10095;</button>

        <div class="home-hero-dots" aria-label="Navegacao de slides">
          ${featured
            .map(
              (_, index) => `
                <button class="home-hero-dot ${index === appState.homeFeaturedIndex ? "is-active" : ""}" data-focusable="false" data-group="content" data-action="home-slide-dot" data-slide-index="${index}" aria-label="Ir para slide ${index + 1}"></button>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="home-rails">
        ${renderHomeRailSection({ id: "home-continue", title: "Continue assistindo", items: rails.continueWatching })}
        ${renderHomeRailSection({ id: "home-my-list", title: "Minha Lista", items: rails.minhaLista })}
        ${renderHomeRailSection({ id: "home-recommended", title: "Recomendados", items: rails.recomendados })}
        ${renderHomeRailSection({ id: "home-top10", title: "Top 10 filmes de hoje", items: rails.top10, isTop10: true })}
        ${rails.genreRows.map((row) => renderHomeRailSection(row)).join("")}
      </section>
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

function syncActiveChannelBackground(channelId = appState.selectedChannelId) {
  const channel = getChannelById(channelId);
  if (!channel) {
    ui.dashboard?.style.removeProperty("--active-channel-bg");
    return;
  }

  const nextBackground = channel.backgroundImage;

  if (nextBackground) {
    ui.dashboard?.style.setProperty("--active-channel-bg", `url('${nextBackground}')`);
  }
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
          const activeClass = channel.id === appState.selectedChannelId ? "is-active" : "";

          return `
            <section
              class="channel-hero-section ${activeClass}"
              id="${channelId}"
              data-channel-section="${channel.id}"
              style="--channel-bg: url('${channel.backgroundImage}')"
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

function renderProgramDetailsView() {
  const channel = getChannelById(appState.detailChannelId);
  if (!channel) {
    return renderStateBox({
      title: "Programa nao encontrado",
      description: "Nao foi possivel abrir os detalhes deste programa."
    });
  }

  const schedule = getChannelProgramming(channel);
  const selectedProgramIndex = getSelectedProgramIndex(channel.id, schedule);
  const selectedProgram = schedule[selectedProgramIndex] || schedule[0];
  const isLive = selectedProgram.status === "live";
  const isSavedInWatchlist = isProgramInWatchlist(channel.id, selectedProgramIndex);

  ui.dashboard?.style.setProperty("--details-bg", `url('${selectedProgram.image || channel.backgroundImage}')`);

  return `
    <section class="program-details-view">
      <section class="program-details-hero-shell" data-program-hero data-channel-id="${channel.id}">
        <div class="program-details-hero-gap" aria-hidden="true"></div>
        <section class="program-details-overlay">
          <span class="program-status ${isLive ? "is-live" : "is-soon"}">${selectedProgram.statusLabel}</span>
          <h2>${selectedProgram.title}</h2>
          <span class="program-format-chip">HD</span>
          <p>${selectedProgram.timeInfo}</p>
          <div class="program-action-row">
            ${isLive ? `<button class="program-watch-btn" data-focusable="true" data-group="content" data-action="watch-program" data-channel-id="${channel.id}" data-program-index="${selectedProgramIndex}">Assistir</button>` : ""}
            <button class="program-star-btn ${isLive ? "" : "is-soon-cta"} ${isSavedInWatchlist ? "is-saved" : ""}" data-focusable="true" data-group="content" data-action="toggle-watchlist" data-channel-id="${channel.id}" data-program-index="${selectedProgramIndex}" aria-label="${isSavedInWatchlist ? "Remover da Minha lista" : isLive ? "Adicionar programa à lista" : "Adicionar à Minha lista"}">
              ${isLive ? `<span aria-hidden="true">${isSavedInWatchlist ? "★" : "☆"}</span>` : `<span class="program-star-btn-label">Minha lista</span><span class="program-star-btn-icon" aria-hidden="true">${isSavedInWatchlist ? "★" : "☆"}</span>`}
            </button>
          </div>
        </section>
      </section>

      <section class="program-details-body">
        <section class="program-details-panel" aria-label="Detalhes do programa">
          <h3 class="details-section-title">Detalhes</h3>
          <div class="program-detail-card">
            <div class="program-detail-summary">
              <h4>${selectedProgram.title}</h4>
              <p>${isLive ? `Transmissao ao vivo no canal ${channel.title}.` : `Programa em exibição futura no canal ${channel.title}.`}</p>
            </div>

            <dl class="program-detail-meta">
              <div>
                <dt>Canal</dt>
                <dd>${channel.title}</dd>
              </div>
              <div>
                <dt>Categoria</dt>
                <dd>${channel.genre}</dd>
              </div>
              <div>
                <dt>Formato</dt>
                <dd>HD</dd>
              </div>
              <div>
                <dt>Disponibilidade</dt>
                <dd>${isLive ? "Assistir agora" : "Em breve"}</dd>
              </div>
            </dl>
          </div>
        </section>
      </section>
    </section>
  `;
}

function getProgramKey(channelId, programIndex) {
  return `${channelId}::${programIndex}`;
}

function isProgramInWatchlist(channelId, programIndex) {
  return appState.watchlistProgramKeys.includes(getProgramKey(channelId, programIndex));
}

function toggleProgramInWatchlist(channelId, programIndex) {
  const key = getProgramKey(channelId, programIndex);
  const exists = appState.watchlistProgramKeys.includes(key);

  if (exists) {
    appState.watchlistProgramKeys = appState.watchlistProgramKeys.filter((item) => item !== key);
    return false;
  }

  appState.watchlistProgramKeys = [...appState.watchlistProgramKeys, key];
  return true;
}

function createInitialMockWatchlist(channels) {
  return channels
    .slice(0, 6)
    .flatMap((channel) => {
      const schedule = getChannelProgramming(channel);
      return schedule.slice(0, 3).map((_, index) => getProgramKey(channel.id, index));
    });
}

function getWatchlistPrograms() {
  return appState.watchlistProgramKeys
    .map((key) => {
      const [channelId, rawIndex] = key.split("::");
      const channel = getChannelById(channelId);
      if (!channel) {
        return null;
      }

      const schedule = getChannelProgramming(channel);
      const programIndex = Number(rawIndex);
      const program = schedule[programIndex];
      if (!program) {
        return null;
      }

      return {
        channel,
        channelId,
        programIndex,
        program
      };
    })
    .filter((item) => Boolean(item));
}

function renderMyListSection() {
  const watchlist = getWatchlistPrograms();

  if (!watchlist.length) {
    return renderStateBox({
      title: "Minha lista vazia",
      description: "Use a estrela nos detalhes do programa para salvar itens aqui."
    });
  }

  return `
    <section class="my-list-main" aria-label="Programas salvos em Minha lista">
      <div class="my-list-grid" role="list">
        ${watchlist
          .map(
            (item) => `
              <article
                class="my-list-card"
                role="listitem"
                data-focusable="true"
                data-group="content"
                data-action="select-program"
                data-channel-id="${item.channelId}"
                data-program-index="${item.programIndex}"
                data-return-mode="minha-lista"
              >
                <div class="program-visual">
                  <img src="${item.program.image}" alt="Capa da programacao ${item.program.title}" loading="lazy" />
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderProgramPlayerView() {
  const channel = getChannelById(appState.detailChannelId);
  if (!channel) {
    return renderStateBox({
      title: "Player indisponivel",
      description: "Nao foi possivel abrir o player deste programa."
    });
  }

  const schedule = getChannelProgramming(channel);
  const selectedProgramIndex = getSelectedProgramIndex(channel.id, schedule);
  const selectedProgram = schedule[selectedProgramIndex] || schedule[0];
  const streamUrl = selectedProgram.streamUrl || "https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/highest.mp4";
  const posterUrl = selectedProgram.poster || selectedProgram.image || channel.backgroundImage;

  ui.dashboard?.style.setProperty("--details-bg", `url('${posterUrl}')`);

  return `
    <section class="program-player-view" data-program-player data-channel-id="${channel.id}">
      <section class="program-player-shell">
        <video-player class="program-player-stage">
          <media-container class="media-default-skin media-default-skin--video program-player-media">
            <video src="${streamUrl}" playsinline autoplay muted poster="${posterUrl}"></video>

            <media-poster>
              <img src="${posterUrl}" alt="${selectedProgram.title}" />
            </media-poster>

            <media-controls class="media-surface media-controls">
              <media-tooltip-group>
                <div class="media-button-group">
                  <media-play-button class="media-button media-button--subtle media-button--icon media-button--play">
                    <svg class="media-icon media-icon--play" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18"><path fill="currentColor" d="m14.051 10.723-7.985 4.964a1.98 1.98 0 0 1-2.758-.638A2.06 2.06 0 0 1 3 13.964V4.036C3 2.91 3.895 2 5 2c.377 0 .747.109 1.066.313l7.985 4.964a2.057 2.057 0 0 1 .627 2.808c-.16.257-.373.475-.627.637"/></svg>
                    <svg class="media-icon media-icon--pause" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18"><rect width="5" height="14" x="2" y="2" fill="currentColor" rx="1.75"/><rect width="5" height="14" x="11" y="2" fill="currentColor" rx="1.75"/></svg>
                  </media-play-button>

                  <media-seek-button seconds="-10" class="media-button media-button--subtle media-button--icon media-button--seek">
                    <span class="media-icon__container">
                      <svg class="media-icon media-icon--seek media-icon--flipped" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18"><path fill="currentColor" d="M1 9c0 2.21.895 4.21 2.343 5.657l1.414-1.414a6 6 0 1 1 8.956-7.956l-1.286 1.286a.25.25 0 0 0 .177.427h4.146a.25.25 0 0 0 .25-.25V2.604a.25.25 0 0 0-.427-.177l-1.438 1.438A8 8 0 0 0 1 9"/></svg>
                      <span class="media-icon__label">10</span>
                    </span>
                  </media-seek-button>

                  <media-seek-button seconds="10" class="media-button media-button--subtle media-button--icon media-button--seek">
                    <span class="media-icon__container">
                      <svg class="media-icon media-icon--seek" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18"><path fill="currentColor" d="M1 9c0 2.21.895 4.21 2.343 5.657l1.414-1.414a6 6 0 1 1 8.956-7.956l-1.286 1.286a.25.25 0 0 0 .177.427h4.146a.25.25 0 0 0 .25-.25V2.604a.25.25 0 0 0-.427-.177l-1.438 1.438A8 8 0 0 0 1 9"/></svg>
                      <span class="media-icon__label">10</span>
                    </span>
                  </media-seek-button>
                </div>

                <div class="media-time-controls">
                  <media-time type="current" class="media-time"></media-time>
                  <media-time-slider class="media-slider">
                    <media-slider-track class="media-slider__track">
                      <media-slider-fill class="media-slider__fill"></media-slider-fill>
                      <media-slider-buffer class="media-slider__buffer"></media-slider-buffer>
                    </media-slider-track>
                    <media-slider-thumb class="media-slider__thumb"></media-slider-thumb>
                  </media-time-slider>
                  <media-time type="duration" class="media-time"></media-time>
                </div>

                <div class="media-button-group">
                  <media-mute-button class="media-button media-button--subtle media-button--icon media-button--mute">
                    <svg class="media-icon media-icon--volume-off" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18"><path fill="currentColor" d="M.714 6.008h3.072l4.071-3.857c.5-.376 1.143 0 1.143.601V15.28c0 .602-.643.903-1.143.602l-4.071-3.858H.714c-.428 0-.714-.3-.714-.752V6.76c0-.451.286-.752.714-.752M14.5 7.586l-1.768-1.768a1 1 0 1 0-1.414 1.414L13.085 9l-1.767 1.768a1 1 0 0 0 1.414 1.414l1.768-1.768 1.768 1.768a1 1 0 0 0 1.414-1.414L15.914 9l1.768-1.768a1 1 0 0 0-1.414-1.414z"/></svg>
                    <svg class="media-icon media-icon--volume-high" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18"><path fill="currentColor" d="M15.6 3.3c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4C15.4 5.9 16 7.4 16 9s-.6 3.1-1.8 4.3c-.4.4-.4 1 0 1.4.2.2.5.3.7.3.3 0 .5-.1.7-.3C17.1 13.2 18 11.2 18 9s-.9-4.2-2.4-5.7"/><path fill="currentColor" d="M.714 6.008h3.072l4.071-3.857c.5-.376 1.143 0 1.143.601V15.28c0 .602-.643.903-1.143.602l-4.071-3.858H.714c-.428 0-.714-.3-.714-.752V6.76c0-.451.286-.752.714-.752"/></svg>
                  </media-mute-button>

                  <media-fullscreen-button class="media-button media-button--subtle media-button--icon media-button--fullscreen">
                    <svg class="media-icon media-icon--fullscreen-enter" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18"><path fill="currentColor" d="M9.57 3.617A1 1 0 0 0 8.646 3H4c-.552 0-1 .449-1 1v4.646a.996.996 0 0 0 1.001 1 1 1 0 0 0 .706-.293l4.647-4.647a1 1 0 0 0 .216-1.089m4.812 4.812a1 1 0 0 0-1.089.217l-4.647 4.647a.998.998 0 0 0 .708 1.706H14c.552 0 1-.449 1-1V9.353a1 1 0 0 0-.618-.924"/></svg>
                    <svg class="media-icon media-icon--fullscreen-exit" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18"><path fill="currentColor" d="M7.883 1.93a.99.99 0 0 0-1.09.217L2.146 6.793A.998.998 0 0 0 2.853 8.5H7.5c.551 0 1-.449 1-1V2.854a1 1 0 0 0-.617-.924m7.263 7.57H10.5c-.551 0-1 .449-1 1v4.646a.996.996 0 0 0 1.001 1.001 1 1 0 0 0 .706-.293l4.646-4.646a.998.998 0 0 0-.707-1.707z"/></svg>
                  </media-fullscreen-button>
                </div>
              </media-tooltip-group>
            </media-controls>

            <media-hotkey keys="Space" action="togglePaused"></media-hotkey>
            <media-hotkey keys="k" action="togglePaused"></media-hotkey>
            <media-hotkey keys="f" action="toggleFullscreen"></media-hotkey>
            <media-hotkey keys="l" action="seekStep" value="10"></media-hotkey>
            <media-hotkey keys="j" action="seekStep" value="-10"></media-hotkey>
            <media-hotkey keys="ArrowRight" action="seekStep" value="10"></media-hotkey>
            <media-hotkey keys="ArrowLeft" action="seekStep" value="-10"></media-hotkey>

            <media-gesture type="doubletap" action="seekStep" value="-10" region="left"></media-gesture>
            <media-gesture type="doubletap" action="toggleFullscreen" region="center"></media-gesture>
            <media-gesture type="doubletap" action="seekStep" value="10" region="right"></media-gesture>
          </media-container>
        </video-player>

        <div class="program-player-gradient" aria-hidden="true"></div>
      </section>
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
  const isDetailsMode = appState.activeSection === "canais" && (appState.channelViewMode === "channel-details" || appState.channelViewMode === "program-details") && Boolean(detailsChannel);
  const isPlayerMode = appState.activeSection === "canais" && appState.channelViewMode === "program-player" && Boolean(detailsChannel);
  const isHomeMode = appState.activeSection === "inicio" && !isDetailsMode && !isPlayerMode;
  const schedule = detailsChannel ? getChannelProgramming(detailsChannel) : [];
  const selectedProgramIndex = detailsChannel ? getSelectedProgramIndex(detailsChannel.id, schedule) : 0;
  const selectedProgram = detailsChannel && schedule.length ? schedule[selectedProgramIndex] || schedule[0] : null;

  ui.sectionTitle.textContent = isHomeMode ? "" : isPlayerMode && selectedProgram ? selectedProgram.title : isDetailsMode ? detailsChannel.title : meta.title;
  document.body.classList.toggle("is-home-mode", isHomeMode);
  document.body.classList.toggle("is-details-mode", isDetailsMode);
  document.body.classList.toggle("is-player-mode", isPlayerMode);
  ui.topbar?.classList.toggle("is-details-topbar", isDetailsMode);
  ui.topbar?.classList.toggle("is-player-topbar", isPlayerMode);
  ui.dashboard?.classList.toggle("is-details-dashboard", isDetailsMode);
  ui.dashboard?.classList.toggle("is-player-dashboard", isPlayerMode);

  if (ui.detailsBackTop) {
    ui.detailsBackTop.classList.toggle("is-visible", isDetailsMode || isPlayerMode);
    ui.detailsBackTop.dataset.focusable = isDetailsMode || isPlayerMode ? "true" : "false";
  }

  if (isDetailsMode || isPlayerMode) {
    ui.dashboard?.style.setProperty("--details-bg", `url('${selectedProgram?.image || detailsChannel.backgroundImage}')`);
  } else {
    ui.dashboard?.style.removeProperty("--details-bg");
  }

  if (appState.activeSection === "inicio") {
    ui.dashboardContent.innerHTML = renderHomeSection();
    setupAllCarousels();
    syncHomeHeroAutoplay();
    return;
  }

  stopHomeHeroAutoplay();

  if (appState.activeSection === "canais") {
    syncActiveChannelBackground();

    if (appState.channelViewMode === "channel-details") {
      ui.dashboardContent.innerHTML = renderChannelDetailsView();
      setupAllCarousels();
    } else if (appState.channelViewMode === "program-details") {
      ui.dashboardContent.innerHTML = renderProgramDetailsView();
    } else if (appState.channelViewMode === "program-player") {
      ui.dashboardContent.innerHTML = renderProgramPlayerView();
    } else {
      ui.dashboardContent.innerHTML = renderChannelsSection();
      setupAllCarousels();
    }
    return;
  }

  if (appState.activeSection === "minha-lista") {
    ui.dashboardContent.innerHTML = renderMyListSection();
    return;
  }

  ui.dashboardContent.innerHTML = renderPlaceholderSection(appState.activeSection);
}

function stepHomeFeaturedSlide(direction) {
  const featured = getHomeFeaturedPrograms();
  if (!featured.length) {
    return;
  }

  const total = featured.length;
  appState.homeFeaturedIndex = (appState.homeFeaturedIndex + total + direction) % total;
  renderDashboardContent();
}

function setHomeFeaturedSlide(index) {
  const featured = getHomeFeaturedPrograms();
  if (!featured.length) {
    return;
  }

  appState.homeFeaturedIndex = Math.max(0, Math.min(index, featured.length - 1));
  renderDashboardContent();
}

function stopHomeHeroAutoplay() {
  if (homeHeroAutoRotateTimer) {
    window.clearInterval(homeHeroAutoRotateTimer);
    homeHeroAutoRotateTimer = null;
  }
}

function syncHomeHeroAutoplay() {
  stopHomeHeroAutoplay();

  if (appState.activeSection !== "inicio" || appState.status !== "ready") {
    return;
  }

  const featured = getHomeFeaturedPrograms();
  if (featured.length < 2) {
    return;
  }

  homeHeroAutoRotateTimer = window.setInterval(() => {
    stepHomeFeaturedSlide(1);
  }, 6500);
}

function setMenuActive(section) {
  document.querySelectorAll(".menu-item").forEach((button) => {
    const isCurrent = button.dataset.section === section;
    button.classList.toggle("is-active", isCurrent);
    if (!isCurrent) {
      button.classList.remove("is-focused");
    }
  });
}

function getRouteStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    view: params.get(routeKeys.view),
    channelId: params.get(routeKeys.channel),
    programIndex: params.get(routeKeys.program)
  };
}

function syncUrlWithState({ replace = false } = {}) {
  const nextUrl = new URL(window.location.href);

  if (appState.activeSection === "canais" && appState.channelViewMode === "channel-details" && appState.detailChannelId) {
    nextUrl.searchParams.set(routeKeys.view, "details");
    nextUrl.searchParams.set(routeKeys.channel, appState.detailChannelId);
    nextUrl.searchParams.delete(routeKeys.program);
  } else if (appState.activeSection === "canais" && appState.channelViewMode === "program-details" && appState.detailChannelId) {
    nextUrl.searchParams.set(routeKeys.view, "program-details");
    nextUrl.searchParams.set(routeKeys.channel, appState.detailChannelId);
    const routeChannel = getChannelById(appState.detailChannelId);
    const routeSchedule = routeChannel ? getChannelProgramming(routeChannel) : [];
    nextUrl.searchParams.set(routeKeys.program, String(getSelectedProgramIndex(appState.detailChannelId, routeSchedule)));
  } else if (appState.activeSection === "canais" && appState.channelViewMode === "program-player" && appState.detailChannelId) {
    nextUrl.searchParams.set(routeKeys.view, "player");
    nextUrl.searchParams.set(routeKeys.channel, appState.detailChannelId);
    const routeChannel = getChannelById(appState.detailChannelId);
    const routeSchedule = routeChannel ? getChannelProgramming(routeChannel) : [];
    nextUrl.searchParams.set(routeKeys.program, String(getSelectedProgramIndex(appState.detailChannelId, routeSchedule)));
  } else {
    nextUrl.searchParams.delete(routeKeys.view);
    nextUrl.searchParams.delete(routeKeys.channel);
    nextUrl.searchParams.delete(routeKeys.program);
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
  if (routeState.view === "player" && routeState.channelId) {
    const channel = getChannelById(routeState.channelId);
    if (channel) {
      const schedule = getChannelProgramming(channel);
      const programIndex = Number(routeState.programIndex);
      appState.activeSection = "canais";
      appState.channelViewMode = "program-player";
      appState.detailChannelId = channel.id;
      appState.programPlayerReturnMode = "program-details";
      appState.selectedChannelId = channel.id;
      appState.selectedProgramByChannel[channel.id] = Number.isInteger(programIndex) ? Math.max(0, Math.min(programIndex, schedule.length - 1)) : 0;
      setMenuActive("canais");
      return true;
    }
  }

  if (routeState.view === "program-details" && routeState.channelId) {
    const channel = getChannelById(routeState.channelId);
    if (channel) {
      const schedule = getChannelProgramming(channel);
      const programIndex = Number(routeState.programIndex);
      appState.activeSection = "canais";
      appState.channelViewMode = "program-details";
      appState.detailChannelId = channel.id;
      appState.programDetailReturnMode = "browse";
      appState.programPlayerReturnMode = "browse";
      appState.selectedChannelId = channel.id;
      appState.selectedProgramByChannel[channel.id] = Number.isInteger(programIndex) ? Math.max(0, Math.min(programIndex, schedule.length - 1)) : 0;
      setMenuActive("canais");
      return true;
    }
  }

  if (routeState.view === "details" && routeState.channelId) {
    const channel = getChannelById(routeState.channelId);
    if (channel) {
      appState.activeSection = "canais";
      appState.channelViewMode = "channel-details";
      appState.detailChannelId = channel.id;
      appState.programDetailReturnMode = "browse";
      appState.programPlayerReturnMode = "browse";
      appState.selectedChannelId = channel.id;
      setMenuActive("canais");
      return true;
    }
  }

  appState.channelViewMode = "browse";
  appState.detailChannelId = null;
  appState.programDetailReturnMode = "browse";
  appState.programPlayerReturnMode = "browse";
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
  const menuItems = findFocusableByGroup("menu");
  const activeIndex = menuItems.findIndex((item) => item.dataset.section === section);
  appState.focusIndex = activeIndex >= 0 ? activeIndex : 0;
  focusGroup("menu", 0);
}

function selectProgramCard(channelId, programIndex, programImage) {
  const channel = getChannelById(channelId);
  if (!channel) {
    return;
  }

  appState.selectedProgramByChannel[channelId] = programIndex;

  openProgramDetails(channelId, programIndex);
}

function openProgramDetails(channelId, programIndex, returnMode = "browse") {
  const channel = getChannelById(channelId);
  if (!channel) {
    return;
  }

  appState.activeSection = "canais";
  appState.programDetailReturnMode = returnMode === "minha-lista" ? "minha-lista" : appState.channelViewMode === "channel-details" ? "channel-details" : "browse";
  appState.programPlayerReturnMode = "browse";
  appState.channelViewMode = "program-details";
  appState.detailChannelId = channelId;
  appState.selectedChannelId = channelId;
  appState.selectedProgramByChannel[channelId] = programIndex;
  setMenuActive("canais");
  renderDashboardContent();
  syncUrlWithState();
  window.scrollTo({ top: 0, behavior: "auto" });
  document.querySelectorAll(".is-focused").forEach((node) => node.classList.remove("is-focused"));
  ui.detailsBackTop?.focus();
  appState.focusGroup = "content";
  appState.focusIndex = -1;
}

function openProgramPlayer(channelId, programIndex) {
  const channel = getChannelById(channelId);
  if (!channel) {
    return;
  }

  appState.programPlayerReturnMode = "program-details";
  appState.channelViewMode = "program-player";
  appState.detailChannelId = channelId;
  appState.selectedChannelId = channelId;
  appState.selectedProgramByChannel[channelId] = programIndex;
  setMenuActive("canais");
  renderDashboardContent();
  syncUrlWithState();
  window.scrollTo({ top: 0, behavior: "auto" });
  document.querySelectorAll(".is-focused").forEach((node) => node.classList.remove("is-focused"));
  ui.detailsBackTop?.focus();
  appState.focusGroup = "content";
  appState.focusIndex = -1;
}

function openChannelDetails(channelId) {
  const channel = getChannelById(channelId);
  if (!channel) {
    return;
  }

  appState.channelViewMode = "channel-details";
  appState.detailChannelId = channelId;
  appState.programDetailReturnMode = "browse";
  setMenuActive("canais");
  renderDashboardContent();
  syncUrlWithState();
  window.scrollTo({ top: 0, behavior: "auto" });
  document.querySelectorAll(".is-focused").forEach((node) => node.classList.remove("is-focused"));
  ui.detailsBackTop?.focus();
  appState.focusGroup = "content";
  appState.focusIndex = -1;
}

function closeDetailsView() {
  if (appState.channelViewMode === "program-player") {
    appState.channelViewMode = appState.programPlayerReturnMode === "program-details" ? "program-details" : "browse";
    if (appState.channelViewMode !== "program-details") {
      appState.detailChannelId = null;
      appState.programDetailReturnMode = "browse";
    }
    renderDashboardContent();
    syncUrlWithState({ replace: true });
    return;
  }

  if (appState.channelViewMode === "program-details" && appState.programDetailReturnMode === "channel-details") {
    appState.channelViewMode = "channel-details";
  } else if (appState.channelViewMode === "program-details" && appState.programDetailReturnMode === "minha-lista") {
    appState.activeSection = "minha-lista";
    appState.channelViewMode = "browse";
  } else {
    appState.channelViewMode = "browse";
    appState.detailChannelId = null;
    appState.programDetailReturnMode = "browse";
  }

  renderDashboardContent();
  syncUrlWithState({ replace: true });
}

function closeChannelDetails() {
  closeDetailsView();
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

  syncActiveChannelBackground(channelId);

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
    appState.watchlistProgramKeys = createInitialMockWatchlist(channels);
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
    openProgramDetails(target.dataset.channelId, Number(target.dataset.programIndex), target.dataset.returnMode || "browse");
    return;
  }

  if (action === "channel-details") {
    openChannelDetails(target.dataset.channelId);
    return;
  }

  if (action === "watch-program") {
    openProgramPlayer(target.dataset.channelId, Number(target.dataset.programIndex));
    return;
  }

  if (action === "home-slide-prev") {
    stepHomeFeaturedSlide(-1);
    return;
  }

  if (action === "home-slide-next") {
    stepHomeFeaturedSlide(1);
    return;
  }

  if (action === "home-slide-dot") {
    setHomeFeaturedSlide(Number(target.dataset.slideIndex));
    return;
  }

  if (action === "toggle-watchlist") {
    const added = toggleProgramInWatchlist(target.dataset.channelId, Number(target.dataset.programIndex));
    showToast(added ? "Programa adicionado à Minha lista." : "Programa removido da Minha lista.");
    renderDashboardContent();
    return;
  }

  if (action === "details-back") {
    closeDetailsView();
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
