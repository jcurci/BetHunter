package com.bethunter.app.dns

import java.io.ByteArrayOutputStream

/**
 * Construtores mínimos de pacotes DNS para os testes. Escritos à mão de propósito:
 * o que está sob teste é justamente a leitura de bytes crus.
 */
object DnsFixtures {

  fun query(id: Int, name: String = "exemplo.com", qType: Int = 1): ByteArray {
    val out = ByteArrayOutputStream()
    out.writeShort(id)
    out.writeShort(0x0100) // RD=1
    out.writeShort(1) // qdcount
    out.writeShort(0) // ancount
    out.writeShort(0) // nscount
    out.writeShort(0) // arcount
    out.writeName(name)
    out.writeShort(qType)
    out.writeShort(1) // IN
    return out.toByteArray()
  }

  /**
   * Resposta com um registro A por TTL informado. O nome do registro usa ponteiro
   * de compressão (0xC00C), como fazem os resolvers de verdade.
   */
  fun response(
    id: Int,
    name: String = "exemplo.com",
    ttls: List<Int> = listOf(300),
    rcode: Int = 0,
    truncated: Boolean = false,
    qType: Int = 1,
  ): ByteArray {
    val out = ByteArrayOutputStream()
    out.writeShort(id)
    var flags = 0x8180 or (rcode and 0x0F) // QR=1, RD=1, RA=1
    if (truncated) flags = flags or 0x0200
    out.writeShort(flags)
    out.writeShort(1) // qdcount
    out.writeShort(ttls.size) // ancount
    out.writeShort(0)
    out.writeShort(0)
    out.writeName(name)
    out.writeShort(qType)
    out.writeShort(1)

    for (ttl in ttls) {
      out.writeShort(0xC00C) // ponteiro para o nome da pergunta
      out.writeShort(1) // type A
      out.writeShort(1) // class IN
      out.writeInt(ttl)
      out.writeShort(4) // rdlength
      out.write(byteArrayOf(93.toByte(), 184.toByte(), 216.toByte(), 34))
    }
    return out.toByteArray()
  }

  /**
   * Resposta NEGATIVA: sem registro de resposta e com um SOA na seção de
   * autoridade, que é de onde sai o TTL de uma negativa (RFC 2308).
   *
   * `rcode = 0` produz NODATA (o nome existe, mas não para este tipo) e `rcode = 3`
   * produz NXDOMAIN. As duas formas são a maior fatia do tráfego real: o navegador
   * pergunta AAAA e HTTPS para todo host, e na maioria dos domínios elas voltam
   * assim.
   */
  fun negativeResponse(
    id: Int,
    name: String = "exemplo.com",
    qType: Int = 1,
    rcode: Int = 0,
    soaTtl: Int = 300,
    soaMinimum: Int = 120,
    includeSoa: Boolean = true,
  ): ByteArray {
    val out = ByteArrayOutputStream()
    out.writeShort(id)
    out.writeShort(0x8180 or (rcode and 0x0F)) // QR=1, RD=1, RA=1
    out.writeShort(1) // qdcount
    out.writeShort(0) // ancount — é o que faz dela uma negativa
    out.writeShort(if (includeSoa) 1 else 0) // nscount
    out.writeShort(0) // arcount
    out.writeName(name)
    out.writeShort(qType)
    out.writeShort(1)

    if (includeSoa) {
      val rdata = ByteArrayOutputStream().apply {
        writeName("ns.exemplo.com")
        writeName("hostmaster.exemplo.com")
        writeInt(1)     // SERIAL
        writeInt(3600)  // REFRESH
        writeInt(600)   // RETRY
        writeInt(86400) // EXPIRE
        writeInt(soaMinimum)
      }.toByteArray()

      out.writeShort(0xC00C) // dono: ponteiro para o nome da pergunta
      out.writeShort(6) // type SOA
      out.writeShort(1) // class IN
      out.writeInt(soaTtl)
      out.writeShort(rdata.size)
      out.write(rdata)
    }
    return out.toByteArray()
  }

  private fun ByteArrayOutputStream.writeShort(value: Int) {
    write((value ushr 8) and 0xFF)
    write(value and 0xFF)
  }

  private fun ByteArrayOutputStream.writeInt(value: Int) {
    write((value ushr 24) and 0xFF)
    write((value ushr 16) and 0xFF)
    write((value ushr 8) and 0xFF)
    write(value and 0xFF)
  }

  private fun ByteArrayOutputStream.writeName(name: String) {
    for (label in name.split('.')) {
      if (label.isEmpty()) continue
      write(label.length)
      write(label.toByteArray(Charsets.UTF_8))
    }
    write(0)
  }
}
