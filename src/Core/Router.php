<!-- EJEMPLO DEL ARCHIV -->

<?php

namespace App\Core;

class Router {
    protected static $routes = [];

    public static function add($method, $route, $handler) {
        $route = trim($route, '/');
        self::$routes[$method][$route] = $handler;
    }

    public static function get($route, $handler) {
        self::add('GET', $route, $handler);
    }

    public static function post($route, $handler) {
        self::add('POST', $route, $handler);
    }

    public static function run() {
        $uri = $_SERVER['REQUEST_URI'];
        $method = $_SERVER['REQUEST_METHOD'];

        // Remove query parameters from URI
        if (false !== $pos = strpos($uri, '?')) {
            $uri = substr($uri, 0, $pos);
        }
        $uri = trim($uri, '/');

        if (isset(self::$routes[$method][$uri])) {
            $handler = self::$routes[$method][$uri];
            if (is_callable($handler)) {
                call_user_func($handler);
            } elseif (is_string($handler) && strpos($handler, '@') !== false) {
                list($class, $methodName) = explode('@', $handler);
                $class = "App\\Controllers\\" . $class; // Assuming controllers are in App\Controllers namespace
                if (class_exists($class)) {
                    $controller = new $class();
                    if (method_exists($controller, $methodName)) {
                        $controller->$methodName();
                    } else {
                        http_response_code(404);
                        echo "Método no encontrado: $methodName en $class";
                    }
                } else {
                    http_response_code(404);
                    echo "Clase no encontrada: $class";
                }
            } else {
                http_response_code(500);
                echo "Manejador de ruta inválido.";
            }
        } else {
            http_response_code(404);
            echo "Ruta no encontrada.";
        }
    }
}