<?php
	class Auth {
		protected $gm;
		protected $pdo;
    

		public function __construct(\PDO $pdo) {
			$this->gm = new GlobalMethods($pdo);
			$this->pdo = $pdo;
		}
		
		########################################
		# 	USER AUTHORIZATION RELATED METHODS
		########################################
		protected function generateHeader() {
			$h=[
				"typ"=>"JWT",
				"alg"=>'HS256',
				"app"=>"Tinda",
				"dev"=>", "
			];
			return str_replace(['+','/','='],['-','_',''], base64_encode(json_encode($h)));
		}

		protected function generatePayload($uid, $un, $fn) {
			$p = [   
				'uid'=>$uid,
				'un'=>$un,
				'fn'=>$fn,
				'iby'=>'',
				'ie'=>'',
				'idate'=>date_create()
			];
			return str_replace(['+','/','='],['-','_',''], base64_encode(json_encode($p)));
		}

		protected function generateToken($userid, $uname, $fullname) {
			$header = $this->generateHeader();
			$payload = $this->generatePayload($userid, $uname, $fullname);
			$signature = hash_hmac('sha256', "$header.$payload", "");
			return str_replace(['+','/','='],['-','_',''], base64_encode($signature));
		}

        ########################################
		# 	USER AUTHENTICATION RELATED METHODS
		########################################
		public function encrypt_password($pword) {
			$hashFormat="$2y$10$";
		    $saltLength=22;
		    $salt=$this->generate_salt($saltLength);
		    return crypt($pword,$hashFormat.$salt);
		}


        protected function generate_salt($len) {
			$urs=md5(uniqid(mt_rand(), true));
	    $b64String=base64_encode($urs);
	    $mb64String=str_replace('+','.', $b64String);
	    return substr($mb64String,0,$len);
		}

        public function pword_check($pword, $existingHash) {
			$hash=crypt($pword, $existingHash);
			if($hash===$existingHash){
				return true;
			}
			return false;
		}


		public function register($dt) {
			$payload = "";
			$remarks = "";
			$message = "";
			
			// Extracting user inputs from $dt object
			$username = $dt->username;
			$email = $dt->email;
			$password = $dt->password;
		
			// Encrypting password
			$encryptedPassword = $this->encrypt_password($password);
		
		
			// Creating payload with user inputs
			$payload = array(
				'username' => $username,
				'password' => $encryptedPassword,
			);
		
			// SQL query to insert user data into database
			$sql = "INSERT INTO users(username, email, password) 
					VALUES ('$username', '$email', '$encryptedPassword')";
		
			$data = array(); 
			$code = 0; 
			$errmsg = "";
		
			try {
				// Execute SQL query
				if ($this->pdo->query($sql)) {
					$code = 200; 
					$message = "Successfully Registered User"; 
					$remarks = "success";
					return array("code" => 200, "remarks" => "success");
				}
			} catch (\PDOException $e) {
				$errmsg = $e->getMessage();
				$code = 403;
			}
		
			// Return response
			return $this->gm->sendPayload($payload, $remarks, $message, $code);                
		}


		public function login($dt){
			$payload = $dt;
			$email = $dt->email;
			$password = $dt->password;
			$payload = "";
			$remarks = "";
			$message = "";
			$code = 0;
		
			// Check if the user is an admin
			$sql = "SELECT * FROM users WHERE email='$email' LIMIT 1";
			$res = $this->gm->generalQuery($sql, "Incorrect username or password");
			if($res['code'] == 200) {
				$user_id = $res['data'][0]['user_id'];
				$email = $res['data'][0]['email'];
				$username = $res['data'][0]['username'];
		
				if($this->pword_check($password, $res['data'][0]['password'])) {
					$code = 200;
					$remarks = "Success";
					$message = "Logged in successfully";
					$payload = array("user_id" => $user_id, "email" => $email, "username" => $username);
				} else {
					$payload = null; 
					$remarks = "failed"; 
					$message = "Incorrect username or password";
				}
			}else {
				$payload = null; 
				$remarks = "failed"; 
				$message = "Incorrect username or password";
			}
			return $this->gm->sendPayload($payload, $remarks, $message, $code);
		}	

		
    }
?>