package com.bethunter.app.repository

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/**
 * Storage dedicado à blocklist (pode passar de 300 mil domínios). SharedPreferences
 * StringSet reserializa o XML inteiro a cada escrita/leitura — inviável nesse volume.
 */
class BlockedDomainsDb(context: Context) : SQLiteOpenHelper(context, DB_NAME, null, DB_VERSION) {

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

  companion object {
    private const val DB_NAME = "bet_blocker_domains.db"
    private const val DB_VERSION = 1
    private const val TABLE = "domains"
  }
}
