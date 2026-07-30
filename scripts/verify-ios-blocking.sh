#!/bin/bash
#
# Verificação da lógica de bloqueio do iOS que NÃO precisa de aparelho.
#
# Cobre o que pode quebrar em silêncio: o normalizador da blocklist, o formato do
# índice, a busca por sufixo, a paridade da heurística com o Kotlin, e a montagem
# de pacotes IP/UDP/DNS.
#
# O que este script NÃO cobre, e só um iPhone físico cobre: se o iOS realmente
# entrega as queries DNS ao resolver falso com a rota default excluída. Simulador
# não roda packet tunnel. Ver o portão da Fase 1 no plano.
#
# Uso: ./scripts/verify-ios-blocking.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$SCRIPT_DIR/../ios"
WORK_DIR="${TMPDIR:-/tmp}/bethunter-verify"
SDK="$(xcrun --show-sdk-path --sdk macosx)"

BLOCKLIST_URL="https://raw.githubusercontent.com/hidekiiwasa/blacklist-cassino/main/latin_america_blacklist_bets_cassino_brazil.txt"

mkdir -p "$WORK_DIR"

echo "==> Verificando correspondência do bridge React Native"
"$SCRIPT_DIR/check-rn-bridge.sh"
echo

echo "==> Baixando a blocklist real"
if [[ ! -f "$WORK_DIR/bl.txt" ]]; then
  curl -sL --max-time 120 "$BLOCKLIST_URL" -o "$WORK_DIR/bl.txt"
fi
echo "    $(wc -l < "$WORK_DIR/bl.txt" | tr -d ' ') linhas"
echo

echo "==> Compilando e rodando os testes de blocklist e índice"
# O Swift só aceita código top-level num arquivo chamado main.swift, daí a cópia.
mkdir -p "$WORK_DIR/blocklist"
cp "$IOS_DIR/Tests/BlocklistTests.swift" "$WORK_DIR/blocklist/main.swift"
swiftc -O -sdk "$SDK" -o "$WORK_DIR/blocklist-tests" \
  "$IOS_DIR"/Shared/*.swift \
  "$IOS_DIR/BetHunter/Blocking/BlocklistStore.swift" \
  "$IOS_DIR/PacketTunnel/BlocklistIndex.swift" \
  "$WORK_DIR/blocklist/main.swift"
"$WORK_DIR/blocklist-tests" "$WORK_DIR"
echo

echo "==> Compilando e rodando os testes de pacote IP e DNS"
mkdir -p "$WORK_DIR/net"
cp "$IOS_DIR/Tests/NetworkTests.swift" "$WORK_DIR/net/main.swift"
swiftc -O -sdk "$SDK" -o "$WORK_DIR/network-tests" \
  "$IOS_DIR/PacketTunnel/IPPacket.swift" \
  "$IOS_DIR/PacketTunnel/DNSMessage.swift" \
  "$WORK_DIR/net/main.swift"
"$WORK_DIR/network-tests"
echo

echo "==> Type-check da extensão PacketTunnel (iOS arm64)"
swiftc -typecheck -sdk "$(xcrun --show-sdk-path --sdk iphoneos)" \
  -target arm64-apple-ios16.0 \
  "$IOS_DIR"/Shared/*.swift "$IOS_DIR"/PacketTunnel/*.swift
echo "    OK"
echo

echo "==> Type-check da camada de bloqueio do app (iOS arm64)"
swiftc -typecheck -sdk "$(xcrun --show-sdk-path --sdk iphoneos)" \
  -target arm64-apple-ios16.0 \
  "$IOS_DIR"/Shared/*.swift \
  "$IOS_DIR/BetHunter/Blocking/AppGroupHelper.swift" \
  "$IOS_DIR/BetHunter/Blocking/AuthSessionKeychain.swift" \
  "$IOS_DIR/BetHunter/Blocking/BlocklistStore.swift" \
  "$IOS_DIR/BetHunter/Blocking/BlocklistSyncService.swift" \
  "$IOS_DIR/BetHunter/Blocking/BlockingManager.swift" \
  "$IOS_DIR/BetHunter/Blocking/TunnelController.swift" \
  "$IOS_DIR/BetHunter/Blocking/TunnelHealthMonitor.swift" \
  "$IOS_DIR/BetHunter/Blocking/SubscriptionEnforcementTask.swift" \
  "$IOS_DIR/BetHunter/Blocking/BlockingControlView.swift" \
  "$IOS_DIR/BetHunter/Blocking/BlockingFlowCoordinator.swift"
echo "    OK"
echo

echo "TODAS AS VERIFICAÇÕES PASSARAM"
