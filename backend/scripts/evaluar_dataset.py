import sys
import csv
from pathlib import Path

sys.path.append(
    str(Path(__file__).resolve().parent.parent)
)

from app.services.face_service import face_service
from app.services.recognition_service import recognition_service


# ============================================================
# CONFIGURACIÓN
# ============================================================

UMBRAL_SIMILITUD = 0.50

BASE_DIR = (
    Path(__file__)
    .resolve()
    .parent
    .parent
)

LFW_DIR = (
    BASE_DIR
    / "datasets"
    / "lfw"
    / "raw"
    / "lfw"
)

PAIRS_FILE = (
    BASE_DIR
    / "datasets"
    / "lfw"
    / "raw"
    / "pairsDevTrain.txt"
)

OUTPUT_FILE = (
    BASE_DIR
    / "datasets"
    / "lfw"
    / "resultados_evaluacion_completa.csv"
)


# ============================================================
# BUSCAR IMAGEN
# ============================================================

def buscar_imagen(nombre_persona, numero):

    nombre_archivo = (
        f"{nombre_persona}_{numero:04d}.jpg"
    )

    ruta = (
        LFW_DIR
        / nombre_persona
        / nombre_archivo
    )

    if not ruta.exists():
        raise FileNotFoundError(
            f"No se encontró la imagen:\n{ruta}"
        )

    return ruta


# ============================================================
# CARGAR PARES OFICIALES
# ============================================================

def cargar_pares_oficiales():

    if not PAIRS_FILE.exists():
        raise FileNotFoundError(
            f"No se encontró:\n{PAIRS_FILE}"
        )

    with open(
        PAIRS_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        lineas = [
            linea.strip()
            for linea in file
            if linea.strip()
        ]

    numero_mismos = int(lineas[0])

    print(
        f"Pares de la misma persona: "
        f"{numero_mismos}"
    )

    pares = []

    indice = 1

    # ========================================================
    # PARES POSITIVOS
    # ========================================================

    for _ in range(numero_mismos):

        partes = lineas[indice].split()

        indice += 1

        if len(partes) != 3:
            raise ValueError(
                "Formato incorrecto en par positivo:\n"
                f"{lineas[indice - 1]}"
            )

        nombre_persona = partes[0]

        numero_a = int(partes[1])
        numero_b = int(partes[2])

        ruta_a = buscar_imagen(
            nombre_persona,
            numero_a
        )

        ruta_b = buscar_imagen(
            nombre_persona,
            numero_b
        )

        pares.append({
            "ruta_a": ruta_a,
            "ruta_b": ruta_b,
            "label": 1
        })

    # ========================================================
    # PARES NEGATIVOS
    # ========================================================

    numero_diferentes = len(lineas) - indice

    print(
        f"Pares de personas diferentes: "
        f"{numero_diferentes}"
    )

    for _ in range(numero_diferentes):

        partes = lineas[indice].split()

        indice += 1

        if len(partes) != 4:
            raise ValueError(
                "Formato incorrecto en par negativo:\n"
                f"{lineas[indice - 1]}"
            )

        nombre_a = partes[0]
        numero_a = int(partes[1])

        nombre_b = partes[2]
        numero_b = int(partes[3])

        ruta_a = buscar_imagen(
            nombre_a,
            numero_a
        )

        ruta_b = buscar_imagen(
            nombre_b,
            numero_b
        )

        pares.append({
            "ruta_a": ruta_a,
            "ruta_b": ruta_b,
            "label": 0
        })

    return pares


# ============================================================
# GENERAR EMBEDDING
# ============================================================

def generar_embedding(ruta_imagen):

    image_bytes = ruta_imagen.read_bytes()

    resultado = (
        face_service.generate_embedding(
            image_bytes
        )
    )

    return resultado["embedding"]


# ============================================================
# GENERAR EMBEDDINGS ÚNICOS
# ============================================================

def generar_embeddings_unicos(pares):

    imagenes_unicas = set()

    for par in pares:

        imagenes_unicas.add(
            par["ruta_a"]
        )

        imagenes_unicas.add(
            par["ruta_b"]
        )

    imagenes_unicas = sorted(
        imagenes_unicas,
        key=str
    )

    print("\n" + "=" * 60)

    print(
        "GENERANDO EMBEDDINGS"
    )

    print("=" * 60)

    print(
        f"Imágenes únicas: "
        f"{len(imagenes_unicas)}"
    )

    embeddings = {}

    errores = []

    total = len(imagenes_unicas)

    for indice, ruta in enumerate(
        imagenes_unicas,
        start=1
    ):

        print(
            f"[{indice}/{total}] "
            f"{ruta.name}"
        )

        try:

            embedding = generar_embedding(
                ruta
            )

            embeddings[ruta] = embedding

        except Exception as error:

            print(
                f"   ERROR: {error}"
            )

            errores.append({
                "ruta": ruta,
                "error": str(error)
            })

    print("\n" + "-" * 60)

    print(
        f"Embeddings generados: "
        f"{len(embeddings)}"
    )

    print(
        f"Imágenes con error: "
        f"{len(errores)}"
    )

    return embeddings, errores


# ============================================================
# EVALUAR PARES
# ============================================================

def evaluar_pares(
    pares,
    embeddings
):

    resultados = []

    pares_sin_embedding = 0

    total = len(pares)

    print("\n" + "=" * 60)

    print(
        "EVALUANDO PARES"
    )

    print("=" * 60)

    for indice, par in enumerate(
        pares,
        start=1
    ):

        ruta_a = par["ruta_a"]
        ruta_b = par["ruta_b"]

        label_real = par["label"]

        # ----------------------------------------------------
        # Verificar embeddings
        # ----------------------------------------------------

        if (
            ruta_a not in embeddings
            or ruta_b not in embeddings
        ):

            pares_sin_embedding += 1

            continue

        embedding_a = embeddings[ruta_a]
        embedding_b = embeddings[ruta_b]

        # ----------------------------------------------------
        # Similaridad
        # ----------------------------------------------------

        similarity = (
            recognition_service.cosine_similarity(
                embedding_a,
                embedding_b
            )
        )

        # ----------------------------------------------------
        # Distancia
        # ----------------------------------------------------

        distance = 1 - similarity

        # ----------------------------------------------------
        # Predicción
        # ----------------------------------------------------

        prediccion = int(
            similarity >= UMBRAL_SIMILITUD
        )

        # ----------------------------------------------------
        # Matriz de confusión
        # ----------------------------------------------------

        if (
            label_real == 1
            and prediccion == 1
        ):

            tipo = "TP"

        elif (
            label_real == 0
            and prediccion == 0
        ):

            tipo = "TN"

        elif (
            label_real == 0
            and prediccion == 1
        ):

            tipo = "FP"

        else:

            tipo = "FN"

        correcto = int(
            prediccion == label_real
        )

        resultados.append({

            "pair_id": indice,

            "image_a": ruta_a.name,

            "image_b": ruta_b.name,

            "similarity": round(
                similarity,
                6
            ),

            "distance": round(
                distance,
                6
            ),

            "threshold": UMBRAL_SIMILITUD,

            "label_real": label_real,

            "prediccion": prediccion,

            "correcto": correcto,

            "tipo": tipo
        })

        # Mostrar progreso cada 100 pares

        if (
            indice % 100 == 0
            or indice == total
        ):

            print(
                f"Procesados: "
                f"{indice}/{total}"
            )

    return resultados, pares_sin_embedding


# ============================================================
# CALCULAR MÉTRICAS
# ============================================================

def calcular_metricas(resultados):

    tp = sum(
        1
        for resultado in resultados
        if resultado["tipo"] == "TP"
    )

    tn = sum(
        1
        for resultado in resultados
        if resultado["tipo"] == "TN"
    )

    fp = sum(
        1
        for resultado in resultados
        if resultado["tipo"] == "FP"
    )

    fn = sum(
        1
        for resultado in resultados
        if resultado["tipo"] == "FN"
    )

    total = (
        tp
        + tn
        + fp
        + fn
    )

    # --------------------------------------------------------
    # Accuracy
    # --------------------------------------------------------

    if total > 0:

        accuracy = (
            (tp + tn)
            / total
        )

    else:

        accuracy = 0

    # --------------------------------------------------------
    # Precision
    # --------------------------------------------------------

    if (
        tp + fp
    ) > 0:

        precision = (
            tp
            / (tp + fp)
        )

    else:

        precision = 0

    # --------------------------------------------------------
    # Recall
    # --------------------------------------------------------

    if (
        tp + fn
    ) > 0:

        recall = (
            tp
            / (tp + fn)
        )

    else:

        recall = 0

    # --------------------------------------------------------
    # F1
    # --------------------------------------------------------

    if (
        precision + recall
    ) > 0:

        f1 = (
            2
            * precision
            * recall
            / (
                precision
                + recall
            )
        )

    else:

        f1 = 0

    # --------------------------------------------------------
    # FAR
    # False Acceptance Rate
    # --------------------------------------------------------

    if (
        fp + tn
    ) > 0:

        far = (
            fp
            / (fp + tn)
        )

    else:

        far = 0

    # --------------------------------------------------------
    # FRR
    # False Rejection Rate
    # --------------------------------------------------------

    if (
        fn + tp
    ) > 0:

        frr = (
            fn
            / (fn + tp)
        )

    else:

        frr = 0

    return {

        "tp": tp,

        "tn": tn,

        "fp": fp,

        "fn": fn,

        "total": total,

        "accuracy": accuracy,

        "precision": precision,

        "recall": recall,

        "f1": f1,

        "far": far,

        "frr": frr
    }


# ============================================================
# GUARDAR CSV
# ============================================================

def guardar_resultados(resultados):

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with open(
        OUTPUT_FILE,
        "w",
        newline="",
        encoding="utf-8"
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=[
                "pair_id",
                "image_a",
                "image_b",
                "similarity",
                "distance",
                "threshold",
                "label_real",
                "prediccion",
                "correcto",
                "tipo"
            ]
        )

        writer.writeheader()

        writer.writerows(
            resultados
        )


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)

    print(
        "EVALUACIÓN COMPLETA LFW"
    )

    print(
        "InsightFace + ArcFace"
    )

    print("=" * 60)

    # --------------------------------------------------------
    # Cargar dataset
    # --------------------------------------------------------

    print(
        "\nCargando pares oficiales..."
    )

    pares = cargar_pares_oficiales()

    print(
        f"\nTotal de pares: "
        f"{len(pares)}"
    )

    # --------------------------------------------------------
    # Embeddings
    # --------------------------------------------------------

    embeddings, errores = (
        generar_embeddings_unicos(
            pares
        )
    )

    # --------------------------------------------------------
    # Evaluación
    # --------------------------------------------------------

    resultados, pares_sin_embedding = (
        evaluar_pares(
            pares,
            embeddings
        )
    )

    # --------------------------------------------------------
    # Guardar
    # --------------------------------------------------------

    guardar_resultados(
        resultados
    )

    # --------------------------------------------------------
    # Métricas
    # --------------------------------------------------------

    metricas = calcular_metricas(
        resultados
    )

    # ========================================================
    # RESULTADO FINAL
    # ========================================================

    print("\n")

    print("=" * 60)

    print(
        "RESULTADOS FINALES"
    )

    print("=" * 60)

    print(
        f"Pares del dataset: "
        f"{len(pares)}"
    )

    print(
        f"Imágenes únicas: "
        f"{len(embeddings) + len(errores)}"
    )

    print(
        f"Embeddings generados: "
        f"{len(embeddings)}"
    )

    print(
        f"Imágenes con error: "
        f"{len(errores)}"
    )

    print(
        f"Pares evaluados: "
        f"{metricas['total']}"
    )

    print(
        f"Pares sin embedding: "
        f"{pares_sin_embedding}"
    )

    print("\n" + "-" * 60)

    print(
        "MATRIZ DE CONFUSIÓN"
    )

    print("-" * 60)

    print(
        f"Verdaderos positivos (TP): "
        f"{metricas['tp']}"
    )

    print(
        f"Verdaderos negativos (TN): "
        f"{metricas['tn']}"
    )

    print(
        f"Falsos positivos (FP): "
        f"{metricas['fp']}"
    )

    print(
        f"Falsos negativos (FN): "
        f"{metricas['fn']}"
    )

    print("\n" + "-" * 60)

    print(
        "MÉTRICAS"
    )

    print("-" * 60)

    print(
        f"Accuracy:  "
        f"{metricas['accuracy'] * 100:.2f}%"
    )

    print(
        f"Precision: "
        f"{metricas['precision'] * 100:.2f}%"
    )

    print(
        f"Recall:    "
        f"{metricas['recall'] * 100:.2f}%"
    )

    print(
        f"F1 Score:  "
        f"{metricas['f1'] * 100:.2f}%"
    )

    print(
        f"FAR:       "
        f"{metricas['far'] * 100:.2f}%"
    )

    print(
        f"FRR:       "
        f"{metricas['frr'] * 100:.2f}%"
    )

    print("\n" + "-" * 60)

    print(
        f"Umbral utilizado: "
        f"{UMBRAL_SIMILITUD}"
    )

    print(
        "\nCSV generado:"
    )

    print(
        OUTPUT_FILE
    )

    print("=" * 60)


# ============================================================
# EJECUCIÓN
# ============================================================

if __name__ == "__main__":

    main()