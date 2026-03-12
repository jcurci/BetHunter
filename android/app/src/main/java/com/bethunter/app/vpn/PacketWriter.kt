package com.bethunter.app.vpn

import java.io.FileOutputStream

class PacketWriter(private val output: FileOutputStream) {
  fun write(packet: ByteArray, length: Int) {
    output.write(packet, 0, length)
  }
}

