<?php

require_once __DIR__ . '/../../config/database.php';

class Group {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function findById($id) {
        $group = $this->db->fetchOne(
            "SELECT g.*, u.name as created_by_name,
                COUNT(DISTINCT gm.id) as member_count,
                COUNT(DISTINCT e.id) as expense_count,
                COALESCE(SUM(e.amount), 0) as total_spent
            FROM `groups` g
            LEFT JOIN users u ON g.created_by = u.id
            LEFT JOIN group_members gm ON g.id = gm.group_id
            LEFT JOIN expenses e ON g.id = e.group_id
            WHERE g.id = ?
            GROUP BY g.id",
            [$id]
        );
        
        if ($group) {
            $group['members'] = $this->getMembers($id);
        }
        
        return $group;
    }
    
    public function findByUser($userId) {
        $groups = $this->db->fetchAll("
            SELECT g.*, u.name as created_by_name,
                COUNT(DISTINCT gm.id) as member_count,
                COUNT(DISTINCT e.id) as expense_count,
                COALESCE(SUM(e.amount), 0) as total_spent
            FROM `groups` g
            JOIN group_members gm ON g.id = gm.group_id
            LEFT JOIN users u ON g.created_by = u.id
            LEFT JOIN expenses e ON g.id = e.group_id
            WHERE gm.user_id = ?
            GROUP BY g.id
            ORDER BY g.created_at DESC
        ", [$userId]);
        
        foreach ($groups as &$group) {
            $group['members'] = $this->getMembers($group['id']);
        }
        
        return $groups;
    }
    
    public function create($data) {
        $this->db->execute(
            "INSERT INTO `groups` (name, description, created_by, image) VALUES (?, ?, ?, ?)",
            [
                $data['name'],
                $data['description'] ?? null,
                $data['created_by'],
                $data['image'] ?? null
            ]
        );
        
        $groupId = $this->db->lastInsertId();
        
        // Add creator as admin
        $this->addMember($groupId, $data['created_by'], 'admin');
        
        return $this->findById($groupId);
    }
    
    public function update($id, $data) {
        $fields = [];
        $values = [];
        
        $allowedFields = ['name', 'description', 'image'];
        
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
            "UPDATE `groups` SET " . implode(', ', $fields) . " WHERE id = ?",
            $values
        );
        
        return $this->findById($id);
    }
    
    public function delete($id) {
        // Members and expenses will be deleted automatically due to CASCADE
        return $this->db->execute("DELETE FROM `groups` WHERE id = ?", [$id]);
    }
    
    public function getMembers($groupId) {
        return $this->db->fetchAll(
            "SELECT u.id, u.name, u.email, u.phone, u.avatar, gm.role, gm.joined_at
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = ?
            ORDER BY gm.role DESC, u.name",
            [$groupId]
        );
    }
    
    public function addMember($groupId, $userId, $role = 'member') {
        // Check if already member
        $existing = $this->db->fetchOne(
            "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
            [$groupId, $userId]
        );
        
        if ($existing) {
            return false;
        }
        
        return $this->db->execute(
            "INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)",
            [$groupId, $userId, $role]
        );
    }
    
    public function removeMember($groupId, $userId) {
        return $this->db->execute(
            "DELETE FROM group_members WHERE group_id = ? AND user_id = ?",
            [$groupId, $userId]
        );
    }
    
    public function isMember($groupId, $userId) {
        $result = $this->db->fetchOne(
            "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
            [$groupId, $userId]
        );
        
        return $result !== false;
    }
    
    public function isAdmin($groupId, $userId) {
        $result = $this->db->fetchOne(
            "SELECT id FROM group_members WHERE group_id = ? AND user_id = ? AND role = 'admin'",
            [$groupId, $userId]
        );
        
        return $result !== false;
    }
    
    public function getExpenses($groupId) {
        $expenses = $this->db->fetchAll(
            "SELECT e.*, u.name as paid_by_name, e.category as category_name
            FROM expenses e
            LEFT JOIN users u ON e.paid_by = u.id
            WHERE e.group_id = ?
            ORDER BY e.created_at DESC",
            [$groupId]
        );
        
        // Add splits to each expense
        foreach ($expenses as &$expense) {
            $expense['splits'] = $this->db->fetchAll(
                "SELECT es.*, u.name as user_name
                FROM expense_splits es
                LEFT JOIN users u ON es.user_id = u.id
                WHERE es.expense_id = ?",
                [$expense['id']]
            );
        }
        
        return $expenses;
    }
}
