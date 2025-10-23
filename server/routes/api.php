<?php

require_once __DIR__ . '/../app/Controllers/AuthController.php';
require_once __DIR__ . '/../app/Controllers/ExpenseController.php';
require_once __DIR__ . '/../app/Controllers/GroupController.php';
require_once __DIR__ . '/../app/Controllers/FriendController.php';
require_once __DIR__ . '/../app/Controllers/SettlementController.php';

function handleRequest($uri, $method) {
    // Remove query string
    $uri = strtok($uri, '?');
    
    // Parse route
    $segments = explode('/', trim($uri, '/'));
    
    // Remove 'api' from segments if present
    if ($segments[0] === 'api') {
        array_shift($segments);
    }
    
    $resource = $segments[0] ?? '';
    // For auth routes, second segment is the action (register, login, sync-clerk)
    // For other routes, second segment might be ID or action
    $id = $segments[1] ?? null;
    $action = $segments[2] ?? null;
    
    // If resource is 'auth', the second segment is always the action
    if ($resource === 'auth') {
        $action = $segments[1] ?? null;
        $id = null;
    }
    
    try {
        // Auth routes (public)
        if ($resource === 'auth') {
            $controller = new AuthController();
            
            switch ($action) {
                case 'register':
                    if ($method === 'POST') {
                        $controller->register();
                    }
                    break;
                    
                case 'login':
                    if ($method === 'POST') {
                        $controller->login();
                    }
                    break;
                    
                case 'me':
                    if ($method === 'GET') {
                        $controller->me();
                    }
                    break;
                    
                case 'sync-clerk':
                    if ($method === 'POST') {
                        $controller->syncClerkUser();
                    }
                    break;
                    
                default:
                    Response::notFound('Auth endpoint not found');
            }
        }
        
        // Expense routes
        elseif ($resource === 'expenses') {
            $controller = new ExpenseController();
            
            if ($id && $method === 'GET') {
                $controller->show($id);
            } elseif ($id && $method === 'PUT') {
                $controller->update($id);
            } elseif ($id && $method === 'DELETE') {
                $controller->delete($id);
            } elseif ($method === 'GET') {
                $controller->index();
            } elseif ($method === 'POST') {
                $controller->store();
            } else {
                Response::notFound('Expense endpoint not found');
            }
        }
        
        // Group routes
        elseif ($resource === 'groups') {
            $controller = new GroupController();
            
            if ($id && $action === 'expenses' && $method === 'GET') {
                $controller->getExpenses($id);
            } elseif ($id && $action === 'members' && $method === 'GET') {
                $controller->getMembers($id);
            } elseif ($id && $action === 'members' && $segments[3] && $method === 'DELETE') {
                $controller->removeMember($id, $segments[3]);
            } elseif ($id && $action === 'add-member' && $method === 'POST') {
                $controller->addMember($id);
            } elseif ($id && $method === 'DELETE') {
                $controller->delete($id);
            } elseif ($id && $method === 'GET') {
                $controller->show($id);
            } elseif ($method === 'GET') {
                $controller->index();
            } elseif ($method === 'POST') {
                $controller->store();
            } else {
                Response::notFound('Group endpoint not found');
            }
        }
        
        // Friend routes
        elseif ($resource === 'friends') {
            $controller = new FriendController();
            
            if ($action === 'balances' && $method === 'GET') {
                $controller->balances();
            } elseif ($method === 'GET') {
                $controller->index();
            } elseif ($method === 'POST') {
                $controller->sendRequest();
            } else {
                Response::notFound('Friend endpoint not found');
            }
        }
        
        // Settlement routes
        elseif ($resource === 'settlements') {
            $controller = new SettlementController();
            
            if ($action === 'calculate' && $method === 'GET') {
                $controller->calculateBalances();
            } elseif ($method === 'GET') {
                $controller->index();
            } elseif ($method === 'POST') {
                $controller->store();
            } else {
                Response::notFound('Settlement endpoint not found');
            }
        }
        
        // Health check
        elseif ($resource === 'health' || $resource === '') {
            Response::success([
                'status' => 'ok',
                'timestamp' => date('Y-m-d H:i:s')
            ], 'API is running');
        }
        
        else {
            Response::notFound('Resource not found');
        }
        
    } catch (Exception $e) {
        Response::serverError('Server error: ' . $e->getMessage());
    }
}
