from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import joblib
import numpy as np
from pathlib import Path

app = FastAPI(title="NimbusVita ML API", version="1.0.0")

# Configurar CORS para permitir requisições do app React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique os domínios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Carregar o modelo
MODEL_PATH = Path(__file__).parent / "models" / "classifier.joblib"
model_data = None
model = None
label_encoder = None
scaler = None
feature_names = []

try:
    if MODEL_PATH.exists():
        model_data = joblib.load(MODEL_PATH)
        
        # Extrair componentes do dicionário
        if isinstance(model_data, dict):
            model = model_data.get('model')
            label_encoder = model_data.get('label_encoder')
            scaler = model_data.get('scaler')
            feature_names = model_data.get('feature_names', [])
            
            print(f"✅ Modelo carregado de {MODEL_PATH}")
            print(f"📊 Features: {len(feature_names)}")
            print(f"🎯 Classes: {label_encoder.classes_ if label_encoder else 'N/A'}")
        else:
            model = model_data
            print(f"✅ Modelo carregado (formato simples)")
    else:
        print(f"⚠️ Modelo não encontrado em {MODEL_PATH}")
except Exception as e:
    print(f"❌ Erro ao carregar modelo: {e}")


# Mapeamento dos sintomas do SymptomChecker para as features do modelo
# Features do modelo: ['Idade', 'Gênero', 'Temperatura (°C)', 'Umidade', 'Velocidade do Vento (km/h)', 
#                      'Náusea', 'Dor nas Articulações', 'Dor Abdominal', 'Febre Alta', 'Calafrios', 
#                      'Fadiga', 'Coriza', 'Dor Atrás dos Olhos', 'Tontura', 'Dor de Cabeça', 'Dor no Peito',
#                      'Vômito', 'Tosse', 'Tremores', 'Histórico de Asma', 'Colesterol Alto', 'Diabetes',
#                      'Obesidade', 'HIV/AIDS', 'Pólipos Nasais', 'Asma', 'Pressão Alta', 'Dor de Cabeça Severa',
#                      'Fraqueza', 'Problemas de Visão', 'Febre', 'Dores no Corpo', 'Dor de Garganta', 'Espirros',
#                      'Diarreia', 'Respiração Acelerada', 'Batimento Cardíaco Acelerado', 'Dor Atrás dos Olhos 2',
#                      'Glândulas Inchadas', 'Erupções Cutâneas', 'Dor de Cabeça Sinusal', 'Dor Facial',
#                      'Falta de Ar', 'Redução de Olfato e Paladar', 'Irritação na Pele', 'Coceira',
#                      'Dor de Cabeça Pulsante', 'Confusão Mental', 'Dor nas Costas', 'Dor no Joelho']

SYMPTOM_TO_FEATURE = {
    # Sintomas mapeados para índices das features (5 primeiras são contextuais)
    "nausea": 5,                          # Náusea
    "joint_pain": 6,                      # Dor nas Articulações
    "abdominal_pain": 7,                  # Dor Abdominal
    "high_fever": 8,                      # Febre Alta
    "chills": 9,                          # Calafrios
    "fatigue": 10,                        # Fadiga
    "runny_nose": 11,                     # Coriza
    "pain_behind_the_eyes": 12,           # Dor Atrás dos Olhos
    "pain_behind_eyes": 12,               # Dor Atrás dos Olhos (duplicado)
    "dizziness": 13,                      # Tontura
    "headache": 14,                       # Dor de Cabeça
    "chest_pain": 15,                     # Dor no Peito
    "vomiting": 16,                       # Vômito
    "cough": 17,                          # Tosse
    "shivering": 18,                      # Tremores
    "asthma_history": 19,                 # Histórico de Asma
    "high_cholesterol": 20,               # Colesterol Alto
    "diabetes": 21,                       # Diabetes
    "obesity": 22,                        # Obesidade
    "hiv_aids": 23,                       # HIV/AIDS
    "nasal_polyps": 24,                   # Pólipos Nasais
    "asthma": 25,                         # Asma
    "high_blood_pressure": 26,            # Pressão Alta
    "severe_headache": 27,                # Dor de Cabeça Severa
    "weakness": 28,                       # Fraqueza
    "trouble_seeing": 29,                 # Problemas de Visão
    "fever": 30,                          # Febre
    "body_aches": 31,                     # Dores no Corpo
    "sore_throat": 32,                    # Dor de Garganta
    "sneezing": 33,                       # Espirros
    "diarrhea": 34,                       # Diarreia
    "rapid_breathing": 35,                # Respiração Acelerada
    "rapid_heart_rate": 36,               # Batimento Cardíaco Acelerado
    "swollen_glands": 38,                 # Glândulas Inchadas
    "rashes": 39,                         # Erupções Cutâneas
    "sinus_headache": 40,                 # Dor de Cabeça Sinusal
    "facial_pain": 41,                    # Dor Facial
    "shortness_of_breath": 42,            # Falta de Ar
    "reduced_smell_and_taste": 43,        # Redução de Olfato e Paladar
    "skin_irritation": 44,                # Irritação na Pele
    "itchiness": 45,                      # Coceira
    "throbbing_headache": 46,             # Dor de Cabeça Pulsante
    "confusion": 47,                      # Confusão Mental
    "back_pain": 48,                      # Dor nas Costas
    "knee_ache": 49,                      # Dor no Joelho
}


class PredictionRequest(BaseModel):
    symptoms: List[str]  # Lista de IDs dos sintomas selecionados


class DiagnosisResult(BaseModel):
    condition: str
    probability: float
    confidence: str  # 'high', 'medium', 'low'


class PredictionResponse(BaseModel):
    diagnoses: List[DiagnosisResult]
    selected_symptoms: List[str]
    total_symptoms: int


@app.get("/")
@app.head("/")
async def root():
    """Endpoint raiz para verificar se a API está funcionando"""
    return {
        "message": "NimbusVita ML API está funcionando",
        "version": "1.0.0",
        "model_loaded": model is not None,
        "available_symptoms": len(SYMPTOM_TO_FEATURE),
        "model_features": len(feature_names) if feature_names else 0
    }


@app.get("/health")
@app.head("/health")
async def health_check():
    """Endpoint de health check"""
    return {
        "status": "healthy",
        "model_status": "loaded" if model is not None else "not_loaded"
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Prediz diagnósticos baseado nos sintomas selecionados
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Modelo não está carregado. Use o mock prediction por enquanto."
        )
    
    if not request.symptoms or len(request.symptoms) == 0:
        raise HTTPException(
            status_code=400,
            detail="Nenhum sintoma foi selecionado"
        )
    
    try:
        # Criar vetor de features (50 features)
        feature_vector = np.zeros(50)
        
        # Preencher dados contextuais com valores padrão
        feature_vector[0] = 30.0        # Idade padrão: 30 anos
        feature_vector[1] = 0.0         # Gênero: 0 (pode ser ajustado)
        feature_vector[2] = 37.0        # Temperatura padrão: 37°C
        feature_vector[3] = 60.0        # Umidade padrão: 60%
        feature_vector[4] = 10.0        # Velocidade do Vento: 10 km/h
        
        # Mapear sintomas selecionados para as features (índices 5-49)
        for symptom_id in request.symptoms:
            if symptom_id in SYMPTOM_TO_FEATURE:
                feature_idx = SYMPTOM_TO_FEATURE[symptom_id]
                feature_vector[feature_idx] = 1.0  # Sintoma presente
        
        # Aplicar escalonamento se disponível
        if scaler:
            feature_vector = scaler.transform([feature_vector])[0]
        
        # Fazer predição
        probabilities = model.predict_proba([feature_vector])[0]
        
        # Decodificar classes se label_encoder estiver disponível
        if label_encoder:
            classes = label_encoder.classes_
        else:
            classes = model.classes_
        
        # Criar lista de diagnósticos com probabilidades (converter para porcentagem)
        diagnoses = []
        for cls, prob in zip(classes, probabilities):
            percentage = prob * 100  # Converter para porcentagem
            if percentage > 1.0:  # Apenas diagnósticos com probabilidade > 1%
                # Arredondar para inteiro
                percentage_int = int(round(percentage))
                confidence = "high" if percentage_int > 60 else "medium" if percentage_int > 30 else "low"
                diagnoses.append(DiagnosisResult(
                    condition=cls,
                    probability=float(percentage_int),
                    confidence=confidence
                ))
        
        # Ordenar por probabilidade
        diagnoses.sort(key=lambda x: x.probability, reverse=True)
        
        return PredictionResponse(
            diagnoses=diagnoses[:5],  # Top 5 diagnósticos
            selected_symptoms=request.symptoms,
            total_symptoms=len(request.symptoms)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar predição: {str(e)}"
        )


@app.get("/symptoms")
async def get_symptoms():
    """Retorna a lista de sintomas disponíveis e seus mapeamentos"""
    return {
        "total": len(SYMPTOM_TO_FEATURE),
        "symptoms": SYMPTOM_TO_FEATURE
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

