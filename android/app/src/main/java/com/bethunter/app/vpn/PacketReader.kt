package com.bethunter.app.vpn

import java.io.FileInputStream

class PacketReader(private val input: FileInputStream) {
  fun read(buffer: ByteArray): Int = input.read(buffer)
}

