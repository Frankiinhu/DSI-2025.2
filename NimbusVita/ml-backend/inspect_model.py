"""
Script para inspecionar o conteúdo do arquivo .joblib
"""
import joblib
from pathlib import Path

MODEL_PATH = Path(__file__).parent / "models" / "classifier.joblib"

try:
    data = joblib.load(MODEL_PATH)
    
    print("=" * 50)
    print("CONTEÚDO DO ARQUIVO .joblib")
    print("=" * 50)
    print(f"\nTipo: {type(data)}")
    print(f"\nConteúdo: {data}")
    
    if isinstance(data, dict):
        print("\n📦 É um dicionário! Chaves disponíveis:")
        for key in data.keys():
            print(f"  - {key}: {type(data[key])}")
            
    print("\n" + "=" * 50)
    
except Exception as e:
    print(f"❌ Erro ao carregar: {e}")
