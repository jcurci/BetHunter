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

  fun getAll(): Set<String> {
    val result = LinkedHashSet<String>()
    readableDatabase.rawQuery("SELECT domain FROM $TABLE", null).use { cursor ->
      while (cursor.moveToNext()) {
        result.add(cursor.getString(0))
      }
    }
    return result
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

  companion object {
    private const val DB_NAME = "bet_blocker_domains.db"
    private const val DB_VERSION = 1
    private const val TABLE = "domains"
    private const val KV_TABLE = "kv"
    private const val IP_TABLE = "blocked_ips"
  }
}
