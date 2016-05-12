<?php
// Define Secret Token Variable
$hookSecret = $_ENV['GITHUB_SECRET_TOKEN']; // set NULL to disable check
// Define Error Handlers
set_error_handler(function($severity, $message, $file, $line) {
    throw new \ErrorException($message, 0, $severity, $file, $line);
});
set_exception_handler(function($e) {
    header('HTTP/1.1 500 Internal Server Error');
    echo "Error on line {$e->getLine()}: " . htmlSpecialChars($e->getMessage());
    die();
});
// Secret Token Validation
$rawPost = NULL;
if ($hookSecret !== NULL) {
    if (!isset($_SERVER['HTTP_X_HUB_SIGNATURE'])) {
        throw new \Exception("HTTP header 'X-Hub-Signature' is missing.");
    } elseif (!extension_loaded('hash')) {
        throw new \Exception("Missing 'hash' extension to check the secret code validity.");
    }
    list($algo, $hash) = explode('=', $_SERVER['HTTP_X_HUB_SIGNATURE'], 2) + array('', '');
    if (!in_array($algo, hash_algos(), TRUE)) {
        throw new \Exception("Hash algorithm '$algo' is not supported.");
    }
    $rawPost = file_get_contents('php://input');
    if ($hash !== hash_hmac($algo, $rawPost, $hookSecret)) {
        throw new \Exception('Hook secret does not match.');
    }
};
// Parse Github Payload Data - only supports Content-Type => application/json
$json = $rawPost ?: file_get_contents('php://input');
$payload = json_decode($json);
// Payload structure depends on triggered event
switch (strtolower($_SERVER['HTTP_X_GITHUB_EVENT'])) {
    case 'ping':
    echo 'pong';
    break;
    // If Github Repo is pushed to ... pull into production server
    case 'push':
    `git pull origin master`;
    print_r('Successfull Deploy!');
    break;
    default:
    header('HTTP/1.0 404 Not Found');
    echo "Event:$_SERVER[HTTP_X_GITHUB_EVENT] Payload:\n";
    print_r($payload); // For debug only - can be found in GitHub hook log.
    die();
}