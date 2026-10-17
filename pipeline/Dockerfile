# Chaîne de traitement complète, Java 21 compris pour le moteur R5 (r5py).
FROM eclipse-temurin:24-jre-noble

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /venv
ENV PATH=/venv/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    ATLAS_RACINE=/projet

WORKDIR /pipeline
COPY pyproject.toml ./
COPY atlas ./atlas
RUN pip install --no-cache-dir ".[accessibilite]"

# Un utilisateur dédié, sans droits root ; le cache de r5py vit dans son dossier.
RUN useradd --create-home --uid 1001 atlas \
    && mkdir -p /home/atlas/.cache/r5py \
    && chown -R atlas:atlas /home/atlas
USER atlas

ENTRYPOINT ["python", "-m", "atlas"]
CMD ["tout"]
