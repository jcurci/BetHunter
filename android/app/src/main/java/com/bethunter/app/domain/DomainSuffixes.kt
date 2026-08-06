package com.bethunter.app.domain

/**
 * Sufixos consultáveis de um domínio, do mais curto ao mais longo.
 *
 * Substitui o passeio pela trie: `a.b.exemplo.com` vira
 * `["exemplo.com", "b.exemplo.com", "a.b.exemplo.com"]`, e basta perguntar ao banco
 * se QUALQUER um deles está na blocklist — semântica idêntica à antiga
 * (`DomainTrie.matches` casava em qualquer nó terminal do caminho), só que sem
 * manter 311 mil domínios em memória.
 *
 * Sufixos de um rótulo só (`com`) ficam de fora de propósito: `normalizeDomain`
 * recusa entrada sem ponto, então eles NUNCA existem na tabela e só ocupariam
 * espaço na cláusula IN.
 */
object DomainSuffixes {

  /**
   * Teto de sufixos gerados. Nome com muitos rótulos (subdomínio gerado por
   * serviço, ou entrada hostil) não pode virar uma cláusula IN gigante no caminho
   * quente. Começamos pelos mais CURTOS, que são os que a blocklist realmente
   * contém — casa de aposta é mapeada pelo domínio registrável, não por um
   * subdomínio de dez níveis.
   */
  const val MAX_SUFFIXES = 12

  fun of(normalized: String): List<String> {
    if (normalized.isEmpty()) return emptyList()
    val labels = normalized.split('.').filter { it.isNotBlank() }
    if (labels.size < 2) return emptyList()

    val result = ArrayList<String>(minOf(labels.size - 1, MAX_SUFFIXES))
    var index = labels.size - 2
    while (index >= 0 && result.size < MAX_SUFFIXES) {
      result.add(labels.subList(index, labels.size).joinToString("."))
      index--
    }
    return result
  }
}
