#!/bin/bash

echo "🚀 Verificando alterações..."

if [[ -z $(git status -s) ]]; then
  echo "⚠️ Nenhuma alteração encontrada."
  exit 0
fi

echo "📦 Adicionando arquivos..."
git add .

DATA=$(date "+%Y-%m-%d %H:%M:%S")

echo "📝 Criando commit..."
git commit -m "update automático $DATA"

echo "⬆️ Enviando para GitHub..."
git push origin main

echo "🎉 Deploy finalizado!"

#!/bin/bash

echo "🚀 Deploy completo iniciando..."

echo "📦 Instalando dependências..."
npm install

echo "🔍 Verificando erros..."
npm run build

echo "📂 Adicionando arquivos..."
git add .

DATA=$(date "+%Y-%m-%d %H:%M:%S")

git commit -m "deploy automático $DATA"

echo "⬆️ Enviando para GitHub..."
git push origin main

echo "✅ Deploy concluído!"
