# Smartx TV V1 - API Contracts (Draft)

Este documento define os contratos de dados para o V1 da interface de TV.

## 1) Catalogo de canais

### GET /api/v1/catalog/channels

Resposta 200:

```json
{
  "items": [
    {
      "id": "hbo-go",
      "title": "HBO Go",
      "genre": "Series",
      "quality": "HD 1080p",
      "runtime": "52 min",
      "rating": "16+",
      "synopsis": "Colecao premium com episodios recentes e destaques editoriais para maratona.",
      "image": "https://cdn.exemplo.com/covers/hbo-go.jpg"
    }
  ]
}
```

## 2) Detalhe de canal

### GET /api/v1/catalog/channels/{id}

Resposta 200:

```json
{
  "id": "hbo-go",
  "title": "HBO Go",
  "genre": "Series",
  "quality": "HD 1080p",
  "runtime": "52 min",
  "rating": "16+",
  "synopsis": "Colecao premium com episodios recentes e destaques editoriais para maratona.",
  "image": "https://cdn.exemplo.com/covers/hbo-go.jpg",
  "seasons": [
    { "label": "1a temporada", "episodes": 10 },
    { "label": "2a temporada", "episodes": 12 }
  ]
}
```

## 3) Metricas operacionais

### GET /api/v1/metrics/operations

Resposta 200:

```json
{
  "avgOpenTime": "2.8s",
  "completedSessions": "1,284",
  "navigationErrors": "1.7%"
}
```

## 4) Preferencias de perfil (roadmap)

### GET /api/v1/profile/preferences

Resposta 200:

```json
{
  "theme": "light",
  "audioLevel": 62,
  "captionEnabled": false,
  "favoriteGenres": ["Series", "Documentarios"]
}
```

## 5) Erros padrao

```json
{
  "error": {
    "code": "CATALOG_UNAVAILABLE",
    "message": "Servico indisponivel temporariamente"
  }
}
```
