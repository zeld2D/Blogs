<?php

class Post{
    protected $gm, $pdo, $get;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
        $this->gm = new GlobalMethods($pdo);
        $this->get = new Get($pdo);
    }

public function addPost($data) {
        try {
            // Validate required fields
            if (!isset($data->user_id) || !isset($data->title) || !isset($data->content) || !isset($data->status) || !isset($data->createdBy)) {
                throw new Exception("Missing required parameters.");
            }

            // Prepare data for database insertion
            $insertData = [
                'user_id' => $data->user_id,
                'title' => $data->title,
                'content' => $data->content,
                'status' => $data->status,
                'created_by' => $data->createdBy, // Correctly add 'created_by' to the array
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            // Insert into database using GlobalMethods insert method
            $insertResult = $this->gm->insert('posts', $insertData);

            // Check insertion result
            if ($insertResult['code'] !== 200) {
                throw new Exception("Error inserting data into database: " . $insertResult['errmsg']);
            }

            return ["code" => 200, "message" => "Post added successfully."];
        } catch (Exception $e) {
            return ["code" => 500, "message" => $e->getMessage()];
        }
    }



public function editPost($data) {
    try {
        error_log("Received data: " . json_encode($data));

        if (!isset($data->post_id) || !isset($data->title) || !isset($data->content) || !isset($data->status) || !isset($data->created_by)) {
            throw new Exception("Missing required parameters.");
        }

        $updateData = [
            'title' => $data->title,
            'content' => $data->content,
            'status' => $data->status,
            'created_by' => $data->created_by
        ];

        error_log("Update data: " . json_encode($updateData));

        $sql = "UPDATE posts SET title = :title, content = :content, status = :status, created_by = :created_by WHERE post_id = :post_id";
        $stmt = $this->pdo->prepare($sql);

        $stmt->bindParam(':title', $updateData['title']);
        $stmt->bindParam(':content', $updateData['content']);
        $stmt->bindParam(':status', $updateData['status']);
        $stmt->bindParam(':created_by', $updateData['created_by']);
        $stmt->bindParam(':post_id', $data->post_id);

        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            throw new Exception("No rows updated. Post ID may not exist.");
        }

        return ["code" => 200, "message" => "Post updated successfully."];
    } catch (Exception $e) {
        error_log("Exception: " . $e->getMessage());
        return ["code" => 500, "message" => "Error updating post: " . $e->getMessage()];
    }
}

public function deletePost($data) {
    try {
        // Check if post_id is present
        if (!isset($data->post_id)) {
            throw new Exception("Post ID not provided.");
        }

        // Perform deletion from database
        $deleteResult = $this->gm->delete('posts', [], "post_id = {$data->post_id}");

        // Check deletion result
        if ($deleteResult['code'] !== 200) {
            throw new Exception("Error deleting post record: " . $deleteResult['errmsg']);
        }

        return ["code" => 200, "message" => "Post deleted successfully."];
    } catch (Exception $e) {
        return ["code" => 500, "message" => "Error deleting post: " . $e->getMessage()];
    }
}

public function addComment($data) {
    try {
        // Validate required fields
        if (!isset($data->user_id) || !isset($data->username) || !isset($data->post_id) || !isset($data->comment_text)) {
            throw new Exception("Missing required parameters.");
        }

        // Prepare data for database insertion
        $insertData = [
            'user_id' => $data->user_id,
            'username' => $data->username,
            'post_id' => $data->post_id, 
            'comment_text' => $data->comment_text,
            'created_at' => date('Y-m-d H:i:s') 
        ];

        // Insert into database using GlobalMethods insert method
        $insertResult = $this->gm->insert('comments', $insertData); // Adjust table name here

        // Check insertion result
        if ($insertResult['code'] !== 200) {
            throw new Exception("Error inserting data into database: " . $insertResult['errmsg']);
        }

        return ["code" => 200, "message" => "Comment added successfully."];
    } catch (Exception $e) {
        return ["code" => 500, "message" => "" . $e->getMessage()];
    }
}

public function editComment($data) {
    try {
        // Check if all required fields are present and accessible as properties
        if (!isset($data->comment_id) || !isset($data->comment_text)) {
            throw new Exception("Missing required parameters.");
        }

        // Prepare data for database update
        $updateData = [
            'comment_text' => $data->comment_text
            // Add any other fields you may need to update
        ];

        // Construct condition for update
        $condition = "comment_id = {$data->comment_id}";

        // Call the edit method from GlobalMethods to update the comment
        $updateResult = $this->gm->edit('comments', $updateData, $condition);

        // Check update result
        if ($updateResult['code'] !== 200) {
            throw new Exception("Error updating comment: " . $updateResult['errmsg']);
        }

        // Return updated comment text or confirmation message
        return ["code" => 200, "message" => "Comment updated successfully.", "updated_comment_text" => $data->comment_text];
    } catch (Exception $e) {
        return ["code" => 500, "message" => "Error updating comment: " . $e->getMessage()];
    }
}

public function deleteComment($data) {
    try {
        // Check if all required fields are present and accessible as properties
        if (!isset($data->comment_id)) {
            throw new Exception("Comment ID not provided.");
        }

        // Perform deletion from database using GlobalMethods delete method
        $deleteResult = $this->gm->delete('comments', [], "comment_id = {$data->comment_id}");

        // Check deletion result
        if ($deleteResult['code'] !== 200) {
            throw new Exception("Error deleting comment record: " . $deleteResult['errmsg']);
        }

        return ["code" => 200, "message" => "Comment deleted successfully."];
    } catch (Exception $e) {
        return ["code" => 500, "message" => "Error deleting comment: " . $e->getMessage()];
    }
}



}
?>
