<?php

require_once __DIR__ . '/../../config/database.php';

class Expense {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function findById($id) {
        $expense = $this->db->fetchOne(
            "SELECT e.*, u.name as paid_by_name, e.category as category_name, g.name as group_name
            FROM expenses e
            LEFT JOIN users u ON e.paid_by = u.id
            LEFT JOIN `groups` g ON e.group_id = g.id
            WHERE e.id = ?",
            [$id]
        );
        
        if ($expense) {
            $expense['splits'] = $this->getSplits($id);
        }
        
        return $expense;
    }
    
    public function findByUser($userId) {
        $expenses = $this->db->fetchAll("
            SELECT DISTINCT e.*, 
                u.name as paid_by_name,
                e.category as category_name,
                g.name as group_name
            FROM expenses e
            LEFT JOIN users u ON e.paid_by = u.id
            LEFT JOIN `groups` g ON e.group_id = g.id
            LEFT JOIN expense_splits es ON e.id = es.expense_id
            WHERE e.paid_by = ? OR es.user_id = ?
            ORDER BY e.created_at DESC
        ", [$userId, $userId]);
        
        foreach ($expenses as &$expense) {
            $expense['splits'] = $this->getSplits($expense['id']);
        }
        
        return $expenses;
    }
    
    public function findByGroup($groupId) {
        $expenses = $this->db->fetchAll(
            "SELECT e.*, u.name as paid_by_name, e.category as category_name
            FROM expenses e
            LEFT JOIN users u ON e.paid_by = u.id
            WHERE e.group_id = ?
            ORDER BY e.created_at DESC",
            [$groupId]
        );
        
        foreach ($expenses as &$expense) {
            $expense['splits'] = $this->getSplits($expense['id']);
        }
        
        return $expenses;
    }
    
    public function create($data) {
        $this->db->execute(
            "INSERT INTO expenses (description, amount, paid_by, category, split_type, group_id, notes, receipt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $data['description'],
                $data['amount'],
                $data['paid_by'],
                $data['category'] ?? 'other',
                $data['split_type'] ?? 'equal',
                $data['group_id'] ?? null,
                $data['notes'] ?? null,
                $data['receipt'] ?? null
            ]
        );
        
        $expenseId = $this->db->lastInsertId();
        
        // Create splits
        if (isset($data['splits']) && is_array($data['splits'])) {
            foreach ($data['splits'] as $split) {
                $this->createSplit($expenseId, $split['user_id'], $split['amount']);
            }
        }
        
        return $this->findById($expenseId);
    }
    
    public function update($id, $data) {
        $fields = [];
        $values = [];
        
        $allowedFields = ['description', 'amount', 'paid_by', 'category', 'split_type', 'group_id', 'notes', 'receipt'];
        
        foreach ($data as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $fields[] = "$key = ?";
                $values[] = $value;
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $id;
        
        $this->db->execute(
            "UPDATE expenses SET " . implode(', ', $fields) . " WHERE id = ?",
            $values
        );
        
        // Update splits if provided
        if (isset($data['splits']) && is_array($data['splits'])) {
            // Delete old splits
            $this->db->execute("DELETE FROM expense_splits WHERE expense_id = ?", [$id]);
            
            // Create new splits
            foreach ($data['splits'] as $split) {
                $this->createSplit($id, $split['user_id'], $split['amount']);
            }
        }
        
        return $this->findById($id);
    }
    
    public function delete($id) {
        return $this->db->execute("DELETE FROM expenses WHERE id = ?", [$id]);
    }
    
    public function getSplits($expenseId) {
        return $this->db->fetchAll(
            "SELECT es.*, u.name as user_name, u.email as user_email
            FROM expense_splits es
            JOIN users u ON es.user_id = u.id
            WHERE es.expense_id = ?",
            [$expenseId]
        );
    }
    
    public function createSplit($expenseId, $userId, $amount) {
        return $this->db->execute(
            "INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (?, ?, ?)",
            [$expenseId, $userId, $amount]
        );
    }
    
    public function getUserBalance($userId, $friendId = null) {
        if ($friendId) {
            // Balance with specific friend
            $theyOwe = $this->db->fetchOne("
                SELECT COALESCE(SUM(es.amount), 0) as total
                FROM expense_splits es
                JOIN expenses e ON es.expense_id = e.id
                WHERE e.paid_by = ? AND es.user_id = ?
            ", [$userId, $friendId]);
            
            $iOwe = $this->db->fetchOne("
                SELECT COALESCE(SUM(es.amount), 0) as total
                FROM expense_splits es
                JOIN expenses e ON es.expense_id = e.id
                WHERE e.paid_by = ? AND es.user_id = ?
            ", [$friendId, $userId]);
            
            return [
                'they_owe' => $theyOwe['total'],
                'i_owe' => $iOwe['total'],
                'balance' => $theyOwe['total'] - $iOwe['total']
            ];
        }
        
        // Total balance
        $totalOwed = $this->db->fetchOne("
            SELECT COALESCE(SUM(es.amount), 0) as total
            FROM expense_splits es
            JOIN expenses e ON es.expense_id = e.id
            WHERE e.paid_by = ? AND es.user_id != ?
        ", [$userId, $userId]);
        
        $totalOwe = $this->db->fetchOne("
            SELECT COALESCE(SUM(es.amount), 0) as total
            FROM expense_splits es
            JOIN expenses e ON es.expense_id = e.id
            WHERE e.paid_by != ? AND es.user_id = ?
        ", [$userId, $userId]);
        
        return [
            'total_owed_to_me' => $totalOwed['total'],
            'total_i_owe' => $totalOwe['total'],
            'net_balance' => $totalOwed['total'] - $totalOwe['total']
        ];
    }
}
