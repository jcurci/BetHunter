package com.bethunter.app.repository

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/**
 * Storage dedicado à blocklist (pode passar de 300 mil domínios). SharedPreferences
 * StringSet reserializa o XML inteiro a cada escrita/leitura — inviável nesse volume.
 */
class BlockedDomainsDb(context: Context) : SQLiteOpenHelper(context, DB_NAME, null, DB_VERSION) {

  override fun onConfigure(db: SQLiteDatabase) {
    super.onConfigure(db)
    // Este DB agora é multi-processo (VPN roda em :vpn, módulo RN no principal).
    // busy_timeout faz uma operação ESPERAR um lock em vez de lançar SQLITE_BUSY
    // — ex.: ler o flag enabled/revoked enquanto o refresh de ~300k domínios grava.
    // PRAGMA busy_timeout RETORNA o valor, então precisa de rawQuery (execSQL recusa
    // statements com retorno). Usamos o `db` recebido (não getWritableDatabase) para
    // não recursar durante a configuração.
    db.rawQuery("PRAGMA busy_timeout = 3000", null).use { it.moveToFirst() }
  }

  override fun onCreate(db: SQLiteDatabase) {
    db.execSQL("CREATE TABLE $TABLE (domain TEXT PRIMARY KEY)")
  }

  override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
    db.execSQL("DROP TABLE IF EXISTS $TABLE")
    onCreate(db)
  }

  fun replaceAll(domains: Collection<String>) {
    val db = writableDatabase
    db.beginTransaction()
    try {
      db.execSQL("DELETE FROM $TABLE")
      val stmt = db.compileStatement("INSERT OR IGNORE INTO $TABLE (domain) VALUES (?)")
      for (domain in domains) {
        stmt.bindString(1, domain)
        stmt.executeInsert()
        stmt.clearBindings()
      }
      db.setTransactionSuccessful()
    } finally {
      db.endTransaction()
    }
  }

  /**
   * true se qualquer um dos [candidates] está na blocklist.
   *
   * É o caminho quente do bloqueio, chamado por query DNS: uma única consulta com
   * `IN`, resolvida por lookups na PRIMARY KEY (índice), tipicamente em frações de
   * milissegundo. Substitui a trie em memória, que custava ~150-200 MB no processo
   * `:vpn` e o transformava no primeiro alvo do lmkd.
   */
  fun isAnyBlocked(candidates: Collection<String>): Boolean {
    if (candidates.isEmpty()) return false
    val placeholders = candidates.joinToString(",") { "?" }
    readableDatabase.rawQuery(
      "SELECT 1 FROM $TABLE WHERE domain IN ($placeholders) LIMIT 1",
      candidates.toTypedArray()
    ).use { cursor ->
      return cursor.moveToFirst()
    }
  }

  fun count(): Int {
    readableDatabase.rawQuery("SELECT COUNT(*) FROM $TABLE", null).use { cursor ->
      return if (cursor.moveToFirst()) cursor.getInt(0) else 0
    }
  }

  // --- KV cross-process para flags de estado (enabled/revoked) ---
  // SharedPreferences não é confiável entre processos; o SQLite é (file locking do
  // OS). Como a VPN roda em processo separado (:vpn) e o módulo RN no processo
  // principal, ambos leem/escrevem esses flags aqui para ter uma única fonte de
  // verdade. Criado sob demanda (CREATE IF NOT EXISTS) para não bumpar DB_VERSION
  // nem dropar a tabela de domínios em upgrades.
  private fun ensureKvTable(db: SQLiteDatabase) {
    db.execSQL("CREATE TABLE IF NOT EXISTS $KV_TABLE (k TEXT PRIMARY KEY, v INTEGER)")
  }

  fun getFlagOrNull(key: String): Boolean? {
    val db = writableDatabase
    ensureKvTable(db)
    db.rawQuery("SELECT v FROM $KV_TABLE WHERE k = ?", arrayOf(key)).use { cursor ->
      return if (cursor.moveToFirst()) cursor.getInt(0) != 0 else null
    }
  }

  fun setFlag(key: String, value: Boolean) {
    val db = writableDatabase
    ensureKvTable(db)
    db.execSQL(
      "INSERT OR REPLACE INTO $KV_TABLE (k, v) VALUES (?, ?)",
      arrayOf<Any>(key, if (value) 1 else 0)
    )
  }

  /**
   * A coluna `v` já é INTEGER, que no SQLite guarda até 8 bytes — cabe epoch
   * millis sem bumpar DB_VERSION. Usado pela licença de premium, que precisa de
   * um timestamp e não de um booleano.
   */
  fun getLongOrNull(key: String): Long? {
    val db = writableDatabase
    ensureKvTable(db)
    db.rawQuery("SELECT v FROM $KV_TABLE WHERE k = ?", arrayOf(key)).use { cursor ->
      return if (cursor.moveToFirst()) cursor.getLong(0) else null
    }
  }

  fun setLong(key: String, value: Long) {
    val db = writableDatabase
    ensureKvTable(db)
    db.execSQL(
      "INSERT OR REPLACE INTO $KV_TABLE (k, v) VALUES (?, ?)",
      arrayOf<Any>(key, value)
    )
  }

  /**
   * Lock cooperativo cross-process com expiração, guardado no próprio KV.
   *
   * O `forceRefresh` da blocklist é disparado de quatro lugares (serviço, laço
   * horário, worker e módulo RN) em DOIS processos. Dois refreshes simultâneos
   * fazem duas transações de ~311 mil linhas competirem pelo mesmo arquivo, cada
   * uma segurando o lock do SQLite por segundos — tempo suficiente para estourar o
   * `busy_timeout` de quem só queria ler uma flag, inclusive a thread de DNS.
   *
   * O TTL é o que impede um processo morto no meio do refresh de travar os
   * próximos para sempre. A leitura e a escrita ficam na mesma transação para que
   * dois candidatos simultâneos não passem juntos.
   */
  fun tryAcquireLock(key: String, nowMs: Long, ttlMs: Long): Boolean {
    val db = writableDatabase
    ensureKvTable(db)
    db.beginTransaction()
    try {
      val heldUntil = db.rawQuery("SELECT v FROM $KV_TABLE WHERE k = ?", arrayOf(key)).use { cursor ->
        if (cursor.moveToFirst()) cursor.getLong(0) else 0L
      }
      if (heldUntil > nowMs) return false
      db.execSQL(
        "INSERT OR REPLACE INTO $KV_TABLE (k, v) VALUES (?, ?)",
        arrayOf<Any>(key, nowMs + ttlMs)
      )
      db.setTransactionSuccessful()
      return true
    } finally {
      db.endTransaction()
    }
  }

  fun releaseLock(key: String) = setLong(key, 0L)

  // --- IP blocklist (Camada B: bloqueio de acesso direto por IP) ---
  // Lista curada e pequena de IPs de destino conhecidos (ex.: servidores para onde
  // casas redirecionam). O VpnService (processo :vpn) lê isto no startVpn() para
  // rotear cada IP para dentro da tun; o runLoop então descarta os pacotes.
  private fun ensureIpTable(db: SQLiteDatabase) {
    db.execSQL("CREATE TABLE IF NOT EXISTS $IP_TABLE (ip TEXT PRIMARY KEY)")
  }

  fun getAllIps(): Set<String> {
    val db = writableDatabase
    ensureIpTable(db)
    val result = LinkedHashSet<String>()
    db.rawQuery("SELECT ip FROM $IP_TABLE", null).use { cursor ->
      while (cursor.moveToNext()) result.add(cursor.getString(0))
    }
    return result
  }

  fun replaceAllIps(ips: Collection<String>) {
    val db = writableDatabase
    ensureIpTable(db)
    db.beginTransaction()
    try {
      db.execSQL("DELETE FROM $IP_TABLE")
      val stmt = db.compileStatement("INSERT OR IGNORE INTO $IP_TABLE (ip) VALUES (?)")
      for (ip in ips) {
        stmt.bindString(1, ip)
        stmt.executeInsert()
        stmt.clearBindings()
      }
      db.setTransactionSuccessful()
    } finally {
      db.endTransaction()
    }
  }

  // --- Log de eventos (diagnóstico) ---
  // Estava em SharedPreferences, o que o deixava SPLIT entre os processos: o `:vpn`
  // gravava num arquivo que o processo principal não lia, então metade da história
  // (justamente a da VPN) era invisível para o app. Aqui os dois processos veem o
  // mesmo log. Criada sob demanda, sem bumpar DB_VERSION — que dropa `domains`.
  private fun ensureEventsTable(db: SQLiteDatabase) {
    db.execSQL(
      "CREATE TABLE IF NOT EXISTS $EVENTS_TABLE (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, " +
        "event TEXT NOT NULL, meta TEXT, count INTEGER NOT NULL DEFAULT 1)"
    )
  }

  data class EventRow(val ts: Long, val event: String, val meta: String?, val count: Int)

  /**
   * Grava um evento, coalescendo repetições consecutivas do mesmo evento em um
   * contador.
   *
   * A coalescência não é economia de espaço, é preservação de história: um ciclo de
   * start/stop escrevia ~4 eventos a cada 2 s e limpava o buffer inteiro em menos
   * de um minuto, apagando exatamente o rastro necessário para diagnosticar
   * qualquer outra falha. Com o contador, mil repetições ocupam uma linha.
   */
  fun appendEvent(ts: Long, event: String, meta: String?, maxEntries: Int) {
    val db = writableDatabase
    ensureEventsTable(db)
    db.beginTransaction()
    try {
      val lastId = db.rawQuery("SELECT id, event FROM $EVENTS_TABLE ORDER BY id DESC LIMIT 1", null)
        .use { cursor ->
          if (cursor.moveToFirst() && cursor.getString(1) == event) cursor.getLong(0) else null
        }

      if (lastId != null) {
        // `ts` passa a ser a ÚLTIMA ocorrência — é o que hasRestartEventSince precisa.
        db.execSQL(
          "UPDATE $EVENTS_TABLE SET ts = ?, count = count + 1, meta = ? WHERE id = ?",
          arrayOf<Any>(ts, meta ?: "", lastId)
        )
      } else {
        db.execSQL(
          "INSERT INTO $EVENTS_TABLE (ts, event, meta, count) VALUES (?, ?, ?, 1)",
          arrayOf<Any>(ts, event, meta ?: "")
        )
        // Ring buffer por id (AUTOINCREMENT é monotônico, então isto é uma janela).
        db.execSQL(
          "DELETE FROM $EVENTS_TABLE WHERE id <= (SELECT MAX(id) FROM $EVENTS_TABLE) - ?",
          arrayOf<Any>(maxEntries)
        )
      }
      db.setTransactionSuccessful()
    } finally {
      db.endTransaction()
    }
  }

  /** Eventos em ordem cronológica. [sinceTs] > 0 filtra pelos mais recentes. */
  fun getEvents(sinceTs: Long = 0L): List<EventRow> {
    val db = writableDatabase
    ensureEventsTable(db)
    val result = ArrayList<EventRow>()
    val sql = "SELECT ts, event, meta, count FROM $EVENTS_TABLE" +
      (if (sinceTs > 0L) " WHERE ts > ?" else "") +
      " ORDER BY id ASC"
    val args = if (sinceTs > 0L) arrayOf(sinceTs.toString()) else null
    db.rawQuery(sql, args).use { cursor ->
      while (cursor.moveToNext()) {
        result.add(
          EventRow(
            ts = cursor.getLong(0),
            event = cursor.getString(1),
            meta = cursor.getString(2),
            count = cursor.getInt(3),
          )
        )
      }
    }
    return result
  }

  companion object {
    private const val DB_NAME = "bet_blocker_domains.db"
    private const val DB_VERSION = 1
    private const val TABLE = "domains"
    private const val KV_TABLE = "kv"
    private const val IP_TABLE = "blocked_ips"
    private const val EVENTS_TABLE = "events"
  }
}
