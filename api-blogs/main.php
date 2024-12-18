<?php 
	require_once("./config/Config.php");
	$db = new Connection();
	$pdo = $db->connect();
	$gm = new GlobalMethods($pdo);
	$post = new Post($pdo);
	$get = new Get($pdo);
	$auth = new Auth($pdo);
	
	if (isset($_REQUEST['request'])) {
		$req = explode('/', rtrim($_REQUEST['request'], '/'));
	} else {
		$req = array("errorcatcher");
	}
	
	switch($_SERVER['REQUEST_METHOD']) {
		case 'POST':
			switch($req[0]) {
				case 'register':
					$d = json_decode(base64_decode(file_get_contents("php://input")));
					echo json_encode($auth->register($d), JSON_PRETTY_PRINT);
				break;
				case 'login':
					$d = json_decode(base64_decode(file_get_contents("php://input")));
					echo json_encode($auth->login($d), JSON_PRETTY_PRINT);
				break;
	
				case 'addpost':
					$d = json_decode(base64_decode(file_get_contents("php://input")));
					echo json_encode($post->addPost($d), JSON_PRETTY_PRINT); 
				break;
	          case 'editPost':
					$input = file_get_contents("php://input");
					error_log("Raw input: " . $input);
					$d = json_decode($input);
					error_log("Decoded data: " . json_encode($d));
					echo json_encode($post->editPost($d), JSON_PRETTY_PRINT);
					break;
	
				case 'deletePost':
					$d = json_decode(base64_decode(file_get_contents("php://input")));
					echo json_encode($post->deletePost($d), JSON_PRETTY_PRINT);
				break;
				
				case 'addComment':
					$d = json_decode(base64_decode(file_get_contents("php://input")));
					echo json_encode($post->addComment($d), JSON_PRETTY_PRINT);
				break;
				case 'deleteComment':
					$d = json_decode(base64_decode(file_get_contents("php://input")));
					echo json_encode($post->deleteComment($d), JSON_PRETTY_PRINT);
					break;
				case 'editComment':
					$d = json_decode(base64_decode(file_get_contents("php://input")));
					echo json_encode($post->editComment($d), JSON_PRETTY_PRINT);
					break;
			}
		break;
	
		case 'GET':
			switch ($req[0]) {
				case 'getImages':
					echo json_encode($get->getImages(), JSON_PRETTY_PRINT);
				break;
				case 'getComments':
					echo json_encode($get->getComments(), JSON_PRETTY_PRINT);
				break;

				case 'getPosts':
					echo json_encode($get->getPosts(), JSON_PRETTY_PRINT);
				break;
				case 'getPost':
					if (isset($req[1])) {
						$post = $get->getPost($req[1]);
						if ($post) {
							echo json_encode($post, JSON_PRETTY_PRINT);
						} else {
							echo json_encode(['error' => 'Post not found'], JSON_PRETTY_PRINT);
						}
					} else {
						echo json_encode(['error' => 'Post ID not provided'], JSON_PRETTY_PRINT);
					}
					break;
				
				default:
					echo json_encode(['error' => 'Invalid request']);
			}
		break;
	}
?>