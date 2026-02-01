import json

try:
    with open('api_v1_openapi.json', 'r') as f:
        data = json.load(f)

    print(f"OpenAPI Version: {data.get('openapi')}")
    paths = data.get('paths', {})
    
    print("\n--- Tournament Paths ---")
    for path, methods in paths.items():
        if 'tournaments' in path and 'get' in methods:
            sec = methods['get'].get('security', 'None')
            print(f"path: {path}, security: {sec}")

    print("\n--- Public GET Paths ---")
    for path, methods in paths.items():
        if 'get' in methods and methods['get'].get('security') is None:
            print(f"path: {path}")

except Exception as e:
    print(e)
