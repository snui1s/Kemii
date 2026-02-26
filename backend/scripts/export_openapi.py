import sys
import os
import json

# Add backend directory to sys.path so we can import app
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from main import app

def export_openapi():
    openapi_data = app.openapi()
    
    # Save to file
    output_path = os.path.join(os.path.dirname(__file__), "..", "openapi.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(openapi_data, f, indent=2)
    
    print(f"OpenAPI spec exported to {output_path}")

if __name__ == "__main__":
    export_openapi()
