package com.bethunter.app.domain

/**
 * Cache LRU de decisões "bloqueado / não bloqueado" por domínio normalizado.
 *
 * Com a blocklist fora da RAM, cada query DNS viraria um toque no SQLite. Na
 * prática o tráfego real é muito repetitivo (um punhado de domínios responde pela
 * maioria das consultas de uma sessão), então este cache tira o disco do caminho
 * quente sem trazer de volta o consumo de memória: são no máximo algumas milhares
 * de strings curtas, não 311 mil.
 *
 * O TTL existe como rede de segurança para mudanças que não passem por
 * [clear] — a invalidação explícita continua sendo o caminho principal quando a
 * lista muda.
 */
class DecisionCache(
  private val maxEntries: Int = DEFAULT_MAX_ENTRIES,
  private val ttlMs: Long = DEFAULT_TTL_MS,
  private val clock: () -> Long = System::currentTimeMillis,
) {
  private data class Entry(val blocked: Boolean, val expiresAt: Long)

  // accessOrder = true: LinkedHashMap reordena no get, então o descarte é por uso
  // e não por inserção. Todo acesso muta a estrutura — daí o @Synchronized em
  // todos os métodos, já que o pool de DNS consulta de várias threads.
  private val entries = object : LinkedHashMap<String, Entry>(INITIAL_CAPACITY, LOAD_FACTOR, true) {
    override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, Entry>): Boolean =
      size > maxEntries
  }

  /** null = não sabemos (ausente ou vencido); o chamador consulta a fonte. */
  @Synchronized
  fun get(domain: String): Boolean? {
    val entry = entries[domain] ?: return null
    if (clock() >= entry.expiresAt) {
      entries.remove(domain)
      return null
    }
    return entry.blocked
  }

  @Synchronized
  fun put(domain: String, blocked: Boolean) {
    entries[domain] = Entry(blocked, clock() + ttlMs)
  }

  @Synchronized
  fun clear() {
    entries.clear()
  }

  @Synchronized
  fun size(): Int = entries.size

  companion object {
    const val DEFAULT_MAX_ENTRIES = 2_000
    val DEFAULT_TTL_MS = 30L * 60 * 1000
    private const val INITIAL_CAPACITY = 256
    private const val LOAD_FACTOR = 0.75f
  }
}
