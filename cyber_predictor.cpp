/**
 * @fileoverview C++ Game Prediction Engine for Cyber Rock Paper Scissors.
 * Uses a Trie data structure to implement a sliding-window N-Gram prediction algorithm.
 * Exposes WebAssembly bindings via Emscripten.
 * @author Sarthak Singh
 */

#include <string>
#include <unordered_map>
#include <vector>
#include <algorithm>
#include <cstdlib>
#include <ctime>

#ifdef EMSCRIPTEN
#include <emscripten/bind.h>
#endif

/**
 * Node structure for the sequence-tracking Trie.
 */
struct TrieNode {
  std::unordered_map<std::string, TrieNode*> children;
  std::unordered_map<std::string, int> nextMoveCounts;
  
  ~TrieNode() {
    for (auto& pair : children) {
      delete pair.second;
    }
  }
};

/**
 * Class representing the Trie-based pattern recognition AI.
 */
class CyberPredictor {
private:
  TrieNode* root;
  std::unordered_map<std::string, int> overallFrequencies;
  int totalRounds;

  /**
   * Helper function to query the most frequent move in a counts map.
   * @param counts - The frequency map to evaluate.
   * @returns The string representation of the highest frequency move, or empty string.
   */
  std::string getMostFrequentMove(const std::unordered_map<std::string, int>& counts) {
    std::string bestMove = "";
    int maxCount = -1;
    for (const auto& pair : counts) {
      if (pair.second > maxCount) {
        maxCount = pair.second;
        bestMove = pair.first;
      }
    }
    return bestMove;
  }

public:
  /**
   * Create a new CyberPredictor.
   */
  CyberPredictor() {
    root = new TrieNode();
    totalRounds = 0;
    std::srand(std::time(nullptr));
  }

  /**
   * Destructor to clean up Trie memory.
   */
  ~CyberPredictor() {
    delete root;
  }

  /**
   * Reset all collected history telemetry in the Trie.
   */
  void reset() {
    delete root;
    root = new TrieNode();
    overallFrequencies.clear();
    totalRounds = 0;
  }

  /**
   * Record a sliding-window sequence of player moves in the Trie.
   * @param m1 - Player move two rounds ago (oldest).
   * @param m2 - Player move in the previous round.
   * @param nextMove - Player move in the current round.
   */
  void recordMoveSequence(const std::string& m1, const std::string& m2, const std::string& nextMove) {
    if (nextMove.empty()) return;

    overallFrequencies[nextMove]++;
    totalRounds++;

    // 1. Store length 1 sequence: root -> m2 -> nextMove
    if (!m2.empty()) {
      if (root->children.find(m2) == root->children.end()) {
        root->children[m2] = new TrieNode();
      }
      root->children[m2]->nextMoveCounts[nextMove]++;

      // 2. Store length 2 sequence: root -> m1 -> m2 -> nextMove
      if (!m1.empty()) {
        if (root->children.find(m1) == root->children.end()) {
          root->children[m1] = new TrieNode();
        }
        TrieNode* n1 = root->children[m1];
        if (n1->children.find(m2) == n1->children.end()) {
          n1->children[m2] = new TrieNode();
        }
        n1->children[m2]->nextMoveCounts[nextMove]++;
      }
    }
  }

  /**
   * Predict the player's next move using sequence matching.
   * @param last1 - Player's most recent move (previous round).
   * @param last2 - Player's move two rounds ago.
   * @returns Predicted next move ("Rock", "Paper", or "Scissors").
   */
  std::string predictNextMove(const std::string& last1, const std::string& last2) {
    // Stage 1: Try length-2 pattern lookup (last2 -> last1 -> ?)
    if (!last2.empty() && !last1.empty()) {
      auto it1 = root->children.find(last2);
      if (it1 != root->children.end()) {
        TrieNode* n1 = it1->second;
        auto it2 = n1->children.find(last1);
        if (it2 != n1->children.end()) {
          TrieNode* n2 = it2->second;
          std::string prediction = getMostFrequentMove(n2->nextMoveCounts);
          if (!prediction.empty()) return prediction;
        }
      }
    }

    // Stage 2: Fallback to length-1 pattern lookup (last1 -> ?)
    if (!last1.empty()) {
      auto it = root->children.find(last1);
      if (it != root->children.end()) {
        TrieNode* n1 = it->second;
        std::string prediction = getMostFrequentMove(n1->nextMoveCounts);
        if (!prediction.empty()) return prediction;
      }
    }

    // Stage 3: Fallback to player's overall most frequent move
    std::string prediction = getMostFrequentMove(overallFrequencies);
    if (!prediction.empty()) return prediction;

    // Stage 4: Ultimate fallback to random choice
    std::vector<std::string> options = {"Rock", "Paper", "Scissors"};
    return options[std::rand() % 3];
  }
};

// Emscripten bindings for WebAssembly compilation
#ifdef EMSCRIPTEN
using namespace emscripten;

EMSCRIPTEN_BINDINGS(cyber_predictor_module) {
  class_<CyberPredictor>("CyberPredictor")
    .constructor()
    .function("reset", &CyberPredictor::reset)
    .function("recordMoveSequence", &CyberPredictor::recordMoveSequence)
    .function("predictNextMove", &CyberPredictor::predictNextMove);
}
#endif
