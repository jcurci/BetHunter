#!/bin/bash
#
# Verifica que todo método @objc de BetBlockingModule.swift tem um
# RCT_EXTERN_METHOD correspondente em BetBlockingModule.m.
#
# Motivo: um método implementado no Swift mas não exportado no .m simplesmente
# não existe para o JS. E como o lado JS usa optional chaining
# (`modulo?.metodo?.()`), a chamada some em silêncio — sem exceção, sem warning,
# sem nada no log.
#
# Foi exatamente assim que syncAuthSession/clearAuthSession ficaram mortos:
# implementados no Swift no commit 189a8a53 e nunca exportados. Resultado: o
# enforcement de assinatura no iOS nunca rodou, em nenhuma versão.
#
# Uso: ./scripts/check-rn-bridge.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SWIFT_FILE="$SCRIPT_DIR/../ios/BetHunter/Blocking/BetBlockingModule.swift"
OBJC_FILE="$SCRIPT_DIR/../ios/BetHunter/Blocking/BetBlockingModule.m"

for f in "$SWIFT_FILE" "$OBJC_FILE"; do
  if [[ ! -f "$f" ]]; then
    echo "erro: arquivo não encontrado: $f" >&2
    exit 1
  fi
done

# Nomes dos métodos @objc do Swift.
# `@objc` numa linha, `func nome(` na seguinte. Ignora `@objc(BetBlocking)` da
# classe e `requiresMainQueueSetup`, que o RN chama diretamente.
swift_methods=$(
  grep -A 2 '^[[:space:]]*@objc[[:space:]]*$' "$SWIFT_FILE" \
    | grep -oE 'func [a-zA-Z_][a-zA-Z0-9_]*' \
    | sed 's/func //' \
    | grep -v '^requiresMainQueueSetup$' \
    | sort -u
)

objc_methods=$(
  grep -oE 'RCT_EXTERN_METHOD\([[:space:]]*[a-zA-Z_][a-zA-Z0-9_]*' "$OBJC_FILE" \
    | sed -E 's/RCT_EXTERN_METHOD\([[:space:]]*//' \
    | sort -u
)

missing=""
for method in $swift_methods; do
  if ! echo "$objc_methods" | grep -qx "$method"; then
    missing="$missing $method"
  fi
done

orphans=""
for method in $objc_methods; do
  if ! echo "$swift_methods" | grep -qx "$method"; then
    orphans="$orphans $method"
  fi
done

status=0

if [[ -n "$missing" ]]; then
  echo "FALHA: métodos @objc do Swift sem RCT_EXTERN_METHOD em BetBlockingModule.m:" >&2
  for m in $missing; do echo "  - $m" >&2; done
  echo "" >&2
  echo "Esses métodos NÃO existem para o JS e falharão em silêncio." >&2
  status=1
fi

if [[ -n "$orphans" ]]; then
  echo "FALHA: RCT_EXTERN_METHOD sem @objc func correspondente no Swift:" >&2
  for m in $orphans; do echo "  - $m" >&2; done
  echo "" >&2
  echo "Chamar esses métodos do JS derruba o app com unrecognized selector." >&2
  status=1
fi

if [[ $status -eq 0 ]]; then
  count=$(echo "$swift_methods" | grep -c . || true)
  echo "OK: $count métodos exportados corretamente nos dois arquivos."
fi

exit $status
