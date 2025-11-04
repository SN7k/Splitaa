<?php

require_once __DIR__ . '/../../config/database.php';

class GroupInvite {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Generate a unique invite token
     */
    private function generateToken() {
        return bin2hex(random_bytes(32));
    }
    
    /**
     * Create a new invite link for a group
     */
    public function create($data) {
        $token = $this->generateToken();
        
        $sql = "INSERT INTO group_invites (group_id, token, created_by, expires_at, max_uses, is_active) 
                VALUES (?, ?, ?, ?, ?, 1)";
        
        $params = [
            $data['group_id'],
            $token,
            $data['created_by'],
            $data['expires_at'] ?? null,
            $data['max_uses'] ?? null
        ];
        
        $this->db->execute($sql, $params);
        
        return $this->findByToken($token);
    }
    
    /**
     * Find invite by token
     */
    public function findByToken($token) {
        $sql = "SELECT gi.*, g.name as group_name, u.name as creator_name
                FROM group_invites gi
                JOIN `groups` g ON gi.group_id = g.id
                JOIN users u ON gi.created_by = u.id
                WHERE gi.token = ?";
        
        return $this->db->fetchOne($sql, [$token]);
    }
    
    /**
     * Find active invites for a group
     */
    public function findByGroupId($groupId) {
        $sql = "SELECT gi.*, u.name as creator_name
                FROM group_invites gi
                JOIN users u ON gi.created_by = u.id
                WHERE gi.group_id = ? AND gi.is_active = 1
                ORDER BY gi.created_at DESC";
        
        return $this->db->fetchAll($sql, [$groupId]);
    }
    
    /**
     * Validate an invite token
     */
    public function validateToken($token) {
        $invite = $this->findByToken($token);
        
        if (!$invite) {
            return ['valid' => false, 'reason' => 'Invalid invite link'];
        }
        
        if (!$invite['is_active']) {
            return ['valid' => false, 'reason' => 'This invite link has been disabled'];
        }
        
        // Check if expired
        if ($invite['expires_at'] && strtotime($invite['expires_at']) < time()) {
            return ['valid' => false, 'reason' => 'This invite link has expired'];
        }
        
        // Check if max uses reached
        if ($invite['max_uses'] && $invite['current_uses'] >= $invite['max_uses']) {
            return ['valid' => false, 'reason' => 'This invite link has reached its maximum number of uses'];
        }
        
        return ['valid' => true, 'invite' => $invite];
    }
    
    /**
     * Increment usage count
     */
    public function incrementUsage($token) {
        $sql = "UPDATE group_invites 
                SET current_uses = current_uses + 1
                WHERE token = ?";
        
        return $this->db->execute($sql, [$token]);
    }
    
    /**
     * Deactivate an invite
     */
    public function deactivate($id) {
        $sql = "UPDATE group_invites 
                SET is_active = 0
                WHERE id = ?";
        
        return $this->db->execute($sql, [$id]);
    }
    
    /**
     * Delete an invite
     */
    public function delete($id) {
        $sql = "DELETE FROM group_invites WHERE id = ?";
        return $this->db->execute($sql, [$id]);
    }
    
    /**
     * Check if user has permission to manage invites for a group
     */
    public function canManageInvites($groupId, $userId) {
        $sql = "SELECT COUNT(*) as count 
                FROM group_members 
                WHERE group_id = ? AND user_id = ?";
        
        $result = $this->db->fetchOne($sql, [$groupId, $userId]);
        return $result && $result['count'] > 0;
    }
}
