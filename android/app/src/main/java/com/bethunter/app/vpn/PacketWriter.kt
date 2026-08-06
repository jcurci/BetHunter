package com.bethunter.app.vpn

import java.io.FileOutputStream

class PacketWriter(private val output: FileOutputStream) {
  /**
   * `@Synchronized` porque as respostas passaram a ser escritas pelo pool de DNS,
   * de várias threads. `FileOutputStream.write` não é atômico: duas respostas
   * concorrentes podem se intercalar no fd da tun e sair como pacotes corrompidos.
   */
  @Synchronized
  fun write(packet: ByteArray, length: Int) {
    output.write(packet, 0, length)
  }
}

