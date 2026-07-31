package com.bethunter.app.repository

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Cobre a classificação IP × domínio da ingestão da blocklist.
 *
 * Lógica pura, sem dependência de Android — e é exatamente onde mora a
 * regressão silenciosa: se a ordem do teste inverter em BlocklistManager, os
 * IPs voltam a ser engolidos como domínio e o bloqueio para de funcionar sem
 * nenhum erro aparecer em lugar nenhum.
 */
class BlockableIpv4Test {

  private fun classify(input: String) = BlockedDomainsRepository.blockableIpv4OrNull(input)

  @Test
  fun `aceita IPv4 publico roteavel`() {
    assertEquals("15.229.221.132", classify("15.229.221.132"))
    assertEquals("18.228.51.151", classify("18.228.51.151"))
    assertEquals("211.43.149.99", classify("211.43.149.99"))
    assertEquals("8.8.8.8", classify("8.8.8.8"))
    assertEquals("1.1.1.1", classify("1.1.1.1"))
  }

  @Test
  fun `aceita a sintaxe da lista remota com sufixo circunflexo`() {
    // É assim que a linha chega do arquivo: "15.229.221.132^"
    assertEquals("15.229.221.132", classify("15.229.221.132^"))
    assertEquals("15.229.221.132", classify("  15.229.221.132^  "))
  }

  @Test
  fun `recusa faixas que nunca podem virar rota`() {
    // Uma rota /32 para qualquer uma destas mandaria tráfego local ou reservado
    // para dentro da tun, onde o runLoop descarta tudo que não é DNS.
    val reservados = listOf(
      "0.0.0.0", "0.1.2.3",           // "this network"
      "127.0.0.1", "127.1.2.3",       // loopback
      "10.0.0.1", "10.255.255.254",   // privado
      "172.16.0.1", "172.31.255.254", // privado
      "192.168.0.1", "192.168.1.1",   // privado
      "169.254.1.1",                  // link-local
      "100.64.0.1", "100.127.255.1",  // CGNAT de operadora
      "224.0.0.1", "239.1.1.1",       // multicast
      "240.0.0.1",                    // reservado
      "255.255.255.255"               // broadcast
    )
    for (ip in reservados) {
      assertNull("deveria recusar $ip", classify(ip))
    }
  }

  @Test
  fun `aceita as bordas legitimas vizinhas das faixas reservadas`() {
    assertNotNull(classify("11.0.0.1"))       // logo acima de 10/8
    assertNotNull(classify("172.15.0.1"))     // logo abaixo de 172.16/12
    assertNotNull(classify("172.32.0.1"))     // logo acima de 172.16/12
    assertNotNull(classify("192.167.0.1"))    // logo abaixo de 192.168/16
    assertNotNull(classify("100.63.0.1"))     // logo abaixo do CGNAT
    assertNotNull(classify("100.128.0.1"))    // logo acima do CGNAT
    assertNotNull(classify("223.255.255.254"))// logo abaixo do multicast
  }

  @Test
  fun `recusa formatos invalidos`() {
    val invalidos = listOf(
      "15.229.221",          // 3 octetos
      "15.229.221.132.5",    // 5 octetos
      "15.229.221.256",      // octeto fora da faixa
      "15.229.221.-1",
      "15.229.221.",         // octeto vazio
      "15.229.221.01",       // zero à esquerda: ambíguo (há parser que lê octal)
      "15.229.221.0132",
      "15.229.221.13a",
      "bet365.com",
      "1.1.1.1.com",
      ""
    )
    for (entrada in invalidos) {
      assertNull("deveria recusar '$entrada'", classify(entrada))
    }
    assertNull(BlockedDomainsRepository.blockableIpv4OrNull(null))
  }

  /**
   * O teste que justifica a ordem da classificação, e o mais importante do
   * arquivo. `normalizeDomain` aceita um IP como se fosse domínio — DOMAIN_REGEX
   * casa dígitos e pontos, e os labels são válidos. Se BlocklistManager testar
   * domínio antes de IP, o endereço vai parar na trie de DNS, onde nunca será
   * consultado (ninguém pede ao DNS para resolver um IP literal) e o bloqueio
   * falha em silêncio. Era exatamente o bug.
   */
  @Test
  fun `normalizeDomain aceita IP - por isso a classificacao de IP vem primeiro`() {
    assertNotNull(
      "se isto virar null, a ordem em BlocklistManager deixou de importar — reveja o teste",
      BlockedDomainsRepository.normalizeDomain("15.229.221.132")
    )
    assertNotNull(classify("15.229.221.132"))
  }

  @Test
  fun `dominios reais nao sao confundidos com IP`() {
    for (dominio in listOf("bet365.com", "betweb.com", "23bet36.com", "a.b.c.d")) {
      assertNull(classify(dominio))
      assertNotNull(BlockedDomainsRepository.normalizeDomain(dominio))
    }
  }

  @Test
  fun `piso embutido cobre os dois enderecos da betweb`() {
    // O segundo veio do CN do certificado servido pelo primeiro; os dois servem
    // o mesmo conteúdo, então bloquear só um deixa a casa acessível.
    assertTrue(BlockedDomainsRepository.DEFAULT_BLOCKED_IPS.contains("15.229.221.132"))
    assertTrue(BlockedDomainsRepository.DEFAULT_BLOCKED_IPS.contains("18.228.51.151"))
    // Todo default precisa sobreviver à própria validação, senão vira rota inválida.
    for (ip in BlockedDomainsRepository.DEFAULT_BLOCKED_IPS) {
      assertEquals("default inválido: $ip", ip, classify(ip))
    }
  }

  @Test
  fun `allowlist nao colide com os defaults`() {
    val colisao = BlockedDomainsRepository.DEFAULT_BLOCKED_IPS
      .intersect(BlockedDomainsRepository.IP_ALLOWLIST)
    assertTrue("IP em DEFAULT e ALLOWLIST ao mesmo tempo: $colisao", colisao.isEmpty())
  }
}
