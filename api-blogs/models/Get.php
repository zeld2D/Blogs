<?php

class Get {
    protected $gm, $pdo;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
        $this->gm = new GlobalMethods($pdo);
    }
 

    public function getComments() {
        $sql = "SELECT * FROM comments ORDER BY created_at DESC"; // Adjust query as needed
        $res = $this->gm->generalQuery($sql, "No comments found.");
        if ($res['code'] == 200) {
            return $res['data']; // Return the fetched comments data
        } else {
            return []; // Return an empty array if no comments found or error occurred
        }
    }

    public function getPosts() {
        $sql = "SELECT * FROM posts ORDER BY created_at DESC"; // Adjust query as needed
        $res = $this->gm->generalQuery($sql, "No posts found.");
        if ($res['code'] == 200) {
            return $res['data']; // Return the fetched posts data
        } else {
            return []; // Return an empty array if no posts found or error occurred
        }
    }

    public function getPost($id) {
        $sql = "SELECT * FROM posts WHERE post_id = ?";
    
        error_log("Executing SQL: $sql with ID: $id");
    
        $res = $this->gm->generalQuery($sql, "No post found.", [$id]);
        
        error_log("Query result: " . print_r($res, true));
    
        if ($res['code'] == 200 && !empty($res['data'])) {
            return $res['data'][0];
        } else {
            return null;
        }
    }
    
    
}

?>
