set -e
echo "Dang khoi dong Ollama server..."
ollama serve &
pid=$!
sleep 5
if ! ollama list | grep -q "gemma3:4b"; then
  echo "Model 'gemma3:4b' chua ton tai. Dang tai ve..."
  ollama pull gemma3:4b
else
  echo "Model 'gemma3:4b' da ton tai."
fi
if ! ollama list | grep -q "nomic-embed-text"; then
  echo "Model 'nomic-embed-text' chua ton tai. Dang tai ve..."
  ollama pull nomic-embed-text
else
  echo "Model 'nomic-embed-text' da ton tai."
fi
echo "Qua trinh khoi tao hoan tat. Server san sang hoat dong."
wait $pid
