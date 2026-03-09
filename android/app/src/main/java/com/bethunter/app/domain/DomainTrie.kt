package com.bethunter.app.domain

/**
 * Suffix trie for fast "domain or subdomain" matching.
 * Stores labels reversed: "a.b.com" => ["com","b","a"].
 */
class DomainTrie {
  private class Node {
    val children: MutableMap<String, Node> = HashMap()
    var terminal: Boolean = false
  }

  private val root = Node()

  fun clear() {
    root.children.clear()
    root.terminal = false
  }

  fun addDomain(domain: String) {
    val labels = domain.split('.').filter { it.isNotBlank() }
    if (labels.isEmpty()) return
    var node = root
    for (i in labels.size - 1 downTo 0) {
      val label = labels[i]
      node = node.children.getOrPut(label) { Node() }
    }
    node.terminal = true
  }

  /**
   * Returns true if [domain] matches any stored blocked domain,
   * including subdomains.
   */
  fun matches(domain: String): Boolean {
    val labels = domain.split('.').filter { it.isNotBlank() }
    if (labels.isEmpty()) return false

    var node: Node? = root
    for (i in labels.size - 1 downTo 0) {
      if (node == null) return false
      if (node.terminal) return true
      node = node.children[labels[i]]
    }
    return node?.terminal == true
  }
}

