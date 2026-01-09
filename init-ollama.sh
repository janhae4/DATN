#!/bin/sh
set -e
echo "Dang khoi dong Ollama server..."
ollama serve &
pid=$!
sleep 5
if ! ollama list | grep -q "gemma2:2b"; then
  echo "Model 'gemma2:2b' chua ton tai. Dang tai ve..."
  ollama pull gemma2:2b
else
  echo "Model 'gemma2:2b' da ton tai."
fi
if ! ollama list | grep -q "nomic-embed-text"; then
  echo "Model 'nomic-embed-text' chua ton tai. Dang tai ve..."
  ollama pull nomic-embed-text
else
  echo "Model 'nomic-embed-text' da ton tai."
fi
echo "Qua trinh khoi tao hoan tat. Server san sang hoat dong."
wait $pid
