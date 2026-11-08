import os
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
API_KEY = os.getenv("SEMANTIC_SCHOLAR_API_KEY", "").strip()
BASE = "https://api.semanticscholar.org/graph/v1"
OPENALEX_BASE = "https://api.openalex.org"
app = FastAPI(title="MechResearch Global API", version="1.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[x.strip() for x in os.getenv("CORS_ORIGINS", "*").split(",") if x.strip()],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "MechResearch Global API", "version": app.version}


async def scholar_get(path: str, params: dict):
    headers = {"x-api-key": API_KEY} if API_KEY else {}
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.get(f"{BASE}/{path}", params=params, headers=headers)
        if response.status_code == 429:
            raise HTTPException(status_code=429, detail="Semantic Scholar rate limit reached. Please try again shortly.")
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="No matching research profile was found.")
        if response.status_code >= 400:
            raise HTTPException(status_code=response.status_code, detail="Semantic Scholar request failed.")
        return response.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Research database request timed out.")
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Could not connect to Semantic Scholar.")


@app.get("/api/papers")
async def search_papers(
    query: str = Query(..., min_length=2, max_length=200),
    year: Optional[str] = Query(None, max_length=20),
    open_access_only: bool = False,
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0, le=500),
):
    fields = ",".join([
        "title", "abstract", "year", "authors", "venue", "publicationDate",
        "externalIds", "citationCount", "openAccessPdf", "url", "fieldsOfStudy"
    ])
    params = {"query": query, "limit": limit, "offset": offset, "fields": fields}
    if year:
        params["year"] = year
    data = await scholar_get("paper/search", params)
    papers = data.get("data", [])
    if open_access_only:
        papers = [p for p in papers if (p.get("openAccessPdf") or {}).get("url")]
    return {"total": data.get("total", 0), "offset": offset, "papers": papers}


@app.get("/api/authors")
async def search_authors(
    query: str = Query(..., min_length=2, max_length=200),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0, le=200),
):
    fields = "name,affiliations,paperCount,citationCount,hIndex,url"
    data = await scholar_get("author/search", {"query": query, "limit": limit, "offset": offset, "fields": fields})
    return {"total": data.get("total", 0), "offset": offset, "authors": data.get("data", [])}


@app.get("/api/authors/{author_id}")
async def author_profile(author_id: str):
    fields = "name,affiliations,paperCount,citationCount,hIndex,url,papers.title,papers.year,papers.venue,papers.fieldsOfStudy,papers.citationCount"
    data = await scholar_get(f"author/{author_id}", {"fields": fields})
    return {"author": data}


@app.get("/api/universities")
async def search_universities(
    query: str = Query(..., min_length=2, max_length=200),
    limit: int = Query(25, ge=1, le=50),
):
    """Search the OpenAlex institution index; records are not admissions endorsements."""
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f"{OPENALEX_BASE}/institutions",
                params={
                    "search": query,
                    "per-page": limit,
                    "select": "id,display_name,country_code,type,homepage,works_count,cited_by_count",
                },
                headers={"User-Agent": "MechResearchGlobal/1.2 (research discovery app)"},
            )
        if response.status_code == 429:
            raise HTTPException(status_code=429, detail="University database rate limit reached. Please try again shortly.")
        if response.status_code >= 400:
            raise HTTPException(status_code=502, detail="University database request failed.")
        payload = response.json()
        return {"total": payload.get("meta", {}).get("count", 0), "universities": payload.get("results", [])}
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="University search timed out.")
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Could not connect to the university database.")
